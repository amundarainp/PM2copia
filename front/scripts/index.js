'use strict';

const DEFAULT_IMG = 'https://picsum.photos/seed/pm2-movies/400/600';

const dialogEl = document.getElementById('movie-dialog');
const openBtn = document.getElementById('add-movie-btn');
const cancelBtn = document.getElementById('cancel-movie-btn');
const formEl = document.getElementById('movie-form');
const galleryEl = document.getElementById('gallery');
const top3El = document.getElementById('top3');

// Datos iniciales: acepta const tempData o window.tempData
const incoming =
  (typeof tempData !== 'undefined' && Array.isArray(tempData) && tempData) ||
  (Array.isArray(window.tempData) && window.tempData) ||
  [];

const movies = (
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

// Top 3 manual si existe: const top3Data o window.top3Data
const top3Source =
  (typeof top3Data !== 'undefined' && Array.isArray(top3Data) && top3Data) ||
  (Array.isArray(window.top3Data) && window.top3Data) ||
  [];

// Abrir / cerrar diálogo
openBtn?.addEventListener('click', () => dialogEl?.showModal());
cancelBtn?.addEventListener('click', () => dialogEl?.close());

// Guardar con validación
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
    const firstKey = missing[0][0];
    alert(`Falta completar: ${missing.map(([, label]) => label).join(', ')}`);
    formEl.querySelector(`[name="${firstKey}"]`)?.focus();
    return;
  }

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
  render();
  formEl.reset();
  dialogEl?.close();
});

// Utils
function isValidUrl(str) {
  if (!str) return false;
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function normalizeMovie(m) {
  const parsedRate = Number(m?.rate);
  return {
    id: crypto.randomUUID?.() ?? `${m.title}-${m.year}`,
    title: m?.title || 'Sin título',
    poster: m?.poster || DEFAULT_IMG,
    year: m?.year || '',
    director: m?.director || '',
    duration: m?.duration || '',
    genre: Array.isArray(m?.genre) ? m.genre.join(', ') : m?.genre || '',
    // mantiene 0, descarta NaN
    rating: Number.isFinite(parsedRate) ? parsedRate : null,
  };
}

function createCard(movie) {
  const el = document.createElement('article');
  el.className = 'card';
  el.innerHTML = `
    <div class="card-poster-wrap">
      <img class="card-poster" src="${movie.poster}" alt="Poster de ${
    movie.title
  }" loading="lazy" onerror="this.src='${DEFAULT_IMG}'" />
    </div>
    <div class="card-body">
      <h3 class="card-title">${movie.title}</h3>
      <p class="card-meta">${movie.year} · ${movie.duration}</p>
      <p class="card-dir">Dir: ${movie.director}</p>
      <p class="card-genre">${movie.genre}</p>
      <p class="card-rate">⭐ ${movie.rating ?? '-'}</p>
    </div>
  `;
  return el;
}

function render() {
  galleryEl.innerHTML = '';
  movies.forEach((m) => galleryEl.appendChild(createCard(m)));

  top3El.innerHTML = '';
  const list = top3Source.length
    ? top3Source.map(normalizeMovie)
    : [...movies]
        .filter((m) => Number.isFinite(m.rating))
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);

  list.forEach((m) => top3El.appendChild(createCard(m)));
}

render();
