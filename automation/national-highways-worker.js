// Witney Wire V060 — read-only closure record diagnostics.
// Does NOT publish notices or show raw XML / API credentials.
// Preliminary first-page analysis only; never treat counts as live traffic alerts.
const API='https://api.data.nationalhighways.co.uk/roads/v2.0/closures';
const JSON_HEADERS={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
function segments(xml,tag){
 const re=new RegExp('<(?:[\\w.-]+:)?'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?'+tag+'>','gi');
 return [...xml.matchAll(re)].map(m=>m[1]);
}
function valueOf(xml,tag){
 const s=segments(xml,tag)[0];
 if(!s)return null;
 const t=s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
 return t||null;
}
function roadsWithin(record){
 const values=['roadName','locationDescription','locationContainedInGroup'].flatMap(tag=>segments(record,tag))
  .map(v=>v.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').toUpperCase());
 return [...new Set(values.flatMap(v=>(v.match(/(?:^|[^A-Z0-9])(A40|M40)(?![0-9])/g)||[])
  .map(x=>x.match(/A40|M40/)[0])))];
}
function validDate(s){return s&&Number.isFinite(Date.parse(s))?Date.parse(s):null;}
function summary(xml){
 const situations=segments(xml,'situation');
 const rows=[];
 for(const sit of situations){
  for(const record of segments(sit,'situationRecord')){
   const roads=roadsWithin(record);
   if(!roads.length)continue;
   const start=valueOf(record,'overallStartTime')||valueOf(sit,'overallStartTime');
   const end=valueOf(record,'overallEndTime')||valueOf(sit,'overallEndTime');
   const status=valueOf(record,'validityStatus')||valueOf(sit,'validityStatus');
   rows.push({roads,start,end,status});
  }
 }
 const byRoad={A40:0,M40:0},statusCounts={},dateIssues={missing_start:0,missing_end:0,invalid_or_reversed:0,already_ended:0,starts_in_future:0};
 const now=Date.now();
 for(const r of rows){
  r.roads.forEach(road=>byRoad[road]++);
  const label=(r.status||'missing').slice(0,40);statusCounts[label]=(statusCounts[label]||0)+1;
  const start=validDate(r.start),end=validDate(r.end);
  if(!start)dateIssues.missing_start++;
  if(!end)dateIssues.missing_end++;
  if(start&&end&&end<=start)dateIssues.invalid_or_reversed++;
  if(end&&end<now)dateIssues.already_ended++;
  if(start&&start>now)dateIssues.starts_in_future++;
 }
 return {situations_on_page:situations.length,matching_records:rows.length,matching_road_record_counts:byRoad,
  validity_status_counts:statusCounts,date_quality:dateIssues,
  caveat:'Preliminary matching of records only. Location, dates, status and pagination must be fully validated before public display.'};
}
export default {
 async fetch(request,env){
  const u=new URL(request.url);
  if(u.pathname!=='/health'&&u.pathname!=='/')return new Response('Not found',{status:404});
  if(!env.NATIONAL_HIGHWAYS_API_KEY)return Response.json({ok:false,stage:'missing_secret'},{status:503,headers:JSON_HEADERS});
  const type=u.searchParams.get('type')==='unplanned'?'unplanned':'planned';
  try{
   const r=await fetch(API+'?closureType='+type,{headers:{'Ocp-Apim-Subscription-Key':env.NATIONAL_HIGHWAYS_API_KEY,Accept:'application/xml'},signal:AbortSignal.timeout(20000)});
   if(!r.ok)return Response.json({ok:false,stage:'upstream',http_status:r.status},{status:502,headers:JSON_HEADERS});
   const xml=await r.text();
   if(!/<(?:[\w.-]+:)?D2Payload\b/i.test(xml))return Response.json({ok:false,stage:'invalid_xml_root'},{status:502,headers:JSON_HEADERS});
   return Response.json({ok:true,stage:'record_validation_preview',closure_type:type,publishing_enabled:false,
    first_page_only:true,...summary(xml)},{headers:JSON_HEADERS});
  }catch(e){return Response.json({ok:false,stage:e?.name==='TimeoutError'?'timeout':'request_or_parse_error'},{status:502,headers:JSON_HEADERS});}
 }
};
