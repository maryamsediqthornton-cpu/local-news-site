// Public preview of unverified National Highways candidates; NOT the published alert feed.
export async function onRequestGet() {
  try {
    const response = await fetch('https://witney-wire-travel-updates.maryamsediqthornton.workers.dev/review', {headers:{Accept:'application/json'},signal:AbortSignal.timeout(12000)});
    if(!response.ok)throw Error('upstream');
    const data=await response.json();
    const timestamp=Date.parse(data.updated_at||'');
    if(!Number.isFinite(timestamp)||timestamp>Date.now()+300000||Date.now()-timestamp>75*60000)throw Error('stale');
    const notices=Array.isArray(data.notices)?data.notices.slice(0,12).map(n=>({
      road:String(n.road||'').slice(0,10),
      description:String(n.description||'').slice(0,160),
      lane_information:String(n.lane_information||'').slice(0,80),
      official_comment:String(n.official_comment||'').slice(0,240),
      reason:String(n.reason||'').slice(0,80),
      valid_from:n.valid_from,
      valid_until:n.valid_until
    })): [];
    return Response.json({status:'unverified_preview',updated_at:data.updated_at,notices},{headers:{'Cache-Control':'no-store'}});
  }catch{
    return Response.json({status:'preview_unavailable',notices:[]},{status:503,headers:{'Cache-Control':'no-store'}});
  }
}
