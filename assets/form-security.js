// Secure form controls: fail closed until Cloudflare/Resend configuration is ready.
(async function () {
  const form = document.querySelector('form[data-ww-form]');
  if (!form) return;
  const submit = form.querySelector('button[type="submit"]');
  const note = document.createElement('p');
  note.setAttribute('role', 'status');
  note.style.cssText = 'font-size:.9rem;margin-top:10px;';
  const target = form.querySelector('.form-actions') || form;
  target.appendChild(note);
  if (submit) submit.disabled = true;
  const message = text => { note.textContent = text; };
  message('Checking secure submission availability…');

  try {
    const ready = await fetch('/api/forms', { cache: 'no-store' });
    if (!ready.ok) throw new Error('not ready');
    const config = await ready.json();
    if (!config.siteKey) throw new Error('site key missing');
    const container = document.createElement('div');
    container.className = 'ww-turnstile';
    form.querySelector('.form-actions')?.before(container);
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.turnstile) { message('Security verification unavailable.'); return; }
      window.turnstile.render(container, {
        sitekey: config.siteKey,
        callback: () => { if (submit) submit.disabled = false; message('Secure form ready.'); },
        'expired-callback': () => { if (submit) submit.disabled = true; message('Security check expired. Please complete it again.'); },
        'error-callback': () => { if (submit) submit.disabled = true; message('Security check failed. Please refresh the page.'); }
      });
    };
    script.onerror = () => message('Security verification is unavailable. Please email Witney Wire directly.');
    document.head.appendChild(script);
  } catch {
    message('Online submissions are being set up. Please contact Witney Wire by email until the form is ready.');
  }
})();