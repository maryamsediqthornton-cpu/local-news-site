(() => {
  function send(item,event) {
    const body=JSON.stringify({item,event});
    // Keep navigation unchanged, even if tracking is unavailable.
    fetch('/api/tracking',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
  }
  document.addEventListener('click',e=>{
    const link=e.target.closest('a[data-track-item][data-track-event]');
    if(link && e.isTrusted) send(link.dataset.trackItem,link.dataset.trackEvent);
  });
  const listing=document.querySelector('[data-track-view]');
  if(listing && 'IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting) && document.visibilityState==='visible') {
        send(listing.dataset.trackView,'job_view'); observer.disconnect();
      }
    },{threshold:0});
    observer.observe(listing);
  }
})();
