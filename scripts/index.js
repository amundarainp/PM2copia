'use strict';

/* ============================================================
 * PM2 · Películas — index.js (markup original, robusto y sin saltos)
 * ============================================================
 */

/* 1) Constantes y referencias */
const DEFAULT_IMG = 'https://picsum.photos/seed/pm2-movies/400/600'; // 400x600 → 2:3
const API_URL = 'https://students-api.up.railway.app/movies';
const OMDB_API_KEY = 'a31df53e';

const dialogEl = document.getElementById('movie-dialog');
const openBtn = document.getElementById('add-movie-btn');
const cancelBtn = document.getElementById('cancel-movie-btn');
const formEl = document.getElementById('movie-form');

const galleryEl = document.getElementById('gallery');
const top3El = document.getElementById('top3');

const sortByEl = document.getElementById('sort-by');
const sortDirEl = document.getElementById('sort-dir');
const genreFilterEl = document.getElementById('genre-filter');
const resetFiltersBtn = document.getElementById('reset-filters');

const iaTitleInput = document.getElementById('ia-title');
const iaBtn = document.getElementById('ia-suggest');
const iaSpinner = document.querySelector('.ia-spinner');
const iaLabel = document.querySelector('.ia-label');

const themeToggleBtn = document.getElementById('theme-toggle');

/* 2) Seed local (sin tempData) */
let movies = [
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
].map(normalizeMovie);

/* Top 3 opcional desde archivo externo (como antes) */
const top3Source = (Array.isArray(window.top3Data) && window.top3Data) || [];

/* 3) Estado de UI */
const state = {
  sortBy: sortByEl?.value || 'year',
  sortDir: sortDirEl?.value || 'desc',
  genre: '__all__',
};

/* ============================================================
 * Tema claro/oscuro con persistencia
 * ==========================================================*/
function applyTheme(theme) {
  const root = document.documentElement;
  root.setAttribute('data-bs-theme', theme);
  try {
    localStorage.setItem('pm2-theme', theme);
  } catch {}
  if (themeToggleBtn)
    themeToggleBtn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
}
(function initTheme() {
  let theme = 'light';
  try {
    theme =
      localStorage.getItem('pm2-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch {}
  applyTheme(theme);
})();
themeToggleBtn?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-bs-theme') || 'light';
  applyTheme(current === 'light' ? 'dark' : 'light');
});

/* ============================================================
 * Helpers
 * ==========================================================*/
