// Witney Wire V060 · National Highways road closures · staging implementation.
// WARNING: No live feed until TRAVEL_PUBLISH_ENABLED="true", after editorial acceptance.
// Cloudflare secret: NATIONAL_HIGHWAYS_API_KEY. KV binding: TRAVEL_KV.
// Configure the cron trigger separately: */30 * * * * (UTC).
const API='https://api.data.nationalhighways.co.uk/roads/v2.0/closures';
const SNAPSHOT='v060-road-closures';
const HOME='https://witneywire.co.uk';
const HEADERS={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const BOX={south:51.45,north:52.25,west:-1.78,east:-0.75}; // approximate screening ONLY
const SOURCE='https://nationalhighways.co.uk/travel-updates/';
function json(body,status=200,origin=null){
 const h={...HEADERS};if(origin)h['Access-Control-Allow-Origin']=origin;
 return new Response(JSON.stringify(body),{status,headers:h});
}
function sections(xml,tag){
 const re=new RegExp('<(?:[\\w.-]+:)?'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?'+tag+'>','gi');
 return [...xml.matchAll(re)].map(m=>m[1]);
}
function decode(s){return s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');}
function values(s,tag){return sections(s,tag).map(x=>decode(x.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim())).filter(Boolean);}
function first(s,tag){return values(s,tag)[0]||null;}
function roads(s){
 const text=['roadName','locationDescription','locationContainedInGroup'].flatMap(t=>values(s,t)).join(' ').toUpperCase();
 return ['A40','M40'].filter(t=>new RegExp('(?:^|[^A-Z0-9])'+t+'(?![0-9])').test(text));
}
function intersects(a,b){
 let t0=0,t1=1;const dx=b[1]-a[1],dy=b[0]-a[0];
 const tests=[[-dx,a[1]-BOX.west],[dx,BOX.east-a[1]],[-dy,a[0]-BOX.south],[dy,BOX.north-a[0]]];
 for(const [p,q] of tests){if(p===0){if(q<0)return false;}else{const v=q/p;if(p<0){t0=Math.max(t0,v);}else{t1=Math.min(t1,v);}if(t0>t1)return false;}}
 return true;
}
function geometry(s){
 let usable=false,near=false;
 for(const segment of sections(s,'gmlLineString').concat(sections(s,'LineString'))){
  if(!/4326/i.test(segment))continue;
  for(const raw of sections(segment,'posList')){
   const ns=raw.trim().split(/\s+/).map(Number);if(ns.length<4||ns.length%2||ns.some(n=>!Number.isFinite(n)))continue;
   const pts=[];for(let i=0;i<ns.length;i+=2){const lat=ns[i],lon=ns[i+1];if(Math.abs(lat)>90||Math.abs(lon)>180){pts.length=0;break;}pts.push([lat,lon]);}
   if(pts.length<2)continue;usable=true;
   for(let i=1;i<pts.length;i++)if(intersects(pts[i-1],pts[i]))near=true;
  }
 }
 return {usable,near};
}
function parse(xml,type){
 const notices=[],stats={read:0,road_matches:0,geographic_candidates:0,valid_candidates:0,rejected:0,missing_geometry:0};
 const now=Date.now(),maxFuture=now+30*86400000;
 for(const sit of sections(xml,'situation')){
  for(const rec of sections(sit,'situationRecord')){
   stats.read++;
   const matched=roads(rec);if(!matched.length)continue;stats.road_matches++;
   const g=geometry(rec);if(!g.usable){stats.missing_geometry++;stats.rejected++;continue;}
   if(!g.near){stats.rejected++;continue;}stats.geographic_candidates++;
   const status=(first(rec,'validityStatus')||first(sit,'validityStatus')||'').toLowerCase();
   const start=first(rec,'overallStartTime')||first(sit,'overallStartTime');
   const end=first(rec,'overallEndTime')||first(sit,'overallEndTime');
   const startMs=Date.parse(start||''),endMs=Date.parse(end||'');
   if(!['active','planned'].includes(status)||!Number.isFinite(startMs)||!Number.isFinite(endMs)||
      endMs<=startMs||endMs<=now||startMs>maxFuture){stats.rejected++;continue;}
   const road=matched[0],id=first(rec,'id')||null;
   // Do NOT publish without a stable verified record identity.
   if(!id){stats.rejected++;continue;}
   // No fabricated junction, place or diversion. Explicit geographic coordinates are only candidates.
   const description=values(rec,'locationDescription')[0]||null;
   if(!description){stats.rejected++;continue;}
   const safeDescription=description.slice(0,220);
   const key=[type,id,road,start,end].join('|');
   notices.push({id:key,title:road+' — '+(status==='active'?'reported restriction':'scheduled restriction'),
    road,description:safeDescription,location:'Approximate Oxfordshire-area candidate',
    type:status,valid_from:new Date(startMs).toISOString(),valid_until:new Date(endMs).toISOString(),
    source_url:SOURCE,source:'National Highways',geography_verified:false});
   stats.valid_candidates++;
  }
 }
 return {notices,stats};
}
function nextUrl(current,header,type){
 if(!header)return null;
 let next;try{next=new URL(header,current);}catch{return null;}
 const base=new URL(API);
 if(next.origin!==base.origin||next.pathname!==base.pathname||next.searchParams.get('closureType')!==type)return null;
 return next.href;
}
async function fetchAll(type,env){
 let url=API+'?closureType='+type,pages=0;
 const seen=new Set(),records=[],stats=[];
 while(url&&pages<3){
  if(seen.has(url))throw Error('repeated_pagination_cursor');
  seen.add(url);
  const res=await fetch(url,{headers:{'Ocp-Apim-Subscription-Key':env.NATIONAL_HIGHWAYS_API_KEY,'Accept':'application/xml'},signal:AbortSignal.timeout(22000)});
  if(!res.ok)throw Error('upstream_status_'+res.status);
  const xml=await res.text();
  if(!/<(?:[\w.-]+:)?D2Payload\b/i.test(xml))throw Error('invalid_datex');
  const parsed=parse(xml,type);records.push(...parsed.notices);stats.push(parsed.stats);pages++;
  const header=res.headers.get('x-next');
  const next=nextUrl(url,header,type);
  if(header&&!next)throw Error('unrecognised_pagination');
  url=next;
 }
 if(url)throw Error('page_cap_hit');
 return {records,stats,pages};
}
async function refresh(env){
 if(!env.TRAVEL_KV||!env.NATIONAL_HIGHWAYS_API_KEY)throw Error('missing_kv_or_secret');
 const planned=await fetchAll('planned',env);
 const unplanned=await fetchAll('unplanned',env);
 const candidates=[...planned.records,...unplanned.records];
 const dedup=new Map(candidates.map(n=>[n.id,n]));
 // Staging contract: geometry candidates are not verified county locations.
 // Therefore no public notices until a verified geospatial boundary rule is implemented and reviewed.
 const feed={schema_version:1,updated_at:new Date().toISOString(),notices:[],
  staging_candidates:dedup.size,
  validation_status:'geographical_review_required',
  publishing_enabled:false,
  pages_checked:planned.pages+unplanned.pages};
 await env.TRAVEL_KV.put(SNAPSHOT,JSON.stringify(feed));
 return feed;
}
export default {
 async scheduled(_controller,env,ctx){ctx.waitUntil(refresh(env).catch(()=>{}));},
 async fetch(request,env){
  const u=new URL(request.url),origin=request.headers.get('Origin');
  const allowed=origin===HOME||origin?.endsWith('.local-news-site.pages.dev')?origin:null;
  if(u.pathname==='/health'){
   const snapshot=env.TRAVEL_KV?await env.TRAVEL_KV.get(SNAPSHOT,'json'):null;
   return json({ok:true,mode:'staging',key_configured:!!env.NATIONAL_HIGHWAYS_API_KEY,
    kv_configured:!!env.TRAVEL_KV,last_success:snapshot?.updated_at||null,
    candidates:snapshot?.staging_candidates||0,publishing_enabled:false});
  }
  if(u.pathname==='/feed'){
   if(!env.TRAVEL_KV)return json({error:'feed_not_configured'},503,allowed);
   const snapshot=await env.TRAVEL_KV.get(SNAPSHOT,'json');
   if(!snapshot||!snapshot.updated_at||Date.now()-Date.parse(snapshot.updated_at)>75*60000)
     return json({error:'travel_feed_unavailable_or_stale'},503,allowed);
   // No public records while geographic verification is pending.
   return json({schema_version:1,updated_at:snapshot.updated_at,notices:[],
    status:'pending_geographic_validation'},200,allowed);
  }
  return new Response('Not found',{status:404});
 }
};
