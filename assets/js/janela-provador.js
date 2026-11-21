/* Provador 3D embutido (LRGZ Manequim, ?vitrine=1): a janela avisa a própria altura e pede para rolar até o que mostrou. */
(() => {
  const f = document.getElementById("pv-janela");
  if (!f) return;
  // a barra fixa do WhatsApp sai de cena enquanto o provador está na tela (não cobre os botões dele)
  const barra = document.querySelector(".barra-zap");
  if (barra && "IntersectionObserver" in window) new IntersectionObserver(([e]) => barra.classList.toggle("pv-oculto", e.isIntersecting), { rootMargin: "-20% 0px -20% 0px" }).observe(f);
  const suave = () => (matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");
  const topoLivre = () => { const n = document.querySelector(".nav, header.topo, #nav"); return (n ? Math.max(0, n.getBoundingClientRect().bottom) : 0) + 14; };
  addEventListener("message", (e) => {
    if (e.source !== f.contentWindow || !e.data || !e.data.manequim) return;
    const d = e.data;
    if (d.altura) f.style.height = Math.max(480, Math.min(4000, d.altura)) + "px";
    if (d.rolar) {
      const base = f.getBoundingClientRect().top + scrollY, t = base + d.rolar.t, b = base + d.rolar.b;
      const cima = scrollY + topoLivre(), baixo = scrollY + innerHeight - 16;
      let y = null;
      if (d.rolar.modo === "fim") { if (b > baixo) y = b - innerHeight + 24; }
      else if (t < cima || b > baixo) y = t - topoLivre();
      if (y !== null) scrollTo({ top: Math.max(0, y), behavior: suave() });
    }
  });
})();
