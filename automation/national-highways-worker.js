// Witney Wire / V060: DATEX II XML schema inspection only.
// Outputs tag names and counts, never raw records, locations or API credentials.
// No automatic publishing or scheduled updates.
const BASE='https://api.data.nationalhighways.co.uk/roads/v2.0/closures';
const HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
function describeXml(xml) {
 const tags=new Map(), attributes=new Map();
 const stack=[], paths=new Map();
 const re=/<(?![!?\/])([A-Za-z_][\w.:-]*)([^<>]*?)(\/?)>/g;
 let match, scanned=0;
 while((match=re.exec(xml))!==null && scanned<150000){
  scanned++;
  const name=match[1].split(':').pop();
  tags.set(name,(tags.get(name)||0)+1);
  const attrRe=/\s([A-Za-z_][\w.:-]*)\s*=/g;
  let a;while((a=attrRe.exec(match[2]))!==null){
   const key=a[1].split(':').pop();attributes.set(key,(attributes.get(key)||0)+1);
  }
 }
 const ranked=m=>[...m].sort((a,b)=>b[1]-a[1]).slice(0,75).map(([name,count])=>({name,count}));
 return {root_tag:(xml.match(/<(?!\?|!)([A-Za-z_][\w.:-]*)/)||[])[1]||null,
  tag_counts:ranked(tags),attribute_names:ranked(attributes),scanned_tags:scanned};
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(!['/','/health'].includes(url.pathname))return new Response('Not found',{status:404});
  if(!env.NATIONAL_HIGHWAYS_API_KEY)return Response.json({connected:false,stage:'secret_missing'},{status:503,headers:HEADERS});
  const closureType=url.searchParams.get('type')==='unplanned'?'unplanned':'planned';
  try{
   const upstream=await fetch(BASE+'?closureType='+closureType,{
    headers:{'Ocp-Apim-Subscription-Key':env.NATIONAL_HIGHWAYS_API_KEY,'Accept':'application/xml'},
    signal:AbortSignal.timeout(20000)
   });
   if(!upstream.ok)return Response.json({connected:false,stage:'upstream',http_status:upstream.status},{status:502,headers:HEADERS});
   const xml=await upstream.text();
   const data=describeXml(xml);
   return Response.json({connected:true,http_status:upstream.status,closure_type:closureType,
    response_type:(upstream.headers.get('content-type')||'unknown').split(';')[0],
    bytes:new TextEncoder().encode(xml).length,...data,
    publishing_enabled:false,note:'Only structural tag names and counts; no traffic records are published.'},
    {headers:HEADERS});
  }catch(e){
   return Response.json({connected:false,stage:e?.name==='TimeoutError'?'timeout':'request_or_read_failed'},
    {status:502,headers:HEADERS});
  }
 }
};
