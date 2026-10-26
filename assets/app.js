/* Cirinnà — interactions. No dependencies; every effect degrades to a static page. */
(() => {
  const d = document, root = d.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $$ = (s, el = d) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* header: hide on scroll down, show on scroll up, reading progress */
  const hdr = d.querySelector('.hdr');
  let lastY = scrollY, ticking = false;
  const parallax = reduce ? [] : $$('[data-parallax]');
  const steps = d.querySelector('[data-steps]');
  const onScroll = () => {
    const y = scrollY, max = root.scrollHeight - innerHeight;
    if (hdr) {
      hdr.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
      if (!d.body.classList.contains('nav-open')) hdr.classList.toggle('is-hidden', y > lastY && y > 240);
    }
    lastY = y;
    for (const el of parallax) {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      const k = parseFloat(el.dataset.parallax) * (innerWidth < 760 ? .5 : 1);
      el.style.transform = `translate3d(0,${((r.top + r.height / 2 - innerHeight / 2) * k).toFixed(1)}px,0)`;
    }
    if (steps) {
      const r = steps.getBoundingClientRect();
      steps.style.setProperty('--prog', clamp((innerHeight * .8 - r.top) / (r.height + innerHeight * .3), 0, 1).toFixed(3));
    }
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* mobile menu */
  const navBtn = d.querySelector('.nav-btn'), nav = d.getElementById('nav');
  const setNav = open => {
    navBtn.setAttribute('aria-expanded', open);
    navBtn.querySelector('.sr').textContent = open ? 'Chiudi il menu' : 'Apri il menu';
    d.body.classList.toggle('nav-open', open);
    if (open) { hdr.classList.remove('is-hidden'); nav.querySelector('a').focus({ preventScroll: true }); }
  };
  navBtn && navBtn.addEventListener('click', () => setNav(navBtn.getAttribute('aria-expanded') !== 'true'));
  d.addEventListener('keydown', e => { if (e.key === 'Escape' && d.body.classList.contains('nav-open')) { setNav(false); navBtn.focus(); } });

  /* reveal on scroll (+ draw-on line art) */
  const revealed = $$('[data-reveal], .draw');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    revealed.forEach(el => io.observe(el));
  } else revealed.forEach(el => el.classList.add('is-in'));

  /* niches: pointer spotlight and gentle tilt (desktop only) */
  if (fine && !reduce) $$('[data-tilt]').forEach(n => {
    let raf = 0;
    n.addEventListener('pointermove', e => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = n.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        n.classList.add('is-tilting');
        n.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`); n.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
        n.style.setProperty('--ry', `${((x - .5) * 7).toFixed(2)}deg`); n.style.setProperty('--rx', `${((.5 - y) * 5).toFixed(2)}deg`);
        n.style.setProperty('--tx', `${((x - .5) * -10).toFixed(1)}px`); n.style.setProperty('--ty', `${((y - .5) * -6).toFixed(1)}px`);
      });
    });
    n.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf); n.classList.remove('is-tilting');
      ['--ry', '--rx', '--tx', '--ty'].forEach(p => n.style.removeProperty(p));
    });
  });

  /* aromatised oils: accessible tabs with sliding ink */
  $$('[data-switch]').forEach(sw => {
    const tabs = $$('[role=tab]', sw), ink = sw.querySelector('.sw-ink');
    const moveInk = t => { if (ink) { ink.style.setProperty('--x', `${t.offsetLeft}px`); ink.style.setProperty('--w', `${t.offsetWidth}px`); } };
    const select = (t, focus) => {
      tabs.forEach(o => {
        const on = o === t;
        o.setAttribute('aria-selected', on); o.tabIndex = on ? 0 : -1;
        d.getElementById(o.getAttribute('aria-controls')).hidden = !on;
      });
      $$('.sw-n', sw).forEach(n => n.classList.toggle('on', n.dataset.for === t.id.slice(4)));
      moveInk(t); if (focus) t.focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (k) { e.preventDefault(); select(tabs[(i + k + tabs.length) % tabs.length], true); }
      });
    });
    const cur = tabs.find(t => t.getAttribute('aria-selected') === 'true');
    moveInk(cur); addEventListener('resize', () => moveInk(tabs.find(t => t.getAttribute('aria-selected') === 'true')));
    if (d.fonts) d.fonts.ready.then(() => moveInk(cur));
  });

  /* format picker: radio group that updates the order link */
  $$('.fmt.multi').forEach(g => {
    const opts = $$('[role=radio]', g), buy = g.closest('.buy').querySelector('[data-buy]');
    const pick = (o, focus) => {
      opts.forEach(x => { x.setAttribute('aria-checked', x === o); x.tabIndex = x === o ? 0 : -1; });
      if (buy) buy.href = o.dataset.href;
      if (focus) o.focus();
    };
    opts.forEach((o, i) => {
      o.addEventListener('click', () => pick(o));
      o.addEventListener('keydown', e => {
        const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (k) { e.preventDefault(); pick(opts[(i + k + opts.length) % opts.length], true); }
      });
    });
  });

  /* filter chips (oils, price list) */
  $$('[data-filter]').forEach(bar => {
    const target = d.querySelector(bar.dataset.filter), btns = $$('button', bar);
    btns.forEach(b => b.addEventListener('click', () => {
      btns.forEach(x => x.setAttribute('aria-pressed', x === b));
      const v = b.dataset.v; let n = 0;
      [...target.children].forEach(el => {
        const show = v === '*' || el.dataset.tags === v;
        el.classList.toggle('is-out', !show);
        el.classList.remove('flt-in');
        if (show) { void el.offsetWidth; el.style.setProperty('--n', n++); el.classList.add('flt-in', 'is-in'); }
      });
      target.classList.toggle('single', v !== '*' && target.classList.contains('pl-grid'));
    }));
  });

  /* FAQ: animated open/close on native <details> */
  $$('.faq details').forEach(det => {
    const sum = det.querySelector('summary'), body = det.querySelector('.faq-a');
    sum.addEventListener('click', e => {
      if (reduce || !body.animate) return;
      e.preventDefault();
      if (det.open) {
        body.animate({ height: [`${body.offsetHeight}px`, '0px'], opacity: [1, 0] }, { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => det.open = false;
        det.classList.remove('opening');
      } else {
        det.open = true;
        body.animate({ height: ['0px', `${body.offsetHeight}px`], opacity: [0, 1] }, { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  });

  /* copy e-mail / phone with toast feedback */
  const toast = d.querySelector('.toast');
  let tt;
  const say = msg => {
    if (!toast) return;
    toast.innerHTML = `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.75 12.5l4.5 4.5 10-10"/></svg>${msg}`;
    toast.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('show'), 2200);
  };
  $$('[data-copy]').forEach(b => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(b.dataset.copy); } catch { return; }
    b.classList.add('ok'); setTimeout(() => b.classList.remove('ok'), 1600);
    say(b.dataset.copy.includes('@') ? 'Email copiata' : 'Numero copiato');
  }));

  /* mobile: sticky price bar while the format box is off-screen */
  const bar = d.querySelector('.buybar'), box = d.querySelector('.buy'), media = d.querySelector('.pd-media');
  if (bar && box && 'IntersectionObserver' in window) {
    let boxIn = false, pastMedia = false;
    const upd = () => { const on = pastMedia && !boxIn; bar.classList.toggle('show', on); bar.setAttribute('aria-hidden', !on); bar.querySelector('a').tabIndex = on ? 0 : -1; };
    new IntersectionObserver(([e]) => { boxIn = e.isIntersecting || e.boundingClientRect.top < 0; upd(); }).observe(box);
    new IntersectionObserver(([e]) => { pastMedia = !e.isIntersecting && e.boundingClientRect.top < 0; upd(); }).observe(media);
    bar.querySelector('a').addEventListener('click', e => { e.preventDefault(); box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); });
  }

  /* mobile rails: pagination dots */
  $$('[data-rail]').forEach(r => {
    const dots = r.nextElementSibling;
    if (!dots || !dots.classList.contains('dots')) return;
    dots.innerHTML = [...r.children].map(() => '<i></i>').join('');
    const ds = [...dots.children];
    const upd = () => {
      const w = r.firstElementChild ? r.firstElementChild.offsetWidth + 16 : 1;
      const i = clamp(Math.round(r.scrollLeft / w), 0, ds.length - 1);
      ds.forEach((x, j) => x.classList.toggle('on', j === i));
    };
    r.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true }); upd();
  });
})();
