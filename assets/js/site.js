(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const ZAP = 'https://wa.me/message/C4M2BNL5XI5LP1';
  const calmo = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* nav sólida ao rolar + barra do WhatsApp no celular */
  const nav = $('.nav'), barra = $('.barra-zap'), hero = $('.hero');
  const rolou = () => {
    nav.classList.toggle('solida', scrollY > 20);
    barra.classList.toggle('on', scrollY > hero.offsetHeight * .7);
  };
  addEventListener('scroll', rolou, { passive: true }); rolou();

  /* link ativo */
  const links = $$('.nav-links a');
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('ativo', a.hash === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach(a => { const s = $(a.hash); s && io.observe(s); });

  /* menu */
  const bm = $('.nav-menu'), menu = $('#menu');
  const abreMenu = on => {
    bm.setAttribute('aria-expanded', on); menu.hidden = !on;
    document.body.style.overflow = on ? 'hidden' : '';
  };
  bm.addEventListener('click', () => abreMenu(menu.hidden));
  $$('a', menu).forEach(a => a.addEventListener('click', () => abreMenu(false)));

  /* fundo: suminagashi espelhado, ao vivo no desktop (WebGL) e MP4 em loop no toque */
  const fundo = $('.hero-fundo'), cv = $('.fundo-gl', fundo), hv = $('.fundo-vid', fundo);
  const toque = matchMedia('(hover: none), (pointer: coarse), (max-width: 760px)').matches;
  const tocaVideo = (v, src) => {
    if (calmo) return;
    v.src = src;
    v.addEventListener('playing', () => v.classList.add('on'), { once: true });
    new IntersectionObserver(([e]) => e.isIntersecting ? v.play().catch(() => {}) : v.pause()).observe(v.parentElement);
  };
  /* eixo do espelho: no centro da foto do hero */
  const eixo = () => { const f = $('.hero-foto').getBoundingClientRect(); return Math.min(.85, Math.max(.5, (f.left + f.width / 2) / innerWidth)); };
  const vivo = () => {
    let T;
    try { T = sumiGL(cv); } catch (e) { T = null; }
    if (!T) return;
    /* resolução real da tela (até 2x); se o quadro passar de ~22 ms em média, baixa em degraus */
    const CICLO = 40000;
    let esc = Math.min(devicePixelRatio || 1, 2), ex = eixo();
    const ajusta = () => { T.tamanho(Math.round(fundo.clientWidth * esc), Math.round(fundo.clientHeight * esc)); ex = eixo(); };
    ajusta(); addEventListener('resize', ajusta);
    let ve = true, ult = 0, soma = 0, n = 0, t0 = performance.now();
    new IntersectionObserver(([e]) => { ve = e.isIntersecting; ult = 0; }).observe(fundo);
    const quadro = t => {
      requestAnimationFrame(quadro);
      if (!ve || document.hidden) { ult = 0; return; }
      if (ult) { soma += t - ult; n++; }
      ult = t;
      if (n === 40) {
        if (soma / n > 22 && esc > .6) { esc = Math.max(.6, esc * .8); ajusta(); }
        soma = 0; n = 0;
      }
      T.desenhar(((t - t0) % CICLO) / CICLO * 6.283185307179586, ex);
      cv.classList.add('on');
    };
    if (calmo) { T.desenhar(0, ex); cv.classList.add('on'); } else requestAnimationFrame(quadro);
  };
  if (toque) tocaVideo(hv, innerWidth > innerHeight ? 'assets/video/sumi-deitado.mp4' : 'assets/video/sumi-celular.mp4');
  else vivo();
  $$('.fim-fundo .fundo-vid').forEach(v => tocaVideo(v, v.dataset.src));

  /* hero: fotos passam sozinhas */
  const fotos = $$('.hero-quadro img'), tit = $('.hero-tit'), cont = $('.hero-cont b'), bar = $('.hero-barra i');
  const nomes = ['Braço em ornamento', 'Louva-a-deus em vermelho', 'Peito simétrico', 'Coluna em azul', 'Dragões no peito'];
  let hi = 0;
  const corre = () => { bar.classList.remove('corre'); void bar.offsetWidth; bar.classList.add('corre'); };
  const troca = () => {
    fotos[hi].classList.remove('on');
    hi = (hi + 1) % fotos.length;
    fotos[hi].classList.add('on');
    tit.textContent = nomes[hi]; cont.textContent = hi + 1;
    corre();
  };
  if (!calmo) { corre(); setInterval(() => { if (!document.hidden) troca(); }, 6000); }

  /* galeria (portfólio e disponíveis) */
  const gal = $('#galeria'), gimg = $('.gal-fig img', gal), gtit = $('.gal-tit', gal), gcont = $('.gal-cont', gal), gig = $('.gal-ig', gal), gquero = $('.gal-quero', gal);
  let lista = null, gi = 0, volta = null;
  const mostra = () => {
    const f = lista.fotos[gi];
    gimg.src = f.src; gimg.alt = f.alt;
    gtit.textContent = lista.porFoto ? lista.porFoto(gi) : lista.titulo;
    gcont.textContent = lista.fotos.length > 1 ? `${gi + 1} de ${lista.fotos.length}` : '';
    $$('.gal-seta', gal).forEach(b => b.hidden = lista.fotos.length < 2);
  };
  const abre = (l, el) => {
    lista = l; gi = l.ini || 0; volta = el; mostra();
    gig.hidden = !l.ig; if (l.ig) gig.href = `https://www.instagram.com/p/${l.ig}/`;
    gquero.hidden = !l.quero; gal.classList.toggle('flash-on', !!l.quero);
    gal.hidden = false; document.body.style.overflow = 'hidden'; $('.gal-fechar').focus();
  };
  const fecha = () => { gal.hidden = true; document.body.style.overflow = ''; volta && volta.focus({ preventScroll: true }); };
  const passa = d => { gi = (gi + d + lista.fotos.length) % lista.fotos.length; mostra(); };
  $('.gal-fechar').addEventListener('click', fecha);
  $('.gal-ant').addEventListener('click', () => passa(-1));
  $('.gal-prox').addEventListener('click', () => passa(1));
  gal.addEventListener('click', e => { if (e.target === gal) fecha(); });
  addEventListener('keydown', e => {
    if (gal.hidden) return;
    if (e.key === 'Escape') fecha();
    if (e.key === 'ArrowLeft') passa(-1);
    if (e.key === 'ArrowRight') passa(1);
  });
  let tx = null;
  gal.addEventListener('touchstart', e => tx = e.touches[0].clientX, { passive: true });
  gal.addEventListener('touchend', e => {
    if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; tx = null;
    if (Math.abs(dx) > 40 && lista.fotos.length > 1) passa(dx < 0 ? 1 : -1);
  });

  /* portfólio */
  const grade = $('#grade'), mais = $('#mais');
  let obras = [], filtro = 'todos', limite = 16;
  const visiveis = () => obras.filter(o => filtro === 'todos' || o.cat === filtro);
  const desenha = () => {
    const l = visiveis();
    grade.innerHTML = l.slice(0, limite).map((o, i) => `
      <li style="animation-delay:${(i % 16) * 30}ms"><button data-id="${o.id}" aria-label="Ver fotos: ${o.titulo}">
        <div class="obra-img"><img src="assets/img/obras/${o.id}.webp" alt="${o.titulo}" loading="lazy" width="720" height="900">${o.fotos.length > 1 ? `<span class="qtd">${o.fotos.length} fotos</span>` : ''}</div>
        <p class="obra-leg"><span class="${o.cat === 'cor' ? 'c-cor' : ''}">${o.id}</span>${o.titulo}</p>
      </button></li>`).join('');
    mais.parentElement.hidden = l.length <= limite;
  };
  $$('#portfolio .filtros button').forEach(b => b.addEventListener('click', () => {
    filtro = b.dataset.f; limite = 16;
    $$('#portfolio .filtros button').forEach(x => x.setAttribute('aria-selected', x === b));
    desenha();
  }));
  mais.addEventListener('click', () => { limite += 16; desenha(); });
  fetch('assets/obras.json').then(r => r.json()).then(d => { obras = d; desenha(); });
  grade.addEventListener('click', e => {
    const b = e.target.closest('button[data-id]'); if (!b) return;
    const o = obras.find(x => x.id === b.dataset.id);
    abre({ titulo: o.titulo, ig: o.ig, fotos: o.fotos.map(f => ({ src: `assets/img/obras/${f}.webp`, alt: o.titulo })) }, b);
  });

  /* disponíveis: as folhas da pasta do Pinterest, por série */
  const fl = $('#flash'), fmais = $('#flash-mais'), series = $('#series');
  let flashes = [], serie = 'todos', flim = 12;
  const fvis = () => flashes.filter(f => serie === 'todos' || f.serie === serie);
  const fdesenha = () => {
    const l = fvis();
    fl.innerHTML = l.slice(0, flim).map((f, i) => `
      <li style="animation-delay:${(i % 12) * 30}ms"><button data-f="${f.id}" aria-label="Ver desenho ${f.id}, ${f.nome}">
        <div class="f-img"><img src="assets/img/flash/${f.id}.webp" alt="Flash: ${f.nome}" loading="lazy" width="600" height="900"></div>
        <span class="f-num">${f.id}</span><span class="f-nome">${f.nome}</span>
      </button></li>`).join('');
    fmais.parentElement.hidden = l.length <= flim;
  };
  fetch('assets/disponiveis.json').then(r => r.json()).then(d => {
    flashes = d.flash;
    series.insertAdjacentHTML('beforeend', Object.entries(d.series).map(([k, v]) =>
      `<button role="tab" aria-selected="false" data-s="${k}">${v}<small>${flashes.filter(f => f.serie === k).length}</small></button>`).join(''));
    $('button', series).insertAdjacentHTML('beforeend', `<small>${flashes.length}</small>`);
    $$('button', series).forEach(b => b.addEventListener('click', () => {
      serie = b.dataset.s; flim = 12;
      $$('button', series).forEach(x => x.setAttribute('aria-selected', x === b));
      fdesenha();
    }));
    fdesenha();
  });
  fmais.addEventListener('click', () => { flim += 12; fdesenha(); });
  fl.addEventListener('click', e => {
    const b = e.target.closest('button[data-f]'); if (!b) return;
    const l = fvis(), i = l.findIndex(f => f.id === b.dataset.f);
    abre({ quero: true, ini: i, fotos: l.map(f => ({ src: `assets/img/flash/${f.id}-g.webp`, alt: `Flash: ${f.nome}`, f })),
      porFoto: k => `Desenho ${l[k].id} · ${l[k].nome}` }, b);
  });
  /* "quero este": fecha a galeria e já deixa a mensagem encaminhada */
  gquero.addEventListener('click', () => {
    const f = lista.fotos[gi].f;
    fecha();
    form.tipo.value = 'Um desenho disponível';
    form.ideia.value = `Desenho ${f.id}, ${f.nome}`;
    form.cidade.selectedIndex = 0;
    $('#msg').scrollIntoView({ behavior: calmo ? 'auto' : 'smooth', block: 'start' });
    form.classList.remove('marcado'); void form.offsetWidth; form.classList.add('marcado');
    setTimeout(() => form.nome.focus({ preventScroll: true }), 700);
  });

  /* agenda: os botões já escolhem a cidade no formulário */
  const form = $('#msg');
  $$('.agenda-btns a').forEach(a => a.addEventListener('click', () => {
    form.cidade.selectedIndex = a.dataset.cidade === 'lista' ? 1 : 0;
  }));

  /* monte sua mensagem: organiza o texto, copia e abre o WhatsApp */
  const aviso = $('.msg-aviso', form), saida = $('.msg-texto', form);
  const copia = async t => {
    try { await navigator.clipboard.writeText(t); return true; } catch (e) {
      const ta = document.createElement('textarea'); ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {} ta.remove(); return ok;
    }
  };
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const nome = form.nome.closest('.campo');
    if (!d.nome.trim()) { nome.classList.add('erro'); aviso.className = 'msg-aviso erro'; aviso.textContent = 'Coloca seu nome pra eu saber com quem falo.'; form.nome.focus(); return; }
    nome.classList.remove('erro');
    const dados = [
      `Nome: ${d.nome.trim()}`,
      d.pronomes && `Pronomes: ${d.pronomes.trim()}`,
      `Cidade: ${d.cidade}`,
      `Tipo: ${d.tipo}`,
      `Tinta: ${d.cor}`,
      d.local && `Lugar do corpo: ${d.local.trim()}`,
      d.tamanho && `Tamanho: ${d.tamanho.trim()} cm`,
      d.dias && `Disponibilidade: ${d.dias.trim()}`,
      d.ideia && `Ideia: ${d.ideia.trim()}`
    ].filter(Boolean);
    const lista = /lista de espera/.test(d.cidade);
    const texto = [lista ? 'Oi, Taffa! Vim pelo site e quero entrar na lista de espera.' : 'Oi, Taffa! Vim pelo site e quero um orçamento.', '', ...dados].join('\n');
    const ok = await copia(texto);
    saida.textContent = texto; saida.hidden = false;
    aviso.className = 'msg-aviso ' + (ok ? 'ok' : '');
    aviso.textContent = ok ? 'Mensagem copiada. No WhatsApp, é só colar e mandar as referências.' : 'Não deu pra copiar sozinho. Copia o texto abaixo e cola no WhatsApp.';
    window.open(ZAP, '_blank', 'noopener');
  });
  form.nome.addEventListener('input', () => form.nome.closest('.campo').classList.remove('erro'));
})();
