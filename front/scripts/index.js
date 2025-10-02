console.log(tempData);
"use strict";

// --- Config & elementos de destino ---
const DEFAULT_IMG = "https://picsum.photos/seed/pm2-movies/400/600";
const cardsEl = document.getElementById("gallery");
const top3El = document.getElementById("top3");

// --- Datos: Las 3 más vistas ---
const top3 = [
  {
    title: "Avatar",
    year: 2009,
    director: "James Cameron",
    duration: "2h 42min",
    genre: ["Ciencia Ficción"],
    rate: 7.9,
    poster: "https://upload.wikimedia.org/wikipedia/en/d/d6/Avatar_%282009_film%29_poster.jpg",
  },
  {
    title: "Avengers: Endgame",
    year: 2019,
    director: "Anthony y Joe Russo",
    duration: "3h 01min",
    genre: ["Superhéroes", "Acción"],
    rate: 8.4,
    poster: "https://upload.wikimedia.org/wikipedia/en/0/0d/Avengers_Endgame_poster.jpg",
  },
  {
    title: "Avatar: The Way of Water",
    year: 2022,
    director: "James Cameron",
    duration: "3h 12min",
    genre: ["Ciencia Ficción"],
    rate: 7.5,
    poster: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTQpHfdpzyrY6y-yaiEjEfbkpcoFbnycuN6jg&s",
  },
];



// --- Normalización al schema de tus tarjetas ---
function normalizeMovie(m) {
  return {
    id: crypto.randomUUID?.() ?? `${m.title}-${m.year}`,
    title: m?.title ?? "Sin título",
    poster: m?.poster || DEFAULT_IMG,
    year: m?.year ?? "",
    director: m?.director ?? "",
    duration: m?.duration ?? "",
    // Acepta array o string; si es array lo junta con coma
    genre: Array.isArray(m?.genre) ? m.genre.join(", ") : (m?.genre ?? ""),
    rating: typeof m?.rate === "number" ? m.rate : null,
  };
}

// --- Factory de tarjeta ---
function createCard(movie) {
  const el = document.createElement("article");
  el.className = "card";
  const img = movie.poster || DEFAULT_IMG;
  const title = String(movie.title || "Sin título");

  el.innerHTML = `
    <figure class="card-media">
      <img
  src="${img}"
  alt="Póster de ${title}"
  loading="lazy"
  referrerpolicy="no-referrer"
  onerror="this.onerror=null; this.src='${DEFAULT_IMG}'"
/>

    </figure>
    <div class="card-body">
      <h3 class="card-title">${title}</h3>
      <div class="card-meta">
        ${movie.year ? `<span class="badge year">${movie.year}</span>` : ""}
        ${movie.rating != null ? `<span class="badge star">${movie.rating.toFixed(1)}</span>` : ""}
        ${movie.genre ? `<span class="badge">${movie.genre}</span>` : ""}
        ${movie.director ? `<span class="badge">Dir: ${movie.director}</span>` : ""}
        ${movie.duration ? `<span class="badge">${movie.duration}</span>` : ""}
      </div>
    </div>
  `;
  return el;
}

// --- Render genérico a un contenedor ---
function renderInto(containerEl, data) {
  if (!containerEl) return;
  containerEl.innerHTML = "";

  if (!Array.isArray(data) || data.length === 0) {
    const p = document.createElement("p");
    p.textContent = "No hay datos de películas para mostrar.";
    p.style.color = "#8b93a7";
    containerEl.appendChild(p);
    return;
  }

  const frag = document.createDocumentFragment();
  for (const item of data) frag.appendChild(createCard(normalizeMovie(item)));
  containerEl.appendChild(frag);
}

// --- Con <script defer>, podemos ejecutar directo ---
(function main() {
  // tempData viene de scripts/tempData.js
  let data = [];
  try {
    if (Array.isArray(window.tempData)) {
      data = window.tempData;
    } else if (typeof tempData !== "undefined" && Array.isArray(tempData)) {
      data = tempData;
    }
  } catch (_) {}

  renderInto(cardsEl, data);   // Galería principal
  renderInto(top3El, top3);    // Las 3 más vistas
})();

