(() => {
  'use strict';
  const e = 'https://picsum.photos/seed/pm2-movies/400/600',
    t = document.getElementById('movie-dialog'),
    r = document.getElementById('add-movie-btn'),
    n = document.getElementById('cancel-movie-btn'),
    a = document.getElementById('movie-form'),
    i = document.getElementById('gallery'),
    o = document.getElementById('top3'),
    s = document.getElementById('sort-by'),
    c = document.getElementById('sort-dir'),
    l = document.getElementById('genre-filter'),
    d = document.getElementById('reset-filters'),
    u = document.getElementById('ia-title'),
    m = document.getElementById('ia-suggest'),
    g = document.querySelector('.ia-spinner'),
    p = document.querySelector('.ia-label'),
    y = document.getElementById('theme-toggle');
  let f = [
    {
      title: 'The Matrix',
      year: 1999,
      director: 'The Wachowskis',
      duration: '2h 16min',
      genre: ['Action', 'Sci-Fi'],
      rate: 8.7,
      poster:
        'https://m.media-amazon.com/images/M/MV5BNzQzOTk3NjAtNDQ0ZC00ZjkwLWI0MjQtYzYyZWEzN2M2ZGU2XkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg',
    },
    {
      title: 'Interstellar',
      year: 2014,
      director: 'Christopher Nolan',
      duration: '2h 49min',
      genre: ['Adventure', 'Drama', 'Sci-Fi'],
      rate: 8.6,
      poster:
        'https://m.media-amazon.com/images/M/MV5BMjIxMjgxNzM2Nl5BMl5BanBnXkFtZTgwNjUxNzE3MjE@._V1_SX300.jpg',
    },
  ].map(_);
  const h = (Array.isArray(window.top3Data) && window.top3Data) || [],
    v = { sortBy: s?.value || 'year', sortDir: c?.value || 'desc', genre: '__all__' };
  function E(e) {
    document.documentElement.setAttribute('data-bs-theme', e);
    try {
      localStorage.setItem('pm2-theme', e);
    } catch {}
    y && y.setAttribute('aria-pressed', 'dark' === e ? 'true' : 'false');
  }
  function b(e) {
    const t = parseInt(String(e).replace(/\D+/g, ''), 10);
    return !Number.isFinite(t) || t <= 0 ? '' : `${Math.floor(t / 60)}h ${t % 60}min`;
  }
  function _(t) {
    const r = Number(t?.rate ?? t?.rating),
      n = Array.isArray(t?.genre)
        ? t.genre
        : 'string' == typeof t?.genre
        ? t.genre
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean)
        : [];
    return {
      id: crypto.randomUUID?.() ?? `${t?.title ?? 'Sin título'}-${t?.year ?? ''}`,
      title: t?.title || 'Sin título',
      poster: t?.poster || e,
      year: t?.year || '',
      director: t?.director || '',
      duration: t?.duration || '',
      genre: n.join(', '),
      _genreArr: n,
      rating: Number.isFinite(r) ? r : null,
    };
  }
  function w() {
    i &&
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          i.style.minHeight = '';
        });
      });
  }
  function A(e, t, r) {
    const n = document.createElement(e);
    return t && (n.className = t), null != r && (n.textContent = r), n;
  }
  function N(e, t = 'text-bg-secondary') {
    const r = A('span', `badge ${t}`);
    return (r.textContent = e), r;
  }
  function B(t) {
    const r = A('article', 'card');
    r.dataset.id = t.id;
    const n = A('div', 'card-poster-wrap'),
      a = A('img', 'card-poster');
    (a.src = t.poster),
      (a.alt = `Poster de ${t.title}`),
      (a.loading = 'lazy'),
      (a.decoding = 'async'),
      (a.width = 400),
      (a.height = 600),
      (a.onerror = () => {
        a.src = e;
      }),
      n.appendChild(a);
    const i = A('div', 'card-body'),
      o = A('h3', 'card-title', t.title),
      s = A('p', 'card-meta', `${t.year || '-'} · ${t.duration || ''}`),
      c = A('p', 'card-dir', `Dir: ${t.director || '-'}`),
      l = A('p', 'card-genre');
    (t._genreArr || []).forEach((e) => l.appendChild(N(e, 'text-bg-secondary')));
    const d = A('div', 'actions'),
      u = A('span', 'card-rate');
    u.appendChild(N('number' == typeof t.rating ? `⭐ ${t.rating}` : '⭐ -', 'text-bg-warning'));
    const m = A('button', 'btn-danger');
    return (
      (m.type = 'button'),
      (m.title = 'Eliminar'),
      (m.dataset.action = 'delete'),
      (m.textContent = 'Eliminar'),
      d.append(u, m),
      i.append(o, s, c, l, d),
      r.append(n, i),
      r
    );
  }
  function I() {
    a?.reset(), u && (u.value = ''), j(!1);
  }
  function S() {
    if (!l) return;
    const e = l.value || '__all__',
      t = (function (e) {
        const t = new Set();
        return (
          e.forEach((e) => (e._genreArr || []).forEach((e) => t.add(e))),
          Array.from(t).sort((e, t) => e.localeCompare(t))
        );
      })(f);
    (l.innerHTML =
      '<option value="__all__">Todos</option>' +
      t.map((e) => `<option value="${e}">${e}</option>`).join('')),
      [...l.options].some((t) => t.value === e) && (l.value = e);
  }
  function D() {
    s && (v.sortBy = s.value), c && (v.sortDir = c.value), l && (v.genre = l.value), k();
  }
  function j(e) {
    m &&
      ((m.disabled = e),
      g && (g.hidden = !e),
      p && (p.textContent = e ? 'Buscando...' : 'Buscar datos'));
  }
  function k() {
    i &&
      ((i.innerHTML = ''),
      (function (e) {
        let t = [...e];
        '__all__' !== v.genre && (t = t.filter((e) => (e._genreArr || []).includes(v.genre)));
        const r = 'rating' === v.sortBy ? 'rating' : 'year';
        return (
          t.sort((e, t) => {
            const n = Number.isFinite(e[r]) ? e[r] : -1 / 0,
              a = Number.isFinite(t[r]) ? t[r] : -1 / 0;
            return 'asc' === v.sortDir ? n - a : a - n;
          }),
          t
        );
      })(f).forEach((e) => i.appendChild(B(e)))),
      o &&
        ((o.innerHTML = ''),
        (h.length
          ? h.map(_)
          : [...f]
              .filter((e) => Number.isFinite(e.rating))
              .sort((e, t) => t.rating - e.rating)
              .slice(0, 3)
        ).forEach((e) => o.appendChild(B(e))));
  }
  !(function () {
    let e = 'light';
    try {
      e =
        localStorage.getItem('pm2-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch {}
    E(e);
  })(),
    y?.addEventListener('click', () => {
      E(
        'light' === (document.documentElement.getAttribute('data-bs-theme') || 'light')
          ? 'dark'
          : 'light',
      );
    }),
    r?.addEventListener('click', () => {
      I(), t?.showModal();
    }),
    n?.addEventListener('click', () => {
      I(), t?.close();
    }),
    t?.addEventListener('close', I),
    t?.addEventListener('cancel', (e) => {
      e.preventDefault(), I(), t?.close();
    }),
    s?.addEventListener('change', D),
    c?.addEventListener('change', D),
    l?.addEventListener('change', D),
    d?.addEventListener('click', () => {
      s && (s.value = 'year'),
        c && (c.value = 'desc'),
        l && (l.value = '__all__'),
        (v.sortBy = 'year'),
        (v.sortDir = 'desc'),
        (v.genre = '__all__'),
        k();
    }),
    a?.addEventListener('submit', (r) => {
      r.preventDefault();
      const n = new FormData(a),
        i = {
          title: (n.get('title') || '').trim(),
          year: (n.get('year') || '').toString().trim(),
          director: (n.get('director') || '').trim(),
          duration: (n.get('duration') || '').trim(),
          genre: (n.get('genre') || '').trim(),
          rate: (n.get('rate') || '').toString().trim(),
          poster: (n.get('poster') || '').trim(),
        },
        o = [
          ['title', 'Título'],
          ['year', 'Año'],
          ['director', 'Director'],
          ['duration', 'Duración'],
          ['genre', 'Géneros'],
          ['rate', 'Rating'],
        ].filter(([e]) => !i[e]);
      if (o.length)
        return (
          alert(`Falta completar: ${o.map(([, e]) => e).join(', ')}`),
          void a.querySelector(`[name="${o[0][0]}"]`)?.focus()
        );
      const s = Number(i.year),
        c = Number(i.rate);
      if (!Number.isFinite(s) || s < 1888 || s > 2100)
        return alert('Año inválido. 1888–2100.'), void a.querySelector('[name="year"]')?.focus();
      if (!Number.isFinite(c) || c < 0 || c > 10)
        return alert('Rating inválido. 0–10.'), void a.querySelector('[name="rate"]')?.focus();
      const l = (function (e) {
          if (!e) return !1;
          try {
            return new URL(e), !0;
          } catch {
            return !1;
          }
        })(i.poster)
          ? i.poster
          : e,
        d = _({
          title: i.title,
          year: s,
          director: i.director,
          duration: i.duration,
          genre: i.genre
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean),
          rate: c,
          poster: l,
        });
      f.push(d), S(), k(), a.reset(), t?.close();
    }),
    i?.addEventListener('click', (e) => {
      const t = e.target.closest('[data-action="delete"]');
      if (!t) return;
      const r = t.closest('.card'),
        n = r?.dataset?.id;
      n && ((f = f.filter((e) => e.id !== n)), S(), k());
    }),
    m?.addEventListener('click', async () => {
      const e = (u?.value || '').trim();
      if (!e) return alert('Escribí un título para buscar.'), void u?.focus();
      try {
        j(!0),
          !(function (e) {
            if (!a) return;
            const t = {
                title: e.Title || '',
                year: Number(e.Year) || '',
                director: e.Director && 'N/A' !== e.Director ? e.Director : '',
                duration: b(e.Runtime),
                genre: e.Genre && 'N/A' !== e.Genre ? e.Genre : '',
                rate: Number(e.imdbRating) || '',
                poster: e.Poster && 'N/A' !== e.Poster ? e.Poster : '',
              },
              r = (e, t) => {
                const r = a.querySelector(`[name="${e}"]`);
                r && (String(r.value || '').trim() || null == t || (r.value = t));
              };
            r('title', t.title),
              r('year', t.year),
              r('director', t.director),
              r('duration', t.duration),
              r('genre', t.genre),
              r('rate', t.rate),
              r('poster', t.poster);
          })(
            await (async function (e) {
              const t = `https://www.omdbapi.com/?t=${encodeURIComponent(
                  e,
                )}&plot=short&r=json&apikey=a31df53e`,
                r = await fetch(t);
              if (!r.ok) throw new Error('HTTP ' + r.status);
              const n = await r.json();
              if (!n || 'False' === n.Response) throw new Error(n?.Error || 'Sin resultados');
              return n;
            })(e),
          ),
          (a?.querySelector('[name="title"]') || a)?.focus();
      } catch {
        alert('No se pudo traer datos para ese título.');
      } finally {
        j(!1);
      }
    }),
    S(),
    k(),
    (function () {
      const e = !!window.jQuery;
      console.log('Init → jQuery:', e ? $.fn.jquery : 'NO CARGADO'),
        e &&
          ((function () {
            if (!i) return;
            const e = i.offsetHeight;
            e && (i.style.minHeight = e + 'px');
          })(),
          $.get('https://students-api.up.railway.app/movies')
            .done((e) => {
              if (!Array.isArray(e))
                return console.warn('Respuesta inesperada de la API; uso datos locales.'), void w();
              (f = e.map(_)), S(), k();
              const t = [...(i?.querySelectorAll('img') || [])];
              t.length && t[0].decode
                ? Promise.allSettled(t.map((e) => e.decode().catch(() => {}))).finally(w)
                : w();
            })
            .fail((e, t) => {
              console.warn('No se pudo cargar desde la API:', t, e?.status), w();
            }));
    })();
})();
