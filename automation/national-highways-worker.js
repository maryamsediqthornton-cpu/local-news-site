// Witney Wire V060: read-only DATEX II geographic field inspection.
// No auto-publishing; no raw XML, request headers, or private key returned.
const API='https://api.data.nationalhighways.co.uk/roads/v2.0/closures';
const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
function blocks(xml,tag){
 const re=new RegExp('<(?:[\\w.-]+:)?'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?'+tag+'>','gi');
 return [...xml.matchAll(re)].map(m=>m[1]);
}
function plain(v){return v.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();}
function values(xml,tag){return blocks(xml,tag).map(plain).filter(Boolean);}
function roads(record){
 const s=['roadName','locationDescription','locationContainedInGroup'].flatMap(k=>values(record,k)).join(' ').toUpperCase();
 return ['A40','M40'].filter(r=>new RegExp('(?:^|[^A-Z0-9])'+r+'(?![0-9])').test(s));
}
function localTagNames(xml){
 const counts=new Map();const re=/<(?![!?/])(?:[\w.-]+:)?([A-Za-z][\w.-]*)\b/g;let m;
 while((m=re.exec(xml))!==null){counts.set(m[1],(counts.get(m[1])||0)+1);}
 return [...counts].sort((a,b)=>b[1]-a[1]).slice(0,45).map(([tag,count])=>({tag,count}));
}
function numericExample(v){
 const nums=v.match(/[-+]?\d+(?:\.\d+)?/g);
 return nums&&nums.length>=2?nums.slice(0,4).map(Number):null;
}
function inspect(xml){
 const all=blocks(xml,'situationRecord'),matched=all.filter(r=>roads(r).length);
 const targets=['linearElementIdentifier','linearElementType','linearElementByCode','fromPoint','toPoint','posList','pos','pointCoordinates','latitude','longitude','srsName','locationDescription','locationContainedInGroup'];
 const fieldCounts=Object.fromEntries(targets.map(t=>[t,matched.filter(r=>blocks(r,t).length>0).length]));
 const examples=matched.slice(0,5).map(r=>{
  const geometryTag=['posList','pos','pointCoordinates','latitude','longitude'].find(t=>values(r,t).length);
  const v=geometryTag?values(r,geometryTag)[0]:null;
  return {roads:roads(r),geometry_tag:geometryTag||null,geometry_numeric_sample:v?numericExample(v):null,
   linear_identifier_present:blocks(r,'linearElementIdentifier').length>0,
   from_point_present:blocks(r,'fromPoint').length>0,to_point_present:blocks(r,'toPoint').length>0,
   srs:values(r,'srsName')[0]?.slice(0,80)||null};
 });
 const locationSample=matched[0]||'';
 const firstLocation=blocks(locationSample,'locationReference')[0]||blocks(locationSample,'groupOfLocations')[0]||locationSample;
 return {records_on_page:all.length,matching_records:matched.length,field_presence_counts:fieldCounts,
  location_tag_names_first_match:localTagNames(firstLocation),examples,
  note:'Field inventory only. No closure is geographically verified and none is published.'};
}
export default {
 async fetch(request,env){
  const u=new URL(request.url);
  if(!['/','/health'].includes(u.pathname))return new Response('Not found',{status:404});
  if(!env.NATIONAL_HIGHWAYS_API_KEY)return Response.json({ok:false,stage:'missing_secret'},{status:503,headers:H});
  const type=u.searchParams.get('type')==='unplanned'?'unplanned':'planned';
  try{
   const response=await fetch(API+'?closureType='+type,{headers:{'Ocp-Apim-Subscription-Key':env.NATIONAL_HIGHWAYS_API_KEY,Accept:'application/xml'},signal:AbortSignal.timeout(20000)});
   if(!response.ok)return Response.json({ok:false,stage:'upstream',status:response.status},{status:502,headers:H});
   const xml=await response.text();
   if(!/<(?:[\w.-]+:)?D2Payload\b/i.test(xml))return Response.json({ok:false,stage:'unexpected_response'},{status:502,headers:H});
   return Response.json({ok:true,stage:'geography_structure_preview',type,first_page_only:true,publishing_enabled:false,...inspect(xml)},{headers:H});
  }catch(e){return Response.json({ok:false,stage:e?.name==='TimeoutError'?'timeout':'request_error'},{status:502,headers:H});}
 }
};
