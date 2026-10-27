// Witney Wire: safe National Highways response-format diagnosis.
// Never exposes credentials, request headers, or raw API response content.
// No closure records are published.
const API='https://api.data.nationalhighways.co.uk/roads/v2.0/closures?closureType=planned';
const OUT={'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
export default {
 async fetch(request,env) {
  if(!['/','/health'].includes(new URL(request.url).pathname)) return new Response('Not found',{status:404});
  if(!env.NATIONAL_HIGHWAYS_API_KEY) return Response.json({connected:false,reason:'Missing API secret'},{status:503,headers:OUT});
  let response;
  try {
   response=await fetch(API,{headers:{'Ocp-Apim-Subscription-Key':env.NATIONAL_HIGHWAYS_API_KEY,'Accept':'application/json'},signal:AbortSignal.timeout(20000)});
  } catch(e) {
   return Response.json({connected:false,stage:'request',error_type:e?.name==='TimeoutError'?'timeout':'network_error'},{status:502,headers:OUT});
  }
  const type=response.headers.get('content-type')||'unknown';
  const metadata={connected:response.ok,http_status:response.status,response_type:type.split(';')[0],content_length:response.headers.get('content-length')||'unknown',publishing_enabled:false};
  if(!response.ok)return Response.json({...metadata,stage:'upstream_status'},{status:502,headers:OUT});
  try {
   const body=await response.text();
   const trimmed=body.trimStart();
   const detected_format=trimmed.startsWith('<')?'xml':trimmed.startsWith('{')||trimmed.startsWith('[')?'json':'other';
   let root_keys=[];
   if(detected_format==='json'){
    try {const parsed=JSON.parse(body);root_keys=Array.isArray(parsed)?['array']:parsed&&typeof parsed==='object'?Object.keys(parsed).slice(0,15):[];}
    catch {return Response.json({...metadata,detected_format,stage:'json_parse_failed'},{headers:OUT});}
   }
   return Response.json({...metadata,detected_format,root_keys,body_bytes:new TextEncoder().encode(body).length,stage:'format_checked'},{headers:OUT});
  } catch(e){
   return Response.json({...metadata,stage:'body_read_failed',error_type:e?.name||'error'},{status:502,headers:OUT});
  }
 }
};
