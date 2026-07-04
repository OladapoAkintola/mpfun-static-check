(function () {
  "use strict";

  const THEME_KEY = "mpfun-site-theme";
  const root = document.documentElement;
  const swatches = document.querySelectorAll(".theme-switch button");

  function applyTheme(name) {
    root.setAttribute("data-theme", name);
    swatches.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.swatch === name);
    });
    localStorage.setItem(THEME_KEY, name);
  }

  swatches.forEach((btn) => {
    btn.addEventListener("click", () => applyTheme(btn.dataset.swatch));
  });

  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme) {
    applyTheme(savedTheme);
  }

  /* ---- Hero visualizer -------------------------------------------- */
  /* Ambient bars using the active theme's viz colors. Reads CSS custom
     properties directly so it recolors the instant the theme switches. */

  const canvas = document.getElementById("visualizer");
  const ctx = canvas.getContext("2d");
  const BAR_COUNT = 28;
  let phases = Array.from({ length: BAR_COUNT }, () => Math.random() * Math.PI * 2);

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
  }

  function themeColor(varName) {
    return getComputedStyle(root).getPropertyValue(varName).trim();
  }

  function drawVisualizer(time) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const barColor = themeColor("--viz-bar");
    const peakColor = themeColor("--viz-peak");
    const gap = w / BAR_COUNT;
    const barWidth = gap * 0.5;

    for (let i = 0; i < BAR_COUNT; i++) {
      const t = time / 900 + phases[i];
      const wobble = (Math.sin(t) + Math.sin(t * 1.7) * 0.5) / 1.5;
      const heightRatio = 0.15 + Math.abs(wobble) * 0.75;
      const barHeight = h * heightRatio;
      const x = i * gap + (gap - barWidth) / 2;

      ctx.fillStyle = barColor;
      ctx.fillRect(x, h - barHeight, barWidth, barHeight);

      ctx.fillStyle = peakColor;
      ctx.fillRect(x, h - barHeight - 3, barWidth, 2);
    }

    requestAnimationFrame(drawVisualizer);
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  if (!prefersReducedMotion) {
    requestAnimationFrame(drawVisualizer);
  } else {
    drawVisualizer(0);
  }

  /* ---- Decorative now playing clock ---------------------------------- */

  const clockEl = document.getElementById("clock");
  let seconds = 0;
  setInterval(() => {
    seconds = (seconds + 1) % 3600;
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    clockEl.textContent = `${m}:${s}`;
  }, 1000);

  /* ---- Pull live release data from version.json ------------------------ */

  fetch("version.json", { cache: "no-store" })
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("version-number").textContent = `v${data.latest_version}`;
      document.getElementById("changelog-line").textContent = data.changelog || "";

      const freeLink = document.getElementById("download-free");
      const proLink = document.getElementById("download-pro");

      if (data.channels?.free?.download_url) {
        freeLink.href = data.channels.free.download_url;
      }
      if (data.channels?.pro?.purchase_url) {
        proLink.href = data.channels.pro.purchase_url;
      }
    })
    .catch(() => {
      document.getElementById("version-number").textContent = "unavailable";
    });
})();
