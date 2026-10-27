// Witney Wire V060 — geographic screening diagnostic only.
// This uses an APPROXIMATE Oxfordshire bounding box, NOT the county boundary.
// Never publishes traffic alerts, raw records, or API credentials.
const API='https://api.data.nationalhighways.co.uk/roads/v2.0/closures';
const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
const BOX={south:51.45,north:52.25,west:-1.78,east:-0.75};
function blocks(xml,tag){
 const re=new RegExp('<(?:[\\w.-]+:)?'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?'+tag+'>','gi');
 return [...xml.matchAll(re)].map(m=>m[1]);
}
function plain(s){return s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();}
function roads(record){
 const labels=['roadName','locationDescription','locationContainedInGroup'].flatMap(t=>blocks(record,t)).map(plain).join(' ').toUpperCase();
 return ['A40','M40'].filter(road=>new RegExp('(?:^|[^A-Z0-9])'+road+'(?![0-9])').test(labels));
}
function classifyGeometry(record){
 const geometry=blocks(record,'gmlLineString').concat(blocks(record,'LineString'));
 const input=geometry.length?geometry:blocks(record,'linearLocation');
 const pieces=input.length?input:[record];
 let usable=0,invalid=0,inside=0,segments=0;
 for(const piece of pieces){
  for(const m of piece.matchAll(/<(?:[\w.-]+:)?posList\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?posList>/gi)){
   const nearby=piece.slice(Math.max(0,m.index-400),m.index);
   // Only apply lat/lon test to known WGS84 coordinate references.
   if(!/4326/i.test(nearby)&&!/4326/i.test(piece.slice(0,500))){invalid++;continue;}
   const nums=m[1].trim().split(/\s+/).map(Number);
   if(nums.length<4||nums.length%2||nums.some(n=>!Number.isFinite(n))){invalid++;continue;}
   const pts=[];
   for(let i=0;i<nums.length;i+=2){
    const lat=nums[i],lon=nums[i+1];
    if(Math.abs(lat)>90||Math.abs(lon)>180){invalid++;pts.length=0;break;}
    pts.push([lat,lon]);usable++;
    if(lat>=BOX.south&&lat<=BOX.north&&lon>=BOX.west&&lon<=BOX.east)inside++;
   }
   // Segment intersection: line can cross box even when endpoints are outside.
   // Bounding-box overlap here is ONLY a candidate, not a proven route match.
   for(let i=1;i<pts.length;i++){
    const a=pts[i-1],b=pts[i];
    if(Math.max(a[0],b[0])>=BOX.south&&Math.min(a[0],b[0])<=BOX.north&&
       Math.max(a[1],b[1])>=BOX.west&&Math.min(a[1],b[1])<=BOX.east)segments++;
   }
  }
 }
 return {candidate:inside>0||segments>0,usable,invalid};
}
function inspect(xml){
 const records=blocks(xml,'situationRecord');
 const result={total_records:records.length,road_matched:0,candidate_records:0,outside_or_unresolved:0,without_valid_geometry:0,invalid_geometry_fragments:0,by_road:{A40:0,M40:0},candidate_by_road:{A40:0,M40:0}};
 for(const record of records){
  const rs=roads(record);if(!rs.length)continue;
  result.road_matched++;
  for(const r of rs)result.by_road[r]++;
  const geo=classifyGeometry(record);
  result.invalid_geometry_fragments+=geo.invalid;
  if(!geo.usable)result.without_valid_geometry++;
  if(geo.candidate){result.candidate_records++;for(const r of rs)result.candidate_by_road[r]++;}
  else result.outside_or_unresolved++;
 }
 return result;
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(!['/','/health'].includes(url.pathname))return new Response('Not found',{status:404});
  if(!env.NATIONAL_HIGHWAYS_API_KEY)return Response.json({ok:false,stage:'missing_secret'},{status:503,headers:H});
  const type=url.searchParams.get('type')==='unplanned'?'unplanned':'planned';
  try{
   const r=await fetch(API+'?closureType='+type,{headers:{'Ocp-Apim-Subscription-Key':env.NATIONAL_HIGHWAYS_API_KEY,Accept:'application/xml'},signal:AbortSignal.timeout(20000)});
   if(!r.ok)return Response.json({ok:false,stage:'upstream',http_status:r.status},{status:502,headers:H});
   const xml=await r.text();
   if(!/<(?:[\w.-]+:)?D2Payload\b/i.test(xml))return Response.json({ok:false,stage:'unexpected_xml'},{status:502,headers:H});
   return Response.json({ok:true,stage:'bounding_box_candidate_preview',type,first_page_only:true,publishing_enabled:false,
    area:'Approximate Oxfordshire diagnostic box',...inspect(xml),
    warning:'Bounding-box overlaps are candidates, NOT verified Oxfordshire closures. Incomplete pagination. No alerts are published.'},{headers:H});
  }catch(e){return Response.json({ok:false,stage:e?.name==='TimeoutError'?'timeout':'request_failed'},{status:502,headers:H});}
 }
};
