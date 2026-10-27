// Witney Wire · National Highways v2 API inspection, read-only test
// No road closures are published by this Worker.
// API key is read only from the encrypted Cloudflare Secret.
const API = 'https://api.data.nationalhighways.co.uk/roads/v2.0/closures';
const headers = {'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path !== '/health' && path !== '/') return new Response('Not found', {status:404});
    if (!env.NATIONAL_HIGHWAYS_API_KEY) return Response.json({service:'Witney Wire travel',ready:false,reason:'Missing Cloudflare secret'}, {status:503,headers});
    // Do not return the request URL, request headers, key, or raw API payload.
    try {
      const upstream = await fetch(API+'?closureType=planned', {
        headers:{'Ocp-Apim-Subscription-Key':env.NATIONAL_HIGHWAYS_API_KEY,'Accept':'application/json'},
        signal:AbortSignal.timeout(12000)
      });
      if (!upstream.ok) return Response.json({service:'Witney Wire travel',ready:false,upstream_status:upstream.status},{status:502,headers});
      const body = await upstream.json();
      // Expose only structural diagnostics to validate the documented DATEX-II response mapping.
      const rootKeys = body && typeof body==='object' && !Array.isArray(body) ? Object.keys(body).slice(0,12):[];
      const kind = Array.isArray(body)?'array':typeof body;
      const topArrayLength = Array.isArray(body)?body.length:null;
      const subtypes = Object.fromEntries(rootKeys.map(k=>[k,Array.isArray(body[k])?'array':typeof body[k]]));
      return Response.json({
        service:'Witney Wire travel',connected:true,upstream_status:upstream.status,
        payload_kind:kind,root_keys:rootKeys,root_value_types:subtypes,
        top_array_length:topArrayLength,
        publishing_enabled:false,
        note:'Schema inspection only. No closures are displayed or published.'
      },{headers});
    } catch {
      return Response.json({service:'Witney Wire travel',connected:false,reason:'Data parsing or upstream request failed'},{status:502,headers});
    }
  }
};
