(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const ARROW_L = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
  const ARROW_R = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>';
  const ARROW_GO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- page fade in / out ---------- */
  requestAnimationFrame(() => document.body.classList.add('ready'));
  window.addEventListener('pageshow', e => { if (e.persisted) document.body.classList.remove('leaving'); });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const h = a.getAttribute('href');
    if (!h || h.startsWith('#') || /^(https?:|mailto:|tel:)/.test(h)) return;
    if (a.pathname === location.pathname && a.hash) return;
    e.preventDefault();
    document.body.classList.add('leaving');
    setTimeout(() => { location.href = a.href; }, 240);
  });

  /* ---------- header, progress, menu ---------- */
  const header = $('.site-header'), bar = $('#progress');
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    header.classList.toggle('solid', y > 40);
    bar.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('.burger'), menu = $('.menu');
  burger?.addEventListener('click', () => {
    const o = burger.classList.toggle('open');
    menu.classList.toggle('open', o);
    document.body.style.overflow = o ? 'hidden' : '';
  });

  /* ---------- word-split headings ---------- */
  const splitNode = (node, c) => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.append(' '); return; }
          const w = document.createElement('span'); w.className = 'w';
          const s = document.createElement('span'); s.textContent = t; s.style.setProperty('--i', c.i++);
          w.append(s); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) splitNode(n, c);
    });
  };
  $$('[data-split]').forEach(el => {
    splitNode(el, { i: 0 });
    if (el.dataset.delay) el.style.setProperty('--base', el.dataset.delay + 'ms');
  });

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); if (e.target.dataset.count) count(e.target); }
  }), { threshold: .14, rootMargin: '0px 0px -6% 0px' });
  const watch = root => $$('[data-r],[data-split],.reveal-img,[data-count]', root).forEach(el => io.observe(el));
  window.__watch = watch; watch(document);

  function count(el) {
    const end = +el.dataset.count, suf = el.dataset.suf || '', t0 = performance.now(), dur = 1800;
    const tick = t => { const p = Math.min((t - t0) / dur, 1), v = Math.round(end * (1 - Math.pow(1 - p, 3))); el.textContent = v.toLocaleString('en-IN') + suf; if (p < 1) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  /* ---------- hero carousel ---------- */
  const car = $('#heroCar');
  if (car && typeof PRODUCTS !== 'undefined') {
    const picks = ['h-5x6', 'l-5b', 'm-3x3', 'h-4x6', 'l-dbl'].map(id => PRODUCTS.find(p => p.id === id));
    car.innerHTML = `
      <div class="car-track">${picks.map((p, i) => `
        <div class="car-slide${i === 0 ? ' on' : ''}">
          <img src="${img(p.imgs[0])}" alt="${p.name} dog cage by Hi-Tech Craft" ${i ? 'loading="lazy"' : ''}>
          <div class="car-cap"><div><small>${p.size} · ${p.dims[0]}</small><h3>${p.name}</h3></div><div class="pr">${inr(p.price)}</div></div>
        </div>`).join('')}</div>
      <div class="dots">${picks.map((_, i) => `<button aria-label="Slide ${i + 1}"${i === 0 ? ' class="on"' : ''}></button>`).join('')}</div>
      <div class="car-ctrl"><button class="arrow" data-d="-1" aria-label="Previous">${ARROW_L}</button><button class="arrow" data-d="1" aria-label="Next">${ARROW_R}</button></div>`;
    const track = $('.car-track', car), slides = $$('.car-slide', car), dots = $$('.dots button', car);
    let i = 0, timer;
    const go = n => {
      i = (n + slides.length) % slides.length;
      track.style.transform = `translateX(-${i * 100}%)`;
      slides.forEach((s, k) => s.classList.toggle('on', k === i));
      dots.forEach((d, k) => d.classList.toggle('on', k === i));
    };
    const play = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => go(i + 1), 5200); };
    $$('.arrow', car).forEach(b => b.addEventListener('click', () => { go(i + +b.dataset.d); play(); }));
    dots.forEach((d, k) => d.addEventListener('click', () => { go(k); play(); }));
    let sx = 0;
    car.addEventListener('touchstart', e => { sx = e.touches[0].clientX; clearInterval(timer); }, { passive: true });
    car.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); play(); });
    car.addEventListener('mouseenter', () => clearInterval(timer)); car.addEventListener('mouseleave', play);
    play();
  }

  /* ---------- product card + modal ---------- */
  const card = p => `
    <article class="pcard" data-id="${p.id}" tabindex="0" role="button" aria-label="${p.name}, ${inr(p.price)}">
      <div class="pimg"><img src="${img(p.imgs[0])}" alt="${p.name} dog cage" loading="lazy">
        <div class="ptag"><span>${p.size}</span>${p.cat.includes('hitech') ? '<span>Hi-Tech</span>' : ''}${p.cat.includes('double') ? '<span>Double</span>' : ''}${p.cat.includes('drainage') ? '<span>Drainage</span>' : ''}</div></div>
      <div class="pbody">
        <h3>${p.name}</h3>
        <div class="pdims">${p.dims.slice(0, 3).map(d => `<span>${d}</span>`).join('<span>·</span>')}</div>
        <div class="pfoot"><div class="price"><small>Starting at</small>${inr(p.price)}</div><span class="more">Details ${ARROW_GO}</span></div>
      </div>
    </article>`;

  const modal = $('#modal');
  let mp = null, mi = 0;
  const closeIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const WA_PATH = 'M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 01-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 012.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0012.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 005.69 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41z';
  const waIcon = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="${WA_PATH}"/></svg>`;
  function openModal(id) {
    mp = PRODUCTS.find(p => p.id === id); if (!mp) return; mi = 0;
    modal.innerHTML = `<div class="modal-bg"></div>
      <div class="modal-box" role="dialog" aria-modal="true" aria-label="${mp.name}">
        <button class="mclose" aria-label="Close">${closeIcon}</button>
        <div class="modal-gal"><img class="mimg" src="${img(mp.imgs[0])}" alt="${mp.name}">
          ${mp.imgs.length > 1 ? `<button class="arrow prev" aria-label="Previous photo">${ARROW_L}</button><button class="arrow next" aria-label="Next photo">${ARROW_R}</button>
          <div class="mthumbs">${mp.imgs.map((k, n) => `<button class="${n ? '' : 'on'}" data-n="${n}"><img src="${img(k)}" alt=""></button>`).join('')}</div>` : ''}
        </div>
        <div class="modal-info">
          <span class="eyebrow">${mp.size} size</span>
          <h3>${mp.name}</h3>
          <div class="price"><small>Price</small>${inr(mp.price)}</div>
          <p style="color:#4b5057">${mp.note}</p>
          <div class="spec">${mp.dims.map(d => `<div><small>Spec</small><b>${d}</b></div>`).join('')}</div>
          <p style="font-size:.88rem;color:#5b6168">Includes inbuilt food door, full cage priming and suitable roofing. 2-month instalment plans available.</p>
          <div class="cta-row" style="margin-top:auto"><a class="btn btn-wa" target="_blank" rel="noopener" href="${wa(`Hi Hi-Tech Craft, I'm interested in the "${mp.name}" (${inr(mp.price)}). Please share more details.`)}">${waIcon} Enquire on WhatsApp</a>
          <a class="btn btn-line" href="custom.html">Customise this</a></div>
        </div>
      </div>`;
    modal.classList.add('open'); document.body.style.overflow = 'hidden';
    const show = n => {
      mi = (n + mp.imgs.length) % mp.imgs.length;
      $('.mimg', modal).src = img(mp.imgs[mi]);
      $$('.mthumbs button', modal).forEach((b, k) => b.classList.toggle('on', k === mi));
    };
    modal.onclick = e => {
      if (e.target.closest('.mclose') || e.target.classList.contains('modal-bg')) return closeModal();
      if (e.target.closest('.prev')) show(mi - 1);
      if (e.target.closest('.next')) show(mi + 1);
      const t = e.target.closest('.mthumbs button'); if (t) show(+t.dataset.n);
    };
  }
  function closeModal() { modal.classList.remove('open'); modal.innerHTML = ''; document.body.style.overflow = ''; }
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal?.classList.contains('open')) closeModal();
    if (modal?.classList.contains('open') && mp?.imgs.length > 1) {
      const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (dir) $(dir > 0 ? '.next' : '.prev', modal)?.click();
    }
    if (e.key === 'Enter') { const c = document.activeElement?.closest?.('.pcard'); if (c) openModal(c.dataset.id); }
  });
  document.addEventListener('click', e => { const c = e.target.closest('.pcard'); if (c && !drag.moved) openModal(c.dataset.id); });

  /* ---------- featured scroller ---------- */
  const drag = { moved: false };
  const feat = $('#featured');
  if (feat) {
    const ids = ['m-3x3', 'l-5b', 'h-5x6', 's-2x25', 'l-dbl', 'h-4x6', 'l-4d', 's-dbl'];
    feat.innerHTML = ids.map(id => card(PRODUCTS.find(p => p.id === id))).join('');
    $$('[data-scroll]').forEach(b => b.addEventListener('click', () => feat.scrollBy({ left: +b.dataset.scroll * 360, behavior: 'smooth' })));
    let down = false, sx = 0, sl = 0;
    feat.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; drag.moved = false; sx = e.clientX; sl = feat.scrollLeft; feat.style.scrollSnapType = 'none'; });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 5) drag.moved = true; feat.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { if (!down) return; down = false; feat.style.scrollSnapType = ''; setTimeout(() => drag.moved = false, 30); });
  }

  /* ---------- catalog ---------- */
  const cat = $('#catalog');
  if (cat) {
    const chips = $('#chips'), sortSel = $('#sort'), cnt = $('#count');
    let f = (location.hash || '#all').slice(1);
    if (!CATS.some(c => c[0] === f)) f = 'all';
    chips.innerHTML = CATS.map(([k, l]) => `<button class="chip${k === f ? ' on' : ''}" data-f="${k}">${l}</button>`).join('');
    const render = () => {
      let list = PRODUCTS.filter(p => f === 'all' || p.cat.includes(f));
      const s = sortSel.value;
      if (s === 'low') list.sort((a, b) => a.price - b.price);
      if (s === 'high') list.sort((a, b) => b.price - a.price);
      cnt.textContent = `${list.length} model${list.length === 1 ? '' : 's'}`;
      cat.innerHTML = list.length ? list.map((p, i) => card(p).replace('<article', `<article data-r="up" style="--d:${(i % 3) * .08}s"`)).join('') : '<p class="empty">No models in this category yet. Message us and we will build one.</p>';
      watch(cat);
    };
    chips.addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      f = b.dataset.f; history.replaceState(null, '', '#' + f);
      $$('.chip', chips).forEach(c => c.classList.toggle('on', c === b)); render();
    });
    sortSel.addEventListener('change', render);
    addEventListener('hashchange', () => { const h = location.hash.slice(1); if (CATS.some(c => c[0] === h)) { f = h; $$('.chip', chips).forEach(c => c.classList.toggle('on', c.dataset.f === f)); render(); } });
    render();
  }

  /* ---------- price table (why-us / custom) ---------- */
  const tb = $('#priceTable');
  if (tb) tb.innerHTML = [...PRODUCTS].sort((a, b) => a.price - b.price).map(p => `<tr><td>${p.name}</td><td>${p.size}</td><td>${p.dims.slice(0, 2).join(' · ')}</td><td>${inr(p.price)}</td></tr>`).join('');

  /* ---------- forms -> WhatsApp ---------- */
  $$('form[data-wa]').forEach(form => form.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const lines = ['Hi Hi-Tech Craft,', form.dataset.wa === 'custom' ? 'I would like a custom dog cage.' : 'I have an enquiry.', ''];
    const label = { name: 'Name', phone: 'Phone', model: 'Model', breed: 'Dog breed', size: 'Size needed', roof: 'Roof', extras: 'Extras', city: 'Location', message: 'Message' };
    Object.keys(label).forEach(k => { if (d[k]) lines.push(`${label[k]}: ${d[k]}`); });
    window.open(wa(lines.join('\n')), '_blank', 'noopener');
  }));

  /* ---------- prefill model from query ---------- */
  const ms = $('select[name=model]');
  if (ms) {
    ms.insertAdjacentHTML('beforeend', PRODUCTS.map(p => `<option>${p.name} (${inr(p.price)})</option>`).join(''));
  }
  $$('[data-year]').forEach(e => e.textContent = new Date().getFullYear());
})();
