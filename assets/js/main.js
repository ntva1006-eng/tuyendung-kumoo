(() => {
  const head = document.querySelector('.site-head');
  const burger = document.querySelector('.burger');
  if (burger) burger.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    burger.setAttribute('aria-expanded', open);
  });
  document.querySelectorAll('.menu a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('nav-open')));

  // lọc vị trí theo khối
  const chips = document.querySelectorAll('.chip[data-f]');
  const cards = document.querySelectorAll('.job[data-g]');
  const apply = f => {
    chips.forEach(c => c.classList.toggle('on', c.dataset.f === f));
    cards.forEach(j => { j.style.display = (f === 'all' || j.dataset.g === f) ? '' : 'none'; });
  };
  chips.forEach(c => c.addEventListener('click', () => {
    apply(c.dataset.f);
    try { history.replaceState(null, '', c.dataset.f === 'all' ? location.pathname : '#' + c.dataset.f); } catch (e) {}
  }));
  if (chips.length) {
    const h = location.hash.slice(1);
    apply([...chips].some(c => c.dataset.f === h) ? h : 'all');
  }

  // hiện dần khi cuộn
  const els = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => io.observe(el));
  } else els.forEach(el => el.classList.add('in'));

  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
