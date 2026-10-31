(() => {
 const $=id=>document.getElementById(id);
 const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/London',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 $('end').value=date; $('start').value=date.slice(0,8)+'01';
 const measures=[['bluebell-banner','ad_click','Bluebell · Homepage banner','Advert clicks'],['bluebell-care','job_view','Bluebell · Care Assistants','Listing views'],['bluebell-care','apply_email','Bluebell · Care Assistants','Email recruitment clicks'],['bluebell-care','apply_phone','Bluebell · Care Assistants','Phone clicks']];
 $('report-form').addEventListener('submit',async e=>{
   e.preventDefault(); $('results').hidden=true; $('status').textContent='Loading report…';
   try {
     const query=new URLSearchParams({start:$('start').value,end:$('end').value});
     const res=await fetch('/api/tracking?'+query,{headers:{Authorization:'Bearer '+$('password').value},cache:'no-store'});
     const data=await res.json();
     if(!res.ok) throw new Error(data.error||'Unable to load report.');
     $('totals').replaceChildren();
     for(const [item,event,label,measure] of measures) {
       const row=document.createElement('tr');
       const count=data.rows.filter(r=>r.item===item&&r.event===event).reduce((n,r)=>n+r.count,0);
       for(const value of [label,measure,count]) {const cell=document.createElement('td');cell.textContent=value;row.append(cell);}
       $('totals').append(row);
     }
     $('results').hidden=false; $('status').textContent=data.rows.length?'Report loaded.':'No recorded activity in this date range.';
   } catch(error) { $('status').textContent=error.message; }
 });
})();
