// Witney Wire V060 · National Highways road closures · staging implementation.
// WARNING: No live feed until TRAVEL_PUBLISH_ENABLED="true", after editorial acceptance.
// Cloudflare secret: NATIONAL_HIGHWAYS_API_KEY. KV binding: TRAVEL_KV.
// Configure the cron trigger separately: */30 * * * * (UTC).
const API='https://api.data.nationalhighways.co.uk/roads/v2.0/closures';
const SNAPSHOT='v060-road-closures';
const RUN_STATUS='v060-road-closures-run-status';
const REVIEW='v063-road-closures-review';
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
// Conservative named-location verification. An approximate county bounding box alone
// must never authorise publishing a road notice.
function localPlace(text,road){
 const str=String(text||'').toLowerCase();
 const places=road==='A40'
  ? ['witney','eynsham','cassington','wheatley','headington','north hinksey','botley','oxford']
  : ['wheatley','bicester','ardley','banbury','stokenchurch','junction 8a','junction 9','junction 10','junction 11','j8a','j9','j10','j11'];
 return places.find(place=>str.includes(place))||null;
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
   const road=matched[0];
   // The DATEX II record identity is an XML attribute, not normally an <id> element.
   // Candidate diagnostics must not reject otherwise valid records for this reason.
   // No fabricated junction, place or diversion. Geometry alone does not verify the county.
   const description=values(rec,'locationDescription')[0]||null;
   if(!description){stats.rejected++;continue;}
   const locality=localPlace(description,road);
   // Require explicit route, place, valid dates and intersecting official geometry.
   if(!locality){stats.rejected++;continue;}
   const safeDescription=description.slice(0,220);
   const key=[type,road,safeDescription,start,end].join('|');
   notices.push({id:key,title:road+' — '+(status==='active'?'reported restriction':'scheduled restriction'),
    road,description:safeDescription,location:locality,
    type:status,valid_from:new Date(startMs).toISOString(),valid_until:new Date(endMs).toISOString(),
    source_url:SOURCE,source:'National Highways',geography_verified:true});
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
 const totals={road_matches:0,geographic_candidates:0,valid_candidates:0,missing_geometry:0};
 for(const row of [...planned.stats,...unplanned.stats])for(const key of Object.keys(totals))totals[key]+=row[key]||0;
 // Publishing remains explicitly opt-in, even when conservative checks pass.
 // Never publish simply because a town name appears in the description.
 // Candidate records must be inspected against actual route/junction geography first.
 const publish=false;
 const eligible=[...dedup.values()].filter(n=>n.geography_verified===true);
 const feed={schema_version:1,updated_at:new Date().toISOString(),notices:publish?eligible:[],
  staging_candidates:dedup.size,candidate_diagnostics:totals,
  validation_status:publish?'verified_for_publication':'awaiting_editorial_approval',
  publishing_enabled:publish,
  pages_checked:planned.pages+unplanned.pages};
 await env.TRAVEL_KV.put(SNAPSHOT,JSON.stringify(feed));
 await env.TRAVEL_KV.put(REVIEW,JSON.stringify({updated_at:feed.updated_at,description:'Unverified National Highways candidates — NOT for public travel advice',count:dedup.size,notices:[...dedup.values()].map(n=>({road:n.road,location:n.location,description:n.description,valid_from:n.valid_from,valid_until:n.valid_until,type:n.type,source_url:n.source_url}))}));
 await env.TRAVEL_KV.put(RUN_STATUS,JSON.stringify({state:'success',time:feed.updated_at,pages_checked:feed.pages_checked}));
 return feed;
}
export default {
 async scheduled(_controller,env,ctx){
  ctx.waitUntil((async()=>{
   try {await refresh(env);}
   catch (error) {
    // Record failure without storing secrets, request payloads or upstream responses.
    const message=String(error?.message||'unknown');
    const reason=/^upstream_status_\d+$/.test(message)?'upstream_http_error':
      ['missing_kv_or_secret','repeated_pagination_cursor','invalid_datex','unrecognised_pagination','page_cap_hit'].includes(message)?message:'request_or_processing_error';
    console.error('Witney travel refresh failed',reason);
    if(env.TRAVEL_KV)await env.TRAVEL_KV.put(RUN_STATUS,JSON.stringify({state:'error',time:new Date().toISOString(),reason}));
   }
  })());
 },
 async fetch(request,env){
  const u=new URL(request.url),origin=request.headers.get('Origin');
  const allowed=origin===HOME||origin?.endsWith('.local-news-site.pages.dev')?origin:null;
  if(u.pathname==='/run-now'){
   if(request.method!=='POST')return json({error:'post_required'},405);
   const expected=env.ROADWATCH_RUN_TOKEN;
   const supplied=request.headers.get('X-Roadwatch-Run-Token');
   if(typeof expected!=='string'||expected.length<24||typeof supplied!=='string')
     return json({error:'unauthorised'},401);
   // Constant-time digest comparison keeps the token out of URLs and logs.
   const encoder=new TextEncoder();
   const [a,b]=await Promise.all([crypto.subtle.digest('SHA-256',encoder.encode(expected)),crypto.subtle.digest('SHA-256',encoder.encode(supplied))]);
   let different=0;const aa=new Uint8Array(a),bb=new Uint8Array(b);
   for(let i=0;i<aa.length;i++)different|=aa[i]^bb[i];
   if(different!==0)return json({error:'unauthorised'},401);
   try{
    const refreshed=await refresh(env);
    return json({ok:true,updated_at:refreshed.updated_at,candidates:refreshed.staging_candidates,
      diagnostics:refreshed.candidate_diagnostics,review_path:'/review',public_notices_enabled:false});
   }catch(error){
    return json({ok:false,error:'refresh_failed_check_health'},502);
   }
  }
  if(u.pathname==='/health'){
   const snapshot=env.TRAVEL_KV?await env.TRAVEL_KV.get(SNAPSHOT,'json'):null;
   const run=env.TRAVEL_KV?await env.TRAVEL_KV.get(RUN_STATUS,'json'):null;
   return json({ok:true,mode:'staging',last_run_status:run?.state||'not_run',last_run_at:run?.time||null,last_run_error:run?.reason||null,key_configured:!!env.NATIONAL_HIGHWAYS_API_KEY,
    kv_configured:!!env.TRAVEL_KV,last_success:snapshot?.updated_at||null,
    candidates:snapshot?.staging_candidates||0,candidate_diagnostics:snapshot?.candidate_diagnostics||null,publishing_enabled:snapshot?.publishing_enabled===true});
  }
  if(u.pathname==='/review'){
   if(!env.TRAVEL_KV)return json({error:'review_not_configured'},503);
   const review=await env.TRAVEL_KV.get(REVIEW,'json');
   return json(review||{status:'waiting_for_next_scheduled_check',notices:[]},200);
  }
  if(u.pathname==='/feed'){
   if(!env.TRAVEL_KV)return json({error:'feed_not_configured'},503,allowed);
   const snapshot=await env.TRAVEL_KV.get(SNAPSHOT,'json');
   if(!snapshot||!snapshot.updated_at||Date.now()-Date.parse(snapshot.updated_at)>75*60000)
     return json({error:'travel_feed_unavailable_or_stale'},503,allowed);
   const enabled=snapshot.publishing_enabled===true && snapshot.validation_status==='verified_for_publication';
   return json({schema_version:1,updated_at:snapshot.updated_at,
    notices:enabled&&Array.isArray(snapshot.notices)?snapshot.notices:[],
    status:enabled?'verified_for_publication':'pending_geographic_validation'},200,allowed);
  }
  return new Response('Not found',{status:404});
 }
};
