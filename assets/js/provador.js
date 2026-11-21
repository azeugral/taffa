/* Provador do Taffa: flashs arrastados para o corpo, com tamanho, giro, espelho e as três tintas.
   O "mundo" tem 2048 px (o tamanho da imagem do corpo, frente à esquerda e costas à direita) e é escalado
   para caber no palco. Posições, zonas e tamanhos são todos calculados nesse espaço. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const DIR = new URL("assets/img/provador/", location.href).href;   // absoluto: url() em variável CSS resolve a partir da folha de estilo
  const CM = 170 / 1888;                       // corpo de 1,70 m ocupa 1888 px de altura na imagem
  const CAIXA = { f: [146, 30, 874, 1918], b: [1174, 30, 1892, 1918] };
  const CORES = { preto: "#151517", vermelho: "#c1121c", azul: "#1d40d2" };
  const WA = "https://wa.me/message/C4M2BNL5XI5LP1";
  const Zs = [
    ["Rosto", "f", "face.{S}", 1], ["Pescoço", "f", "neck.{S}", 0], ["Ombro", "f", "sh.{S}", 1], ["Peito", "f", "chest.{S}", 1],
    ["Braço", "f", "arm.{S}", 1], ["Antebraço interno", "f", "fore.{S}", 1], ["Palma da mão", "f", "hand.{S}", 1], ["Costela", "f", "rib.{S}", 1],
    ["Abdômen", "f", "abd.{S}", 0], ["Quadril", "f", "hip.{S}", 1], ["Coxa", "f", "thigh.{S}", 1], ["Joelho", "f", "knee.{S}", 1],
    ["Canela", "f", "leg.{S}", 1], ["Pé", "f", "foot.{S}", 1], ["Cabeça", "b", "head.{S}", 0], ["Nuca", "b", "neck.{S}", 0],
    ["Ombro (atrás)", "b", "sh.{S}", 1], ["Tríceps", "b", "arm.{S}", 1], ["Antebraço externo", "b", "fore.{S}", 1], ["Dorso da mão", "b", "hand.{S}", 1],
    ["Costas", "b", "back.top.{S}", 0], ["Lombar", "b", "back.low.{S}", 0], ["Glúteo", "b", "hip.{S}", 1], ["Posterior da coxa", "b", "thigh.{S}", 1],
    ["Panturrilha", "b", "leg.{S}", 1], ["Calcanhar", "b", "foot.{S}", 1],
  ];
  // A = lado esquerdo da imagem: de frente é o lado direito da pessoa; de costas, o esquerdo.
  const ladoDe = (s, v) => (s === "C" ? "" : (s === "A") === (v === "f") ? "direito" : "esquerdo");

  const palco = $("#palco"), mundo = $("#mundo"), pecasEl = $("#pecas"), sel = $("#sel");
  const gaveta = $("#gaveta"), lista = $("#lista"), ajuste = $("#ajuste");
  const dica = $("#dica"), localEl = $("#local"), aviso = $("#aviso");
  const rTam = $("#r-tam"), rGiro = $("#r-giro"), oTam = $("#o-tam"), oGiro = $("#o-giro");
  const bPede = $("#b-pede"), bSalva = $("#b-salva");

  let FL = [], zonas = [], alfa = null, vista = innerWidth <= 980 ? "f" : "ambas";
  let T = { x: 0, y: 0, z: 1 };
  const pecas = []; let atual = -1;
  const imgs = {};                              // máscaras carregadas, para salvar a imagem
  const ctxHit = document.createElement("canvas").getContext("2d");

  const carrega = (src) => imgs[src] || (imgs[src] = new Promise((ok, erro) => { const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = src; }));

  /* ---------- vista e escala ---------- */
  function regiao() {
    if (vista === "ambas") return [CAIXA.f[0] - 70, 0, CAIXA.b[2] + 70, 2048];
    const c = CAIXA[vista]; return [c[0] - 60, c[1] - 40, c[2] + 60, c[3] + 90];
  }
  // câmera: centro (cx, cy) no mundo e zoom m sobre o encaixe da vista (1 = vista inteira, até 4x)
  const cam = { cx: 0, cy: 0, m: 1 };
  const ZMAX = 4;
  const z0 = () => { const [x0, y0, x1, y1] = regiao(); return Math.min(palco.clientWidth / (x1 - x0), palco.clientHeight / (y1 - y0)); };
  function reseta() { const [x0, y0, x1, y1] = regiao(); cam.cx = (x0 + x1) / 2; cam.cy = (y0 + y1) / 2; cam.m = 1; }
  function aplica(anima) {
    const W = palco.clientWidth, H = palco.clientHeight, [x0, y0, x1, y1] = regiao(), z = z0() * cam.m;
    // com zoom, a câmera não sai da região da vista
    const mx = Math.max(0, (x1 - x0) / 2 - W / 2 / z), my = Math.max(0, (y1 - y0) / 2 - H / 2 / z);
    cam.cx = Math.min((x0 + x1) / 2 + mx, Math.max((x0 + x1) / 2 - mx, cam.cx));
    cam.cy = Math.min((y0 + y1) / 2 + my, Math.max((y0 + y1) / 2 - my, cam.cy));
    T = { z, x: W / 2 - cam.cx * z, y: H / 2 - cam.cy * z };
    mundo.classList.toggle("anima", !!anima);
    mundo.style.transform = `translate(${T.x}px,${T.y}px) scale(${z})`;
    mundo.style.setProperty("--z", z);
    palco.classList.toggle("zoom", cam.m > 1.01);
    palco.dataset.vista = vista;   // numa vista só, o outro corpo some (não aparece cortado na borda)
    $("#z-menos").disabled = cam.m <= 1.01; $("#z-mais").disabled = cam.m >= ZMAX - .01;
  }
  function encaixa(anima) { reseta(); aplica(anima); }
  // zoom mantendo parado o ponto do mundo que está sob (px, py) do palco
  function zoomEm(m, px, py, anima) {
    const p = { x: (px - T.x) / T.z, y: (py - T.y) / T.z };
    cam.m = Math.min(ZMAX, Math.max(1, m));
    const z = z0() * cam.m;
    cam.cx = p.x - (px - palco.clientWidth / 2) / z; cam.cy = p.y - (py - palco.clientHeight / 2) / z;
    aplica(anima);
  }
  $("#z-mais").addEventListener("click", () => zoomEm(cam.m * 1.6, palco.clientWidth / 2, palco.clientHeight / 2, true));
  $("#z-menos").addEventListener("click", () => zoomEm(cam.m / 1.6, palco.clientWidth / 2, palco.clientHeight / 2, true));
  const noMundo = (cx, cy) => { const r = palco.getBoundingClientRect(); return { x: (cx - r.left - T.x) / T.z, y: (cy - r.top - T.y) / T.z }; };
  const sobrePalco = (cx, cy) => { const r = palco.getBoundingClientRect(); return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom; };
  function centroDaVista() {
    // peito (ou costas); com zoom, se esse ponto saiu da tela, o ponto de pele mais perto do centro do que está à vista
    const pad = vista === "b" ? { x: 1532, y: 560 } : { x: 510, y: 520 };
    if (cam.m <= 1.01) return pad;
    const W = palco.clientWidth, H = palco.clientHeight;
    const sx = pad.x * T.z + T.x, sy = pad.y * T.z + T.y;
    if (sx > W * .15 && sx < W * .85 && sy > H * .15 && sy < H * .85) return pad;
    let melhor = { x: cam.cx, y: cam.cy }, dm = Infinity;
    for (let dy = -H * .35; dy <= H * .35; dy += 12) for (let dx = -W * .35; dx <= W * .35; dx += 12) {
      const p = mundoDe({ x: W / 2 + dx, y: H / 2 + dy }), d = dx * dx + dy * dy;
      if (d < dm && naPele(p)) { dm = d; melhor = p; }
    }
    return melhor;
  }
  $$(".pv-vistas button").forEach((b) => {
    b.setAttribute("aria-pressed", b.dataset.vista === vista);
    b.addEventListener("click", () => {
      vista = b.dataset.vista;
      $$(".pv-vistas button").forEach((x) => x.setAttribute("aria-pressed", x === b));
      encaixa(true);
    });
  });
  new ResizeObserver(() => aplica(false)).observe(palco);

  /* ---------- zonas do corpo ---------- */
  const naPele = (p) => { if (!alfa || p.x < 0 || p.y < 0 || p.x >= 2048 || p.y >= 2048) return false; return alfa[(Math.floor(p.y / 4) * 512 + Math.floor(p.x / 4)) * 4 + 3] > 140; };
  function onde(p) {
    const v = p.x < 1024 ? "f" : "b";
    for (const [nome, vz, k, lado] of Zs) {
      if (vz !== v) continue;
      for (const S of lado ? ["A", "B"] : ["C"]) {
        const z = zonas.find((q) => q.v === v && q.k === k.replace("{S}", S));
        if (z && ctxHit.isPointInPath(z.path, p.x, p.y)) { const l = ladoDe(S, v); return l ? `${nome} ${l}` : nome; }
      }
    }
    if (alfa) {
      const i = (Math.round(p.y / 4) * 512 + Math.round(p.x / 4)) * 4 + 3;
      if (alfa[i] > 90) return v === "f" ? "Corpo (frente)" : "Corpo (costas)";
    }
    return null;
  }

  /* ---------- peças ---------- */
  const cmDe = (q) => Math.round(Math.max(q.w, q.w * q.r) * CM);
  const wDe = (cm, r) => cm / CM / Math.max(1, r);
  function desenha(q) {
    const h = q.w * q.r;
    q.el.style.width = q.w + "px"; q.el.style.height = h + "px";
    q.el.style.transform = `translate(${q.x - q.w / 2}px,${q.y - h / 2}px) rotate(${q.giro}deg) scaleX(${q.flip ? -1 : 1})`;
    q.el.dataset.cor = q.cor;
    q.zona = onde(q);
    if (pecas[atual] === q) mostraSel();
  }
  function mostraSel() {
    const q = pecas[atual];
    if (!q) { sel.hidden = true; localEl.hidden = true; ajuste.setAttribute("aria-disabled", "true"); $("#aj-nome").textContent = ""; return; }
    const h = q.w * q.r;
    sel.hidden = false;
    sel.style.width = q.w + "px"; sel.style.height = h + "px";
    sel.style.transform = `translate(${q.x - q.w / 2}px,${q.y - h / 2}px) rotate(${q.giro}deg)`;
    ajuste.setAttribute("aria-disabled", "false");
    $("#aj-nome").textContent = q.nome;
    const cm = cmDe(q);
    rTam.value = cm; oTam.textContent = `${cm} cm`;
    rGiro.value = Math.round(q.giro); oGiro.textContent = `${Math.round(q.giro)}°`;
    $$(".pv-cores button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.cor === q.cor));
    localEl.hidden = false; dica.hidden = true;
    localEl.classList.toggle("fora", !q.zona);
    localEl.innerHTML = q.zona ? `<b>${q.zona}</b> · ~${cm} cm` : `<b>Fora do corpo</b> · arraste para a pele`;
  }
  function escolhe(i) {
    atual = i; mostraSel();
    $$("li", lista).forEach((li) => li.classList.toggle("ativo", +li.dataset.i === i));
  }
  function poe(f, p) {
    const el = document.createElement("div");
    el.className = "pv-peca";
    el.style.webkitMaskImage = el.style.maskImage = `url(${DIR}${f.id}.webp)`;
    pecasEl.appendChild(el);
    const q = { id: f.id, nome: f.nome, r: f.r, x: p.x, y: p.y, w: wDe(12, f.r), giro: 0, flip: false, cor: "preto", el };
    pecas.push(q); carrega(`${DIR}${f.id}.webp`);
    desenha(q); escolhe(pecas.length - 1); atualizaLista();
    palco.classList.remove("vazio");
  }
  function tira(i) {
    const q = pecas[i]; if (!q) return;
    q.el.remove(); pecas.splice(i, 1);
    escolhe(Math.min(i, pecas.length - 1)); atualizaLista();
    if (!pecas.length) { palco.classList.add("vazio"); dica.hidden = false; }
  }
  function atualizaLista() {
    bPede.disabled = bSalva.disabled = !pecas.length;
    if (!pecas.length) { lista.innerHTML = '<li class="pv-vazio">Nenhum flash no corpo ainda.</li>'; return; }
    lista.innerHTML = pecas.map((q, i) => `<li data-i="${i}" class="${i === atual ? "ativo" : ""}"><i style="--m:url(${DIR}${q.id}-p.webp);background:${CORES[q.cor]}"></i>
      <span>${q.nome}<small>${q.zona || "Fora do corpo"} · ~${cmDe(q)} cm · ${q.cor}</small></span></li>`).join("");
  }
  lista.addEventListener("click", (e) => { const li = e.target.closest("li[data-i]"); if (li) escolhe(+li.dataset.i); });

  /* ---------- ajuste pelo painel ---------- */
  rTam.addEventListener("input", () => { const q = pecas[atual]; if (!q) return; q.w = wDe(+rTam.value, q.r); desenha(q); atualizaLista(); });
  rGiro.addEventListener("input", () => { const q = pecas[atual]; if (!q) return; q.giro = +rGiro.value; desenha(q); });
  $$(".pv-cores button").forEach((b) => b.addEventListener("click", () => { const q = pecas[atual]; if (!q) return; q.cor = b.dataset.cor; desenha(q); atualizaLista(); }));
  $("#b-espelha").addEventListener("click", () => { const q = pecas[atual]; if (!q) return; q.flip = !q.flip; desenha(q); });
  $("#b-apaga").addEventListener("click", () => tira(atual));
  addEventListener("keydown", (e) => {
    const q = pecas[atual]; if (!q || e.target.closest("input")) return;
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); tira(atual); return; }
    const d = e.shiftKey ? 20 : 4, m = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] }[e.key];
    if (m) { e.preventDefault(); q.x += m[0]; q.y += m[1]; desenha(q); atualizaLista(); }
  });

  /* ---------- gaveta: tocar põe no centro da vista; arrastar leva até o ponto ---------- */
  function montaGaveta() {
    gaveta.innerHTML = FL.map((f, i) => `<li><button type="button" data-i="${i}" aria-label="Pôr no corpo: ${f.nome}" title="${f.nome}"><i style="--m:url(${DIR}${f.id}-p.webp)"></i></button></li>`).join("");
    $$("button", gaveta).forEach((b) => {
      const f = FL[+b.dataset.i];
      let ini = null, fant = null;
      b.addEventListener("pointerdown", (e) => {
        if (e.button > 0) return;
        ini = { x: e.clientX, y: e.clientY, id: e.pointerId };
        // o mouse precisa ser capturado já aqui: o próximo movimento pode chegar em cima do palco
        if (e.pointerType === "mouse") try { b.setPointerCapture(e.pointerId); } catch (_) {}
      });
      b.addEventListener("pointermove", (e) => {
        if (!ini || e.pointerId !== ini.id) return;
        const dx = e.clientX - ini.x, dy = e.clientY - ini.y;
        if (!fant) {
          const toque = e.pointerType !== "mouse";
          if (Math.hypot(dx, dy) < 6 || (toque && Math.abs(dy) < Math.abs(dx))) return;
          try { b.setPointerCapture(e.pointerId); } catch (_) {}
          fant =document.createElement("div"); fant.className = "pv-fantasma"; fant.style.setProperty("--m", `url(${DIR}${f.id}-p.webp)`);
          document.body.appendChild(fant); document.body.classList.add("pv-arrasta");
        }
        fant.style.left = e.clientX + "px"; fant.style.top = e.clientY + "px";
        fant.style.transform = `translate(-50%,-50%) scale(${sobrePalco(e.clientX, e.clientY) ? 1.08 : .9})`;
      });
      const fim = (e, cancelou) => {
        if (!ini) return;
        if (fant) {
          if (!cancelou && sobrePalco(e.clientX, e.clientY)) poe(f, noMundo(e.clientX, e.clientY));
          fant.remove(); fant = null; document.body.classList.remove("pv-arrasta");
          b.dataset.arrastou = "1";
        }
        ini = null;
      };
      b.addEventListener("pointerup", (e) => fim(e, false));
      b.addEventListener("pointercancel", (e) => fim(e, true));
      b.addEventListener("click", () => {
        if (b.dataset.arrastou) { delete b.dataset.arrastou; return; }
        poe(f, centroDaVista());
        if (innerWidth <= 980) palco.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    });
  }

  /* ---------- palco: mover, alça de giro e tamanho, pinça com dois dedos, rodinha ---------- */
  const rot = (x, y, g) => { const c = Math.cos(g), s = Math.sin(g); return { x: x * c - y * s, y: x * s + y * c }; };
  function acerta(p) {
    for (let i = pecas.length - 1; i >= 0; i--) {
      const q = pecas[i], l = rot(p.x - q.x, p.y - q.y, -q.giro * Math.PI / 180), folga = 10 / T.z;
      if (Math.abs(l.x) <= q.w / 2 + folga && Math.abs(l.y) <= (q.w * q.r) / 2 + folga) return i;
    }
    return -1;
  }
  function naAlca(p) {
    const q = pecas[atual]; if (!q) return false;
    const c = rot(q.w / 2 + 6 / T.z, -(q.w * q.r) / 2 - 6 / T.z, q.giro * Math.PI / 180);
    return Math.hypot(p.x - (q.x + c.x), p.y - (q.y + c.y)) < 24 / T.z;
  }
  // dedos guarda a posição na tela (relativa ao palco): o mundo anda quando a câmera se mexe
  const dedos = new Map(); let gesto = null;
  const limitaW = (q, w) => Math.min(wDe(50, q.r), Math.max(wDe(3, q.r), w));
  const naTela = (e) => { const r = palco.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const mundoDe = (t) => ({ x: (t.x - T.x) / T.z, y: (t.y - T.y) / T.z });
  function comecaDois() {
    const [a, b] = [...dedos.values()], q = pecas[atual];
    const base = { d0: Math.hypot(b.x - a.x, b.y - a.y), a0: Math.atan2(b.y - a.y, b.x - a.x) };
    // dois dedos em cima da peça escolhida: tamanho e giro; em outro lugar: zoom da câmera
    const ma = mundoDe(a), mb = mundoDe(b), meio = mundoDe({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    if (q && (acerta(ma) === atual || acerta(mb) === atual || acerta(meio) === atual))
      gesto = { tipo: "pinca", q, ...base, w0: q.w, g0: q.giro };
    else gesto = { tipo: "zoom", ...base, m0: cam.m, c0: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
  }
  palco.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".pv-vistas,.pv-zoom")) return;
    const t = naTela(e), p = mundoDe(t);
    dedos.set(e.pointerId, t);
    try { palco.setPointerCapture(e.pointerId); } catch (_) {}
    if (dedos.size === 2) { comecaDois(); return; }
    if (dedos.size > 2) return;
    if (naAlca(p)) {
      const q = pecas[atual];
      gesto = { tipo: "alca", q, d0: Math.hypot(p.x - q.x, p.y - q.y), a0: Math.atan2(p.y - q.y, p.x - q.x), w0: q.w, g0: q.giro };
    } else {
      const i = acerta(p);
      if (i < 0) {   // espaço vazio: solta a peça; com zoom, arrasta a câmera
        escolhe(-1);
        gesto = cam.m > 1.01 ? { tipo: "pan", t0: t, c0: { x: cam.cx, y: cam.cy } } : null;
        if (gesto) palco.classList.add("pega");
        return;
      }
      const q = pecas.splice(i, 1)[0]; pecas.push(q); pecasEl.appendChild(q.el);   // a peça tocada sobe para a frente
      escolhe(pecas.length - 1); atualizaLista();
      gesto = { tipo: "move", q, dx: p.x - q.x, dy: p.y - q.y };
    }
    palco.classList.add("pega");
  });
  palco.addEventListener("pointermove", (e) => {
    const t = naTela(e), p = mundoDe(t);
    if (!dedos.has(e.pointerId)) { palco.classList.toggle("sobre", naAlca(p) || acerta(p) >= 0); return; }
    dedos.set(e.pointerId, t);
    if (!gesto) return;
    if (gesto.tipo === "pan") {
      cam.cx = gesto.c0.x - (t.x - gesto.t0.x) / T.z; cam.cy = gesto.c0.y - (t.y - gesto.t0.y) / T.z; aplica(false); return;
    }
    if (gesto.tipo === "zoom") {
      if (dedos.size < 2) return;
      const [a, b] = [...dedos.values()];
      zoomEm(gesto.m0 * Math.hypot(b.x - a.x, b.y - a.y) / gesto.d0, (a.x + b.x) / 2, (a.y + b.y) / 2, false); return;
    }
    const q = gesto.q;
    if (gesto.tipo === "move") { q.x = p.x - gesto.dx; q.y = p.y - gesto.dy; }
    else if (gesto.tipo === "alca") {
      q.w = limitaW(q, gesto.w0 * Math.hypot(p.x - q.x, p.y - q.y) / gesto.d0);
      q.giro = gesto.g0 + (Math.atan2(p.y - q.y, p.x - q.x) - gesto.a0) * 180 / Math.PI;
    } else if (gesto.tipo === "pinca" && dedos.size >= 2) {
      const [a, b] = [...dedos.values()];
      q.w = limitaW(q, gesto.w0 * Math.hypot(b.x - a.x, b.y - a.y) / gesto.d0);
      q.giro = gesto.g0 + (Math.atan2(b.y - a.y, b.x - a.x) - gesto.a0) * 180 / Math.PI;
    }
    q.giro = ((q.giro + 540) % 360) - 180;
    desenha(q);
  });
  const solta = (e) => {
    if (!dedos.delete(e.pointerId)) return;
    if (dedos.size === 1 && gesto && gesto.tipo === "pinca") {   // sobrou um dedo: continua movendo a peça
      const p = mundoDe([...dedos.values()][0]), q = gesto.q; gesto = { tipo: "move", q, dx: p.x - q.x, dy: p.y - q.y }; return;
    }
    if (dedos.size === 1 && gesto && gesto.tipo === "zoom") {
      gesto = { tipo: "pan", t0: [...dedos.values()][0], c0: { x: cam.cx, y: cam.cy } }; return;
    }
    if (!dedos.size) { gesto = null; palco.classList.remove("pega"); atualizaLista(); }
  };
  palco.addEventListener("pointerup", solta);
  palco.addEventListener("pointercancel", solta);
  palco.addEventListener("wheel", (e) => {
    const t = naTela(e), q = pecas[atual], naPeca = q && acerta(mundoDe(t)) === atual;
    if (!naPeca && e.deltaY > 0 && cam.m <= 1.01) return;   // sem zoom, rolar para baixo continua rolando a página
    e.preventDefault();
    if (naPeca) {   // em cima da peça escolhida: tamanho (Shift: giro)
      if (e.shiftKey) q.giro = (((q.giro + (e.deltaY || e.deltaX) * .15) + 540) % 360) - 180;
      else q.w = limitaW(q, q.w * Math.exp(-e.deltaY * .0015));
      desenha(q); atualizaLista(); return;
    }
    zoomEm(cam.m * Math.exp(-e.deltaY * .0018), t.x, t.y, false);   // fora dela: zoom no ponto do mouse
  }, { passive: false });

  /* ---------- imagem da montagem ---------- */
  async function montagem() {
    const [x0, y0, x1, y1] = regiao(), s = Math.min(1, 1400 / (x1 - x0));
    const W = Math.round((x1 - x0) * s), H = Math.round((y1 - y0) * s), rodape = 64;
    const corpo = await carrega(`${DIR}corpo.webp`);
    const camada = document.createElement("canvas"); camada.width = W; camada.height = H;
    const c = camada.getContext("2d");
    c.drawImage(corpo, x0, y0, x1 - x0, y1 - y0, 0, 0, W, H);
    for (const q of pecas) {
      const m = await carrega(`${DIR}${q.id}.webp`), w = q.w * s, h = q.w * q.r * s;
      const t = document.createElement("canvas"); t.width = Math.max(1, Math.round(w)); t.height = Math.max(1, Math.round(h));
      const tc = t.getContext("2d");
      tc.fillStyle = CORES[q.cor]; tc.fillRect(0, 0, t.width, t.height);
      tc.globalCompositeOperation = "destination-in"; tc.drawImage(m, 0, 0, t.width, t.height);
      c.save(); c.globalCompositeOperation = "multiply"; c.globalAlpha = .9;
      c.translate((q.x - x0) * s, (q.y - y0) * s); c.rotate(q.giro * Math.PI / 180); c.scale(q.flip ? -1 : 1, 1);
      c.drawImage(t, -w / 2, -h / 2, w, h); c.restore();
    }
    c.globalCompositeOperation = "destination-in";
    c.drawImage(corpo, x0, y0, x1 - x0, y1 - y0, 0, 0, W, H);
    const out = document.createElement("canvas"); out.width = W; out.height = H + rodape;
    const o = out.getContext("2d");
    o.fillStyle = "#fbfaf6"; o.fillRect(0, 0, W, H + rodape);
    o.drawImage(camada, 0, 0);
    o.fillStyle = "#0c0c0d"; o.fillRect(0, H, W, rodape);
    o.fillStyle = "#f2efe8"; o.font = "600 20px 'JetBrains Mono', monospace"; o.textBaseline = "middle";
    o.fillText("TAFFA · PROVADOR", 28, H + rodape / 2);
    const cores = ["#f2efe8", "#c1121c", "#1d40d2"]; cores.forEach((k, i) => { o.fillStyle = k; o.fillRect(W - 28 - (3 - i) * 15, H + rodape / 2 - 4.5, 9, 9); });
    return new Promise((ok) => out.toBlob(ok, "image/png"));
  }
  function textoPedido() {
    const l = pecas.map((q, i) => `${i + 1}. ${q.nome}\n   ${q.zona || "local a combinar"} · ~${cmDe(q)} cm · ${q.cor}`);
    return `Oi, Taffa! Montei no provador do site e queria orçar:\n\n${l.join("\n")}\n\nA imagem da montagem vai junto.`;
  }
  function avisa(t) { aviso.textContent = t; aviso.hidden = false; clearTimeout(avisa.t); avisa.t = setTimeout(() => (aviso.hidden = true), 6000); }
  function baixa(blob) {
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "taffa-montagem.png";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  bSalva.addEventListener("click", async () => baixa(await montagem()));
  bPede.addEventListener("click", async () => {
    const blob = await montagem(), texto = textoPedido();
    const arq = new File([blob], "taffa-montagem.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [arq] })) {
      try { await navigator.share({ files: [arq], text: texto }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
    baixa(blob);
    try { await navigator.clipboard.writeText(texto); } catch (e) {}
    window.open(WA, "_blank", "noopener");
    avisa("A imagem foi salva e o pedido copiado. Na conversa com o Taffa, cole o texto e anexe a imagem.");
  });

  /* ---------- início ---------- */
  palco.classList.add("vazio");
  encaixa(false);
  Promise.all([
    fetch(`${DIR}flashes.json`).then((r) => r.json()),
    fetch(`${DIR}zonas.json`).then((r) => r.json()),
    carrega(`${DIR}corpo.webp`),
  ]).then(([fl, zj, corpo]) => {
    FL = fl; montaGaveta();
    for (const v of ["f", "b"]) for (const [k, d] of Object.entries(zj.N.z[v])) zonas.push({ v, k, path: new Path2D(d) });
    const cv = document.createElement("canvas"); cv.width = cv.height = 512;
    const cx = cv.getContext("2d"); cx.drawImage(corpo, 0, 0, 512, 512);
    alfa = cx.getImageData(0, 0, 512, 512).data;
  });
})();