function isValidUrl(str) {
  if (!str) return false;
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function minutesToHHMM(runtimeStr) {
  const m = parseInt(String(runtimeStr).replace(/\D+/g, ''), 10);
  if (!Number.isFinite(m) || m <= 0) return '';
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${h}h ${r}min`;
}

function normalizeMovie(m) {
  const parsedRate = Number(m?.rate ?? m?.rating);
  const genreArr = Array.isArray(m?.genre)
    ? m.genre
    : typeof m?.genre === 'string'
    ? m.genre
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  return {
    id: crypto.randomUUID?.() ?? `${m?.title ?? 'Sin título'}-${m?.year ?? ''}`,
    title: m?.title || 'Sin título',
    poster: m?.poster || DEFAULT_IMG,
    year: m?.year || '',
    director: m?.director || '',
    duration: m?.duration || '',
    genre: genreArr.join(', '),
    _genreArr: genreArr,
    rating: Number.isFinite(parsedRate) ? parsedRate : null,
  };
}

function computeGenres(list) {
  const set = new Set();
  list.forEach((m) => (m._genreArr || []).forEach((g) => set.add(g)));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/* ---- Lock/Unlock: congela la altura de la galería para evitar salto durante fetch ---- */
function lockGallery() {
  if (!galleryEl) return;
  const h = galleryEl.offsetHeight;
  if (h) galleryEl.style.minHeight = h + 'px';
}
function unlockGallery() {
  if (!galleryEl) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      galleryEl.style.minHeight = '';
    });
  });
}

/* ============================================================
 * UI: tarjeta (sin innerHTML) + badges Bootstrap
 * ==========================================================*/
function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text != null) el.textContent = text;
  return el;
}

function createBadge(text, cls = 'text-bg-secondary') {
  const span = createEl('span', `badge ${cls}`);
  span.textContent = text;
  return span;
}

function createCard(movie) {
  const article = createEl('article', 'card');
  article.dataset.id = movie.id;

  // Poster
  const posterWrap = createEl('div', 'card-poster-wrap');
  const img = createEl('img', 'card-poster');
  img.src = movie.poster;
  img.alt = `Poster de ${movie.title}`;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.width = 400; // 2:3
  img.height = 600;
  img.onerror = () => {
    img.src = DEFAULT_IMG;
  };
  posterWrap.appendChild(img);

  // Body
  const body = createEl('div', 'card-body');
  const title = createEl('h3', 'card-title', movie.title);
  const meta = createEl('p', 'card-meta', `${movie.year || '-'} · ${movie.duration || ''}`);
  const dir = createEl('p', 'card-dir', `Dir: ${movie.director || '-'}`);

  // Géneros como badges
  const genreP = createEl('p', 'card-genre');
  (movie._genreArr || []).forEach((g) => genreP.appendChild(createBadge(g, 'text-bg-secondary')));

  // Rating como badge
  const actions = createEl('div', 'actions');
  const rate = createEl('span', 'card-rate');
  rate.appendChild(
    createBadge(
      typeof movie.rating === 'number' ? `⭐ ${movie.rating}` : '⭐ -',
      'text-bg-warning',
    ),
  );

  const delBtn = createEl('button', 'btn-danger');
  delBtn.type = 'button';
  delBtn.title = 'Eliminar';
  delBtn.dataset.action = 'delete';
  delBtn.textContent = 'Eliminar';

  actions.append(rate, delBtn);
  body.append(title, meta, dir, genreP, actions);

  article.append(posterWrap, body);
  return article;
}

/* ============================================================
 * Diálogo: abrir/cerrar
 * ==========================================================*/
function resetAddForm() {
  formEl?.reset();
  if (iaTitleInput) iaTitleInput.value = '';
  setIaLoading(false);
}
openBtn?.addEventListener('click', () => {
  resetAddForm();
  dialogEl?.showModal();
});
cancelBtn?.addEventListener('click', () => {
  resetAddForm();
  dialogEl?.close();
});
dialogEl?.addEventListener('close', resetAddForm);
dialogEl?.addEventListener('cancel', (e) => {
  e.preventDefault();
  resetAddForm();
  dialogEl?.close();
});

/* ============================================================
 * Filtros / Orden
 * ==========================================================*/
function populateGenreFilter() {
  if (!genreFilterEl) return;
  const current = genreFilterEl.value || '__all__';
  const genres = computeGenres(movies);
  genreFilterEl.innerHTML =
    `<option value="__all__">Todos</option>` +
    genres.map((g) => `<option value="${g}">${g}</option>`).join('');
  if ([...genreFilterEl.options].some((o) => o.value === current)) genreFilterEl.value = current;
}

function applyFiltersAndSort(list) {
  let out = [...list];
  if (state.genre !== '__all__') out = out.filter((m) => (m._genreArr || []).includes(state.genre));
  const key = state.sortBy === 'rating' ? 'rating' : 'year';
  out.sort((a, b) => {
    const av = Number.isFinite(a[key]) ? a[key] : -Infinity;
    const bv = Number.isFinite(b[key]) ? b[key] : -Infinity;
    return state.sortDir === 'asc' ? av - bv : bv - av;
  });
  return out;
}

function onControlsChange() {
  if (sortByEl) state.sortBy = sortByEl.value;
  if (sortDirEl) state.sortDir = sortDirEl.value;
  if (genreFilterEl) state.genre = genreFilterEl.value;
  render();
}
sortByEl?.addEventListener('change', onControlsChange);
sortDirEl?.addEventListener('change', onControlsChange);
genreFilterEl?.addEventListener('change', onControlsChange);

resetFiltersBtn?.addEventListener('click', () => {
  if (sortByEl) sortByEl.value = 'year';
  if (sortDirEl) sortDirEl.value = 'desc';
  if (genreFilterEl) genreFilterEl.value = '__all__';
  state.sortBy = 'year';
  state.sortDir = 'desc';
  state.genre = '__all__';
  render();
});

/* ============================================================
 * Formulario: alta
 * ==========================================================*/
formEl?.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(formEl);
  const fields = {
    title: (data.get('title') || '').trim(),
    year: (data.get('year') || '').toString().trim(),
    director: (data.get('director') || '').trim(),
    duration: (data.get('duration') || '').trim(),
    genre: (data.get('genre') || '').trim(),
    rate: (data.get('rate') || '').toString().trim(),
    poster: (data.get('poster') || '').trim(),
  };

  const required = [
    ['title', 'Título'],
    ['year', 'Año'],
    ['director', 'Director'],
    ['duration', 'Duración'],
    ['genre', 'Géneros'],
    ['rate', 'Rating'],
  ];
  const missing = required.filter(([k]) => !fields[k]);
  if (missing.length) {
    alert(`Falta completar: ${missing.map(([, l]) => l).join(', ')}`);
    formEl.querySelector(`[name="${missing[0][0]}"]`)?.focus();
    return;
  }

  const yearNum = Number(fields.year),
    rateNum = Number(fields.rate);
  if (!Number.isFinite(yearNum) || yearNum < 1888 || yearNum > 2100) {
    alert('Año inválido. 1888–2100.');
    formEl.querySelector('[name="year"]')?.focus();
    return;
  }
  if (!Number.isFinite(rateNum) || rateNum < 0 || rateNum > 10) {
    alert('Rating inválido. 0–10.');
    formEl.querySelector('[name="rate"]')?.focus();
    return;
  }

  const posterUrl = isValidUrl(fields.poster) ? fields.poster : DEFAULT_IMG;
  const movie = normalizeMovie({
    title: fields.title,
    year: yearNum,
    director: fields.director,
    duration: fields.duration,
    genre: fields.genre
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    rate: rateNum,
    poster: posterUrl,
  });

  movies.push(movie);
  populateGenreFilter();
  render();
  formEl.reset();
  dialogEl?.close();
});

/* ============================================================
 * Delegación: eliminar
 * ==========================================================*/
galleryEl?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="delete"]');
  if (!btn) return;
  const card = btn.closest('.card');
  const id = card?.dataset?.id;
  if (!id) return;
  movies = movies.filter((m) => m.id !== id);
  populateGenreFilter();
  render();
});

/* ============================================================
 * OMDb (IA opcional)
 * ==========================================================*/
function setIaLoading(v) {
  if (!iaBtn) return;
  iaBtn.disabled = v;
  if (iaSpinner) iaSpinner.hidden = !v;
  if (iaLabel) iaLabel.textContent = v ? 'Buscando...' : 'Buscar datos';
}

async function fetchOmdbByTitle(title) {
  const url = `https://www.omdbapi.com/?t=${encodeURIComponent(
    title,
  )}&plot=short&r=json&apikey=${OMDB_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (!data || data.Response === 'False') throw new Error(data?.Error || 'Sin resultados');
  return data;
}

