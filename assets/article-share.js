(() => {
  'use strict';
  const view = document.querySelector('#article-view');
  const id = new URLSearchParams(window.location.search).get('id');
  if (!view || !id) return;

  function addShareButton() {
    const heading = view.querySelector('h1');
    const body = view.querySelector('.article-body');
    if (!heading || !body || view.querySelector('.article-share')) return false;

    const link = new URL('/article', 'https://witneywire.co.uk');
    link.searchParams.set('id', id);
    const shareData = { title: heading.textContent.trim(), url: link.href };

    const area = document.createElement('div');
    area.className = 'article-share';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'article-share-button';
    button.setAttribute('aria-label', 'Share this story');
    button.title = 'Share this story';
    button.innerHTML = '<span>Share</span><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m8.7 10.5 6.6-4M8.7 13.5l6.6 4"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="5" r="3"/><circle cx="18" cy="19" r="3"/></svg>';
    const status = document.createElement('span');
    status.className = 'article-share-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    const manual = document.createElement('label');
    manual.className = 'article-share-manual';
    manual.hidden = true;
    manual.append('Copy this link:');
    const input = document.createElement('input');
    input.type = 'text';
    input.readOnly = true;
    input.value = shareData.url;
    input.setAttribute('aria-label', 'Article link');
    input.addEventListener('focus', () => input.select());
    manual.append(input);

    async function copyLink() {
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(shareData.url);
        status.textContent = 'Link copied';
        manual.hidden = true;
      } catch {
        status.textContent = 'Select and copy the link below.';
        manual.hidden = false;
        input.focus();
        input.select();
      }
    }

    button.addEventListener('click', async () => {
      button.disabled = true;
      status.textContent = '';
      manual.hidden = true;
      try {
        if (typeof navigator.share === 'function') {
          try {
            await navigator.share(shareData);
          } catch (error) {
            if (!error || error.name !== 'AbortError') await copyLink();
          }
        } else {
          await copyLink();
        }
      } finally {
        button.disabled = false;
      }
    });
    area.append(button, status, manual);
    const end = view.querySelector('.newsroom-attribution') || body;
    end.after(area);
    return true;
  }

  if (!addShareButton()) {
    const observer = new MutationObserver(() => {
      if (addShareButton()) observer.disconnect();
    });
    observer.observe(view, { childList: true, subtree: true });
  }
})();
