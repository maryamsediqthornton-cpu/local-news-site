// Witney Wire V060 — paginated road-closure validation preview ONLY.
// Does not serve a public travel feed, publish alerts, or expose credentials.
// The geographic box is approximate, NOT an official county boundary.
const API='https://api.data.nationalhighways.co.uk/roads/v2.0/closures';
const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
const B={minLat:51.45,maxLat:52.25,minLon:-1.78,maxLon:-0.75};
function blocks(s,t){const p=new RegExp('<(?:[\\w.-]+:)?'+t+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?'+t+'>','gi');return [...s.matchAll(p)].map(m=>m[1]);}
function field(s,t){return blocks(s,t).map(x=>x.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()).filter(Boolean)[0]||null;}
function roadCodes(s){
 const content=['roadName','locationDescription','locationContainedInGroup'].flatMap(t=>blocks(s,t)).join(' ').replace(/<[^>]*>/g,' ').toUpperCase();
 return ['A40','M40'].filter(road=>new RegExp('(?:^|[^A-Z0-9])'+road+'(?![0-9])').test(content));
}
function geometry(record){
 let usable=false,candidate=false;
 for(const block of blocks(record,'gmlLineString').concat(blocks(record,'LineString'))){
  if(!/4326/i.test(block))continue;
  for(const raw of blocks(block,'posList')){
   const nums=raw.trim().split(/\s+/).map(Number);
   if(nums.length<4||nums.length%2||nums.some(x=>!Number.isFinite(x)))continue;
   const pts=[];
   for(let i=0;i<nums.length;i+=2){
    if(Math.abs(nums[i])>90||Math.abs(nums[i+1])>180){pts.length=0;break;}
    pts.push([nums[i],nums[i+1]]);
   }
   if(!pts.length)continue;
   usable=true;
   for(const [lat,lon] of pts)if(lat>=B.minLat&&lat<=B.maxLat&&lon>=B.minLon&&lon<=B.maxLon)candidate=true;
   for(let i=1;i<pts.length;i++){
    const [a,b]=[pts[i-1],pts[i]];
    if(Math.max(a[0],b[0])>=B.minLat&&Math.min(a[0],b[0])<=B.maxLat&&Math.max(a[1],b[1])>=B.minLon&&Math.min(a[1],b[1])<=B.maxLon)candidate=true;
   }
  }
 }
 return {usable,candidate};
}
function process(xml,now){
 const counts={total_records:0,road_matches:0,approximate_area_candidates:0,not_area_candidates:0,
  missing_geometry:0,date_or_status_rejected:0,review_candidates:0,road_candidates:{A40:0,M40:0},statuses:{}};
 for(const sit of blocks(xml,'situation')){
  for(const rec of blocks(sit,'situationRecord')){
   counts.total_records++;
   const roads=roadCodes(rec);if(!roads.length)continue;
   counts.road_matches++;
   const g=geometry(rec);
   if(!g.usable)counts.missing_geometry++;
   if(g.candidate){counts.approximate_area_candidates++;roads.forEach(r=>counts.road_candidates[r]++);}
   else counts.not_area_candidates++;
   const status=(field(rec,'validityStatus')||field(sit,'validityStatus')||'unknown').toLowerCase();
   counts.statuses[status]=(counts.statuses[status]||0)+1;
   const from=field(rec,'overallStartTime')||field(sit,'overallStartTime');
   const to=field(rec,'overallEndTime')||field(sit,'overallEndTime');
   const a=Date.parse(from||''),b=Date.parse(to||'');
   // Only planned/active; future start or current; no expired or invalid dates.
   const acceptable=Number.isFinite(a)&&Number.isFinite(b)&&b>a&&b>now&&
     ['planned','active'].includes(status);
   if(!acceptable)counts.date_or_status_rejected++;
   if(g.usable&&g.candidate&&acceptable)counts.review_candidates++;
  }
 }
 return counts;
}
function nextPage(current,header,type){
 if(!header)return {url:null,reason:'end_of_pages'};
 // x-next may be a raw cursor or an absolute/relative URL; never forward arbitrary URLs.
 let u;
 try{u=new URL(header,current);}catch{return {url:null,reason:'unrecognized_pagination_header'};}
 const b=new URL(API);
 if(u.origin!==b.origin||u.pathname!==b.pathname||u.searchParams.get('closureType')!==type)
  return {url:null,reason:'unrecognized_pagination_header'};
 return {url:u.href,reason:null};
}
export default {
 async fetch(request,env){
  const u=new URL(request.url);
  if(!['/health','/'].includes(u.pathname))return new Response('Not found',{status:404});
  if(!env.NATIONAL_HIGHWAYS_API_KEY)return Response.json({ok:false,stage:'missing_secret'},{status:503,headers:H});
  const type=u.searchParams.get('type')==='unplanned'?'unplanned':'planned';
  let url=API+'?closureType='+type,stop='end_of_pages';const seen=new Set(),pages=[];
  for(let i=0;i<3&&url;i++){
   if(seen.has(url)){stop='repeated_cursor';break;}seen.add(url);
   try{
    const r=await fetch(url,{headers:{'Ocp-Apim-Subscription-Key':env.NATIONAL_HIGHWAYS_API_KEY,Accept:'application/xml'},signal:AbortSignal.timeout(20000)});
    if(!r.ok)return Response.json({ok:false,stage:'upstream_failure',status:r.status,pages_checked:pages.length},{status:502,headers:H});
    const xml=await r.text();
    if(!/<(?:[\w.-]+:)?D2Payload\b/i.test(xml))return Response.json({ok:false,stage:'invalid_xml',pages_checked:pages.length},{status:502,headers:H});
    pages.push(process(xml,Date.now()));
    const next=nextPage(url,r.headers.get('x-next'),type);
    url=next.url;if(next.reason)stop=next.reason;
    if(i===2&&url)stop='page_limit_more_records_possible';
   }catch(e){return Response.json({ok:false,stage:e?.name==='TimeoutError'?'timeout':'request_failed',pages_checked:pages.length},{status:502,headers:H});}
  }
  return Response.json({ok:true,stage:'combined_validation_preview',type,publishing_enabled:false,
   pages_checked:pages.length,stop,pages,notice:'Review candidates are NOT verified local closures. Bounding box is approximate, pagination and record identity require further verification.'},{headers:H});
 }
};
