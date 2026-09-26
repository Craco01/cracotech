// Script para cargar dinámicamente el iframe según el parámetro "src"
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const src = params.get("src") || "default.html"; // fallback si no hay parámetro
  document.getElementById("contenido").src = src;
});
// Script para cargar dinámicamente el iframe según el parámetro "src"
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const src = params.get("src") || "default.html"; // fallback si no hay parámetro
  document.getElementById("contenido").src = src;
});
