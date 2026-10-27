// Witney Wire V060 — READ-ONLY A40/M40 location and pagination diagnostic.
// Never publishes or exposes API credentials or raw road records.
// Max 3 pages / one closure type per request; respect provider 10 requests/minute limit.
const ROOT='https://api.data.nationalhighways.co.uk/roads/v2.0/closures';
const H={'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
const AREA=/\b(oxfordshire|oxford|witney|eynsham|carterton|bicester|banbury|thame|wheatley|headington|kidlington|woodstock|chipping norton|burford)\b/i;
function blocks(xml,tag){
 const re=new RegExp('<(?:[\\w.-]+:)?'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?'+tag+'>','gi');
 return [...xml.matchAll(re)].map(x=>x[1]);
}
function simpleText(block){
 return block.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
}
function field(xml,name){return blocks(xml,name).map(simpleText).filter(Boolean);}
function summary(xml){
 const stats={situations:0,records:0,matching_records:0,roads:{A40:0,M40:0},
  geography:{explicit_oxfordshire_text:0,unresolved:0},status:{},date_missing:0};
 for(const sit of blocks(xml,'situation')){
  stats.situations++;
  for(const rec of blocks(sit,'situationRecord')){
   stats.records++;
   const roadValues=['roadName','locationDescription','locationContainedInGroup'].flatMap(t=>field(rec,t));
   const roadText=roadValues.join(' ');
   const roads=['A40','M40'].filter(road=>new RegExp('(?:^|[^A-Z0-9])'+road+'(?![0-9])','i').test(roadText));
   if(!roads.length)continue;
   stats.matching_records++;roads.forEach(x=>stats.roads[x]++);
   const locFields=['locationDescription','locationContainedInGroup','fromNodeName','toNodeName','roadName'];
   const place=locFields.flatMap(x=>field(rec,x)).join(' ');
   const explicit=AREA.test(place);
   stats.geography[explicit?'explicit_oxfordshire_text':'unresolved']++;
   const status=field(rec,'validityStatus')[0]||field(sit,'validityStatus')[0]||'unknown';
   stats.status[status.slice(0,45)]=(stats.status[status.slice(0,45)]||0)+1;
   const start=field(rec,'overallStartTime')[0]||field(sit,'overallStartTime')[0];
   const end=field(rec,'overallEndTime')[0]||field(sit,'overallEndTime')[0];
   if(!start||!end||!Number.isFinite(Date.parse(start))||!Number.isFinite(Date.parse(end)))stats.date_missing++;
  }
 }
 return stats;
}
function validatedNext(current,header,closureType){
 if(!header)return null;
 try{
  const next=new URL(header,current);
  const base=new URL(ROOT);
  if(next.origin!==base.origin||next.pathname!==base.pathname||next.protocol!=='https:')return null;
  if(next.searchParams.get('closureType')!==closureType)return null;
  return next.href;
 }catch{return null;}
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(!['/','/health'].includes(url.pathname))return new Response('Not found',{status:404});
  if(!env.NATIONAL_HIGHWAYS_API_KEY)return Response.json({ok:false,stage:'missing_secret'},{status:503,headers:H});
  const type=url.searchParams.get('type')==='unplanned'?'unplanned':'planned';
  let next=ROOT+'?closureType='+type;
  const seen=new Set(), pages=[];let stopped='end_of_pages';
  for(let page=0;page<3 && next;page++){
   if(seen.has(next)){stopped='repeated_page_cursor';break;}seen.add(next);
   try{
    const r=await fetch(next,{headers:{'Ocp-Apim-Subscription-Key':env.NATIONAL_HIGHWAYS_API_KEY,Accept:'application/xml'},
     signal:AbortSignal.timeout(20000)});
    if(!r.ok)return Response.json({ok:false,stage:'upstream',http_status:r.status,completed_pages:pages.length},{status:502,headers:H});
    const xml=await r.text();
    if(!/<(?:[\w.-]+:)?D2Payload\b/i.test(xml))return Response.json({ok:false,stage:'invalid_xml',completed_pages:pages.length},{status:502,headers:H});
    pages.push(summary(xml));
    const header=r.headers.get('x-next');
    next=validatedNext(next,header,type);
    if(header&&!next){stopped='unusable_or_unexpected_pagination_header';break;}
    if(page===2 && next)stopped='page_limit_reached_more_data';
   }catch(e){return Response.json({ok:false,stage:e?.name==='TimeoutError'?'timeout':'fetch_failed',completed_pages:pages.length},{status:502,headers:H});}
  }
  return Response.json({ok:true,stage:'location_pagination_preview',type,publishing_enabled:false,pages_checked:pages.length,
   page_summaries:pages,stopped,limitations:'Geographic keyword matches are not proof of road location. No closures published. Data may be incomplete if page limit reached.'},{headers:H});
 }
};
