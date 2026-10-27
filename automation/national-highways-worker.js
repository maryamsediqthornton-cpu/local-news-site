// Witney Wire V060 — closure mapping validation (READ-ONLY).
// No public travel feed and no automated publishing. National Highways XML only.
const API='https://api.data.nationalhighways.co.uk/roads/v2.0/closures';
const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const GOOD_ROADS=new Set(['A40','M40']);
function decode(s) {
 return s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
  .replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
}
function getText(xml,tag) {
 // Allow namespace prefixes and nested <value> inside DATEX fields.
 const re=new RegExp('<(?:[\\w-]+:)?'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?'+tag+'>','i');
 const m=xml.match(re);
 return m ? decode(m[1].replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()).slice(0,250):null;
}
function inspect(xml) {
 const records=[...xml.matchAll(/<(?:[\w-]+:)?situationRecord\b[^>]*>([\s\S]*?)<\/(?:[\w-]+:)?situationRecord>/gi)];
 const counts={total_records:records.length,road_A40:0,road_M40:0,other_roads:0,missing_road:0,
  missing_start:0,missing_end:0,invalid_dates:0};
 const examples=[];
 for(const m of records){
  const record=m[1]; const rawRoad=getText(record,'roadNumber');
  const road=rawRoad?.toUpperCase().replace(/\s+/g,'').match(/^(A40|M40)$/)?.[1]||null;
  const start=getText(record,'overallStartTime'),end=getText(record,'overallEndTime');
  const validDates=start && end && Number.isFinite(Date.parse(start)) && Number.isFinite(Date.parse(end)) && Date.parse(end)>Date.parse(start);
  if(!rawRoad)counts.missing_road++; else if(road)counts['road_'+road]++;else counts.other_roads++;
  if(!start)counts.missing_start++;if(!end)counts.missing_end++;
  if(start&&end&&!validDates)counts.invalid_dates++;
  if(road && examples.length<8){
   examples.push({road,start:start||null,end:end||null,dates_valid:!!validDates,
    validity_status:getText(record,'validityStatus'),information_status:getText(record,'informationStatus'),
    lanes_restricted:getText(record,'numberOfLanesRestricted'),
    // Read-only diagnostic: location fields not interpreted as confirmed place names.
    from_node:getText(record,'fromNodeName'),to_node:getText(record,'toNodeName')});
  }
 }
 return {counts,examples,matching_page_records:counts.road_A40+counts.road_M40};
}
export default {
 async fetch(request,env){
  const uri=new URL(request.url);
  if(uri.pathname!=='/health'&&uri.pathname!=='/') return new Response('Not found',{status:404});
  if(!env.NATIONAL_HIGHWAYS_API_KEY) return Response.json({ok:false,stage:'missing_secret'},{status:503,headers:H});
  const type=uri.searchParams.get('type')==='unplanned'?'unplanned':'planned';
  try{
   const r=await fetch(API+'?closureType='+type,{
    headers:{'Ocp-Apim-Subscription-Key':env.NATIONAL_HIGHWAYS_API_KEY,Accept:'application/xml'},
    signal:AbortSignal.timeout(20000)
   });
   if(!r.ok) return Response.json({ok:false,stage:'upstream',http_status:r.status},{status:502,headers:H});
   const xml=await r.text();
   if(!/<(?:[\w-]+:)?D2Payload\b/.test(xml))return Response.json({ok:false,stage:'not_expected_datex_xml'},{status:502,headers:H});
   const parsed=inspect(xml);
   return Response.json({ok:true,stage:'mapping_preview',type,publishing_enabled:false,
    first_page_only:true,next_page_header_present:!!r.headers.get('x-next'),
    ...parsed,
    warning:'These are preliminary field mappings, not validated live closures. No notices are published.'},{headers:H});
  }catch(e){
   return Response.json({ok:false,stage:e?.name==='TimeoutError'?'timeout':'request_or_parse_error'},{status:502,headers:H});
  }
 }
};
