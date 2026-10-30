(() => {
  const banner = document.querySelector('[data-home-ads]');
  if (!banner) return;
  const slides = [...banner.querySelectorAll('[data-ad-slide]')];
  const toggle = banner.querySelector('[data-ad-toggle]');
  const next = banner.querySelector('[data-ad-next]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let paused = motion.matches;
  let timer;
  function show(index) {
    current = index;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === current);
      slide.setAttribute('aria-hidden', String(i !== current));
      slide.inert = i !== current;
    });
  }
  function schedule() {
    clearInterval(timer);
    if (!paused && !document.hidden && !banner.matches(':hover') && !banner.contains(document.activeElement)) {
      timer = setInterval(() => show((current + 1) % slides.length), 7000);
    }
  }
  function updateToggle() {
    toggle.textContent = paused ? 'Play banners' : 'Pause banners';
  }
  toggle.addEventListener('click', () => { paused = !paused; updateToggle(); schedule(); });
  next.addEventListener('click', () => { show((current + 1) % slides.length); schedule(); });
  banner.addEventListener('mouseenter', schedule);
  banner.addEventListener('mouseleave', schedule);
  banner.addEventListener('focusin', () => clearInterval(timer));
  banner.addEventListener('focusout', () => setTimeout(schedule, 0));
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => { paused = motion.matches; updateToggle(); schedule(); });
  show(0);
  banner.classList.add('ad-rotation-ready');
  updateToggle();
  schedule();
})();
