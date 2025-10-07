'use strict';

/* ===================== Constantes / Refs ===================== */

/* Imagen por defecto si falta poster o falla la carga */
const DEFAULT_IMG = 'https://picsum.photos/seed/pm2-movies/400/600';

/* ----- Referencias a elementos del DOM ----- */
const dialogEl = document.getElementById('movie-dialog');
const openBtn = document.getElementById('add-movie-btn');
const cancelBtn = document.getElementById('cancel-movie-btn');
const formEl = document.getElementById('movie-form');
const galleryEl = document.getElementById('gallery');
const top3El = document.getElementById('top3');

/* Controles de catálogo (opcionales: si no existen, se ignoran) */
const sortByEl = document.getElementById('sort-by'); // 'year' | 'rating'
const sortDirEl = document.getElementById('sort-dir'); // 'asc' | 'desc'
const genreFilterEl = document.getElementById('genre-filter');
const resetFiltersBtn = document.getElementById('reset-filters');

/* === IA Search (OMDb) (opcional) === */
const IA_TITLE_INPUT = document.getElementById('ia-title');
const IA_BTN = document.getElementById('ia-suggest');
const IA_SPINNER = document.querySelector('.ia-spinner');
const IA_LABEL = document.querySelector('.ia-label');

/* Poné tu key gratuita de OMDb acá (https://www.omdbapi.com/apikey.aspx) */
const OMDB_API_KEY = 'a31df53e';
// ← completar para habilitar la búsqueda IA

/* ===================== Datos iniciales ===================== */

/* Acepta:
   - const tempData (global por script normal)
   - window.tempData
   Si no hay datos, usa 2 películas de ejemplo. */
const incoming =
  (typeof tempData !== 'undefined' && Array.isArray(tempData) && tempData) ||
  (Array.isArray(window.tempData) && window.tempData) ||
  [];

let movies = (
  incoming.length
    ? incoming
    : [
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
      ]
).map(normalizeMovie);

/* Top 3 manual si existe (respeta tus posters):
   - const top3Data
   - window.top3Data
   Si no existe, se calcula por rating (sin afectar filtros ni orden del catálogo). */
const top3Source =
  (typeof top3Data !== 'undefined' && Array.isArray(top3Data) && top3Data) ||
  (Array.isArray(window.top3Data) && window.top3Data) ||
  [];

/* ====== Estado de filtros/orden ====== */
const state = {
  sortBy: sortByEl?.value || 'year', // 'year' | 'rating'
  sortDir: sortDirEl?.value || 'desc', // 'asc'  | 'desc'
  genre: '__all__', // '__all__' | 'Action' | ...
};

/* ===================== Utils ===================== */