function hydrateFormFromOmdb(omdb) {
  if (!formEl) return;
  const m = {
    title: omdb.Title || '',
    year: Number(omdb.Year) || '',
    director: omdb.Director && omdb.Director !== 'N/A' ? omdb.Director : '',
    duration: minutesToHHMM(omdb.Runtime),
    genre: omdb.Genre && omdb.Genre !== 'N/A' ? omdb.Genre : '',
    rate: Number(omdb.imdbRating) || '',
    poster: omdb.Poster && omdb.Poster !== 'N/A' ? omdb.Poster : '',
  };
  const setIfEmpty = (name, value) => {
    const input = formEl.querySelector(`[name="${name}"]`);
    if (!input) return;
    if (!String(input.value || '').trim() && value != null) input.value = value;
  };
  setIfEmpty('title', m.title);
  setIfEmpty('year', m.year);
  setIfEmpty('director', m.director);
  setIfEmpty('duration', m.duration);
  setIfEmpty('genre', m.genre);
  setIfEmpty('rate', m.rate);
  setIfEmpty('poster', m.poster);
}

iaBtn?.addEventListener('click', async () => {
  const q = (iaTitleInput?.value || '').trim();
  if (!q) {
    alert('Escribí un título para buscar.');
    iaTitleInput?.focus();
    return;
  }
  try {
    setIaLoading(true);
    const data = await fetchOmdbByTitle(q);
    hydrateFormFromOmdb(data);
    (formEl?.querySelector('[name="title"]') || formEl)?.focus();
  } catch {
    alert('No se pudo traer datos para ese título.');
  } finally {
    setIaLoading(false);
  }
});

/* ============================================================
 * Render (CSS Grid)
 * ==========================================================*/
function render() {
  if (galleryEl) {
    galleryEl.innerHTML = '';
    const list = applyFiltersAndSort(movies);
    list.forEach((m) => galleryEl.appendChild(createCard(m)));
  }

  if (top3El) {
    top3El.innerHTML = '';
    const topList = top3Source.length
      ? top3Source.map(normalizeMovie)
      : [...movies]
          .filter((m) => Number.isFinite(m.rating))
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 3);
    topList.forEach((m) => top3El.appendChild(createCard(m)));
  }
}

/* ============================================================
 * Boot
 * ==========================================================*/
populateGenreFilter();
render();

/* ============================================================
 * Carga desde API (jQuery $get) — con lock/unlock para evitar salto
 * ==========================================================*/
function loadMoviesFromApi() {
  lockGallery(); // evita el "salto" cuando se reemplaza el seed por la API
  $.get(API_URL)
    .done((data) => {
      if (!Array.isArray(data)) {
        console.warn('Respuesta inesperada de la API; uso datos locales.');
        unlockGallery();
        return;
      }
      movies = data.map(normalizeMovie);
      populateGenreFilter();
      render();
      // Soltar una vez que las nuevas imágenes estén listas
      const imgs = [...(galleryEl?.querySelectorAll('img') || [])];
      if (imgs.length && imgs[0].decode) {
        Promise.allSettled(imgs.map((img) => img.decode().catch(() => {}))).finally(unlockGallery);
      } else {
        unlockGallery();
      }
    })
    .fail((xhr, status) => {
      console.warn('No se pudo cargar desde la API:', status, xhr?.status);
      unlockGallery();
    });
}

(function init() {
  const hasJq = !!window.jQuery;
  console.log('Init → jQuery:', hasJq ? $.fn.jquery : 'NO CARGADO');
  if (hasJq) loadMoviesFromApi(); // reemplaza el seed cuando llegue
})();
