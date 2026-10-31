const allowed = new Set(['bluebell-banner:ad_click','bluebell-care:job_view','bluebell-care:apply_email','bluebell-care:apply_phone']);
const headers = {'Cache-Control':'no-store','Content-Type':'application/json','X-Content-Type-Options':'nosniff'};
const reply = (body,status=200) => new Response(JSON.stringify(body),{status,headers});
export async function onRequest({request,env}) {
  if (!env.TRACKING_DB) return reply({error:'Tracking database is not configured.'},503);
  if (request.method === 'POST') {
    if (request.headers.get('Origin') !== new URL(request.url).origin) return reply({error:'Forbidden'},403);
    if (Number(request.headers.get('Content-Length')||0)>512) return reply({error:'Too large'},413);
    let body;
    try { const raw=await request.text(); if(raw.length>512) return reply({error:'Too large'},413); body=JSON.parse(raw); }
    catch { return reply({error:'Invalid request'},400); }
    if(!allowed.has(body.item+':'+body.event)) return reply({error:'Unknown event'},400);
    // No IP address, visitor identifier, email, referrer or user agent is stored.
    const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
    await env.TRACKING_DB.prepare('INSERT INTO tracking_daily (day,item,event,count) VALUES (?,?,?,1) ON CONFLICT(day,item,event) DO UPDATE SET count=count+1').bind(day,body.item,body.event).run();
    return new Response(null,{status:204,headers});
  }
  if(request.method!=='GET') return reply({error:'Method not allowed'},405);
  // Password is held only in memory by the report page and must be an encrypted Cloudflare secret.
  const auth=request.headers.get('Authorization')||'';
  if(!env.REPORT_PASSWORD || auth!=='Bearer '+env.REPORT_PASSWORD) return reply({error:'Incorrect password or report not configured.'},401);
  const url=new URL(request.url), start=url.searchParams.get('start'),end=url.searchParams.get('end');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(start||'')||!/^\d{4}-\d{2}-\d{2}$/.test(end||'')||start>end) return reply({error:'Choose a valid date range.'},400);
  const {results}=await env.TRACKING_DB.prepare('SELECT day,item,event,count FROM tracking_daily WHERE day>=? AND day<=? ORDER BY day,item,event').bind(start,end).all();
  return reply({rows:results,timeZone:'Europe/London'});
}