/* Valida URL sencilla usando URL() */
function isValidUrl(str) {
  if (!str) return false;
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/* Convierte "169 min" -> "2h 49min" */
function minutesToHHMM(runtimeStr) {
  const m = parseInt(String(runtimeStr).replace(/\D+/g, ''), 10);
  if (!Number.isFinite(m) || m <= 0) return '';
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${h}h ${r}min`;
}

/* Normaliza al shape que vos usás (incluye rating) */
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
    genre: genreArr.join(', '), // string para mostrar
    _genreArr: genreArr, // array para filtrar
    rating: Number.isFinite(parsedRate) ? parsedRate : null,
  };
}

/* Crea el HTML de una tarjeta usando tus clases + botón Eliminar */
function createCard(movie) {
  const el = document.createElement('article');
  el.className = 'card';
  el.dataset.id = movie.id;
  el.innerHTML = `
    <div class="card-poster-wrap">
      <img class="card-poster" src="${movie.poster}" alt="Poster de ${movie.title}"
           loading="lazy" onerror="this.src='${DEFAULT_IMG}'" />
    </div>
    <div class="card-body">
      <h3 class="card-title">${movie.title}</h3>
      <p class="card-meta">${movie.year} · ${movie.duration}</p>
      <p class="card-dir">Dir: ${movie.director}</p>
      <p class="card-genre">${movie.genre}</p>
      <p class="card-rate">⭐ ${movie.rating ?? '-'}</p>
      <div class="actions">
        <button class="btn-danger" data-action="delete">Eliminar</button>
      </div>
    </div>
  `;
  return el;
}
// === helper: limpiar formulario de "Agregar" ===
function resetAddForm() {
  if (formEl) formEl.reset();
  // limpiar buscador IA
  if (IA_TITLE_INPUT) IA_TITLE_INPUT.value = '';
  if (typeof setIaLoading === 'function') setIaLoading(false);
}

// Abrir: siempre limpio antes de mostrar
openBtn?.addEventListener('click', () => {
  resetAddForm();
  dialogEl?.showModal();
});

// Cancelar (botón)
cancelBtn?.addEventListener('click', () => {
  resetAddForm();
  dialogEl?.close();
});

// Cerrar por otros medios (Esc, click en [x], etc.)
dialogEl?.addEventListener('close', resetAddForm);

// (opcional) si querés capturar Esc y evitar que quede sucio:
dialogEl?.addEventListener('cancel', (e) => {
  e.preventDefault(); // evita cierre implícito
  resetAddForm();
  dialogEl?.close();
});

/* ---- Helpers de filtros/orden ---- */
function computeGenres(list) {
  const set = new Set();
  list.forEach((m) => (m._genreArr || []).forEach((g) => set.add(g)));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function populateGenreFilter() {
  if (!genreFilterEl) return;
  const current = genreFilterEl.value || '__all__';
  const genres = computeGenres(movies);
  genreFilterEl.innerHTML =
    `<option value="__all__">Todos</option>` +
    genres.map((g) => `<option value="${g}">${g}</option>`).join('');
  if ([...genreFilterEl.options].some((o) => o.value === current)) {
    genreFilterEl.value = current;
  }
}

function applyFiltersAndSort(list) {
  let out = [...list];

  // Filtro por género
  if (state.genre !== '__all__') {
    out = out.filter((m) => (m._genreArr || []).includes(state.genre));
  }

  // Orden
  const key = state.sortBy === 'rating' ? 'rating' : 'year';
  out.sort((a, b) => {
    const av = Number.isFinite(a[key]) ? a[key] : -Infinity;
    const bv = Number.isFinite(b[key]) ? b[key] : -Infinity;
    return state.sortDir === 'asc' ? av - bv : bv - av;
  });

  return out;
}

/* ===================== Eventos de UI ===================== */

/* Abrir/cerrar diálogo */
openBtn?.addEventListener('click', () => dialogEl?.showModal());
cancelBtn?.addEventListener('click', () => dialogEl?.close());

/* Alta de película con validación simple */
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

  // Requeridos
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
    const firstKey = missing[0][0];
    alert(`Falta completar: ${missing.map(([, label]) => label).join(', ')}`);
    formEl.querySelector(`[name="${firstKey}"]`)?.focus();
    return;
  }

  // Números
  const yearNum = Number(fields.year);
  const rateNum = Number(fields.rate);
  if (!Number.isFinite(yearNum) || yearNum < 1888 || yearNum > 2100) {
    alert('Año inválido. Ingresá un número entre 1888 y 2100.');
    formEl.querySelector('[name="year"]')?.focus();
    return;
  }
  if (!Number.isFinite(rateNum) || rateNum < 0 || rateNum > 10) {
    alert('Rating inválido. Ingresá un número entre 0 y 10.');
    formEl.querySelector('[name="rate"]')?.focus();
    return;
  }

  // Poster opcional
  const posterUrl = isValidUrl(fields.poster) ? fields.poster : DEFAULT_IMG;

  // Normaliza y agrega
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

/* Delegación para Eliminar (solo catálogo) */
galleryEl?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="delete"]');
  if (!btn) return;
  const card = btn.closest('.card');
  const id = card?.dataset?.id;
  if (!id) return;

  movies = movies.filter((m) => m.id !== id);
  populateGenreFilter();
  render(); // Top 3 se respeta tal cual lo tenés
});

/* Controles de filtros/orden */
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

/* ===================== IA (OMDb) ===================== */

function setIaLoading(isLoading) {
  if (!IA_BTN) return;
  IA_BTN.disabled = isLoading;
  if (IA_SPINNER) IA_SPINNER.hidden = !isLoading;
  if (IA_LABEL) IA_LABEL.textContent = isLoading ? 'Buscando...' : 'Sugerir IA';
}

/* Llama a OMDb por título exacto */
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

/* Completa el form SOLO en campos vacíos (no pisa lo que el usuario ya escribió) */
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
    if (!String(input.value || '').trim() && value !== undefined && value !== null) {
      input.value = value;
    }
  };

  setIfEmpty('title', m.title);
  setIfEmpty('year', m.year);
  setIfEmpty('director', m.director);
  setIfEmpty('duration', m.duration);
  setIfEmpty('genre', m.genre); // "Action, Sci-Fi"
  setIfEmpty('rate', m.rate);
  setIfEmpty('poster', m.poster);
}

/* Handler del botón IA (si existe en el DOM) */
IA_BTN?.addEventListener('click', async () => {
  const q = (IA_TITLE_INPUT?.value || '').trim();
  if (!q) {
    alert('Escribí un título para buscar.');
    IA_TITLE_INPUT?.focus();
    return;
  }
  if (!OMDB_API_KEY) {
    alert('Falta configurar OMDb API Key en index.js');
    return;
  }

  try {
    setIaLoading(true);
    const data = await fetchOmdbByTitle(q);
    hydrateFormFromOmdb(data);
    (formEl?.querySelector('[name="title"]') || formEl)?.focus();
  } catch (err) {
    console.error(err);
    alert('No se pudo traer datos para ese título. Probá con otro o verificá la API key.');
  } finally {
    setIaLoading(false);
  }
});

/* ===================== Render ===================== */

/* Render principal:
   - Pinta catálogo aplicando filtros/orden
   - Top 3: usa top3Data si existe, si no lo calcula por rating (tu comportamiento original)
   (Los filtros/orden del catálogo NO afectan el Top 3) */
function render() {
  // Catálogo
  if (galleryEl) {
    galleryEl.innerHTML = '';
    const list = applyFiltersAndSort(movies);
    list.forEach((m) => galleryEl.appendChild(createCard(m)));
  }

  // Top 3
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

/* Primera pintura */
populateGenreFilter();
render();
