// Witney Wire V060: READ-ONLY DATEX-II road identifier diagnostic.
// No automated posting, no API key exposure, no raw XML or personal data returned.
const ENDPOINT='https://api.data.nationalhighways.co.uk/roads/v2.0/closures';
const RESPONSE_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
const ROAD_TAGS=['roadName','roadNumber','linearElementIdentifier','locationDescription','locationContainedInGroup'];
function textValues(xml,tag,max=10000){
 const pattern=new RegExp('<(?:[\\w.-]+:)?'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?'+tag+'>','gi');
 const out=[];let m;
 while((m=pattern.exec(xml))!==null && out.length<max){
  // Read only short simple text. Never return unescaped markup or full descriptions.
  const s=m[1].replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
  if(s)out.push(s.slice(0,120));
 }
 return out;
}
function summary(values) {
 const counts=new Map();
 for(const value of values){
  // Road codes only; ignore prose, junction/node identifiers and free text.
  const matches=value.toUpperCase().match(/\b(?:M|A)\s*\d{1,4}\b/g)||[];
  for(const road of matches){const n=road.replace(/\s+/g,'');counts.set(n,(counts.get(n)||0)+1);}
 }
 return {value_count:values.length,code_counts:[...counts].sort((a,b)=>b[1]-a[1]).slice(0,20)
  .map(([road,count])=>({road,count})),A40_mentions:counts.get('A40')||0,M40_mentions:counts.get('M40')||0};
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(!['/','/health'].includes(url.pathname))return new Response('Not found',{status:404});
  if(!env.NATIONAL_HIGHWAYS_API_KEY)return Response.json({ok:false,stage:'missing_secret'},{status:503,headers:RESPONSE_HEADERS});
  const type=url.searchParams.get('type')==='unplanned'?'unplanned':'planned';
  try{
   const response=await fetch(ENDPOINT+'?closureType='+type,{
    headers:{'Ocp-Apim-Subscription-Key':env.NATIONAL_HIGHWAYS_API_KEY,Accept:'application/xml'},
    signal:AbortSignal.timeout(20000)
   });
   if(!response.ok)return Response.json({ok:false,stage:'upstream',http_status:response.status},{status:502,headers:RESPONSE_HEADERS});
   const xml=await response.text();
   if(!/<(?:[\w.-]+:)?D2Payload\b/i.test(xml))return Response.json({ok:false,stage:'unexpected_payload'},{status:502,headers:RESPONSE_HEADERS});
   const fields=Object.fromEntries(ROAD_TAGS.map(tag=>[tag,summary(textValues(xml,tag))]));
   const records=(xml.match(/<(?:[\w.-]+:)?situationRecord\b/gi)||[]).length;
   const situations=(xml.match(/<(?:[\w.-]+:)?situation\b/gi)||[]).length;
   return Response.json({ok:true,stage:'road_identifier_preview',closure_type:type,
    first_page_only:true,records,situations,fields,publishing_enabled:false,
    note:'Diagnostic road-code counts are not a verified closure list. Locations, status, and pagination remain unvalidated.'},
    {headers:RESPONSE_HEADERS});
  }catch(e){return Response.json({ok:false,stage:e?.name==='TimeoutError'?'timeout':'request_failed'},
    {status:502,headers:RESPONSE_HEADERS});}
 }
};
