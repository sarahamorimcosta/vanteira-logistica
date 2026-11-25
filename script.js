/* =========================================================
   Vanteira Logística · script do site
   Ao adaptar para um cliente real, troque as constantes abaixo.
   ========================================================= */
const WHATS = "5500000000000";   // WhatsApp com DDI + DDD, só números (ex.: 5527999999999)
const TRACKING_URL = "";          // link do rastreamento no sistema da transportadora (vazio = mostra aviso)

(function () {
  "use strict";

  const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const limita = (v, a, b) => Math.min(Math.max(v, a), b);

  function linkWhats(msg) {
    return "https://wa.me/" + WHATS + (msg ? "?text=" + encodeURIComponent(msg) : "");
  }

  /* ---------- Aviso rápido ---------- */
  const toast = $(".toast");
  let toastTimer;
  function aviso(texto) {
    if (!toast) return;
    toast.textContent = texto;
    requestAnimationFrame(() => toast.classList.add("ativo"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("ativo"), 6000);
  }

  /* ---------- WhatsApp e rastreamento ---------- */
  $$("[data-whats]").forEach((a) => {
    a.href = linkWhats(a.getAttribute("data-whats"));
    a.target = "_blank";
    a.rel = "noopener";
  });
  $$("[data-rastrear]").forEach((a) => {
    if (TRACKING_URL) {
      a.href = TRACKING_URL;
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        aviso("O rastreamento abre no sistema da transportadora. O link será configurado na publicação do site.");
      });
    }
  });

  /* ---------- Menu ---------- */
  const botaoMenu = $(".menu-botao");
  const menu = $("#menu");
  if (botaoMenu && menu) {
    const fechar = () => {
      menu.classList.remove("aberto");
      botaoMenu.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-aberto");
    };
    botaoMenu.addEventListener("click", () => {
      const abre = !menu.classList.contains("aberto");
      menu.classList.toggle("aberto", abre);
      botaoMenu.setAttribute("aria-expanded", String(abre));
      document.body.classList.toggle("menu-aberto", abre);
    });
    $$("a", menu).forEach((a) => a.addEventListener("click", fechar));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("aberto")) { fechar(); botaoMenu.focus(); }
    });
    window.addEventListener("resize", () => { if (window.innerWidth > 1240) fechar(); });
  }

  /* ---------- Cabeçalho sólido ao rolar ---------- */
  const topo = $(".topo");
  const atualizaTopo = () => topo && topo.classList.toggle("solido", window.scrollY > 40);
  atualizaTopo();

  /* ---------- Aviso de cookies ---------- */
  const avisoCookies = $(".aviso-cookies");
  const CHAVE = "vanteira-aviso-cookies";
  const lerAceite = () => { try { return localStorage.getItem(CHAVE); } catch (e) { return null; } };
  const gravarAceite = () => { try { localStorage.setItem(CHAVE, "ok"); } catch (e) { /* sem armazenamento: só fecha */ } };
  if (avisoCookies) {
    if (!lerAceite()) avisoCookies.hidden = false;
    const ok = $("[data-aceitar-cookies]", avisoCookies);
    if (ok) ok.addEventListener("click", () => { gravarAceite(); avisoCookies.hidden = true; });
    $$("[data-preferencias-cookies]").forEach((b) => b.addEventListener("click", () => {
      avisoCookies.hidden = false;
      if (ok) ok.focus();
    }));
  }


  /* ---------- O dia passa com a rolagem: hora, luz, trilho, HUD ---------- */
  const secoes = $$("[data-hora]");
  const luzes = $$(".luz");
  const tHora = $(".tempo-hora");
  const tCena = $(".tempo-cena");
  const hudBarra = $(".turno-barra i");
  const trilho = $(".trilho");
  const trilhoLinks = trilho ? $$("a", trilho) : [];
  const terreno = $(".terreno");
  let ancoras = [];
  let ultimoTexto = "", ultimaCena = "", ultimoAtivo = -1;

  function medirDia() {
    const vh = window.innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    ancoras = secoes.map((s, i) => {
      const topoDoc = s.getBoundingClientRect().top + window.scrollY;
      return { pos: limita(i === 0 ? 0 : topoDoc - vh * 0.4, 0, max), hora: parseFloat(s.dataset.hora), cena: s.dataset.cena, el: s };
    });
    for (let i = 1; i < ancoras.length; i++) if (ancoras[i].pos <= ancoras[i - 1].pos) ancoras[i].pos = ancoras[i - 1].pos + 1;
    atualizarDia();
  }
  function horaEm(y) {
    if (!ancoras.length) return 5;
    if (y <= ancoras[0].pos) return ancoras[0].hora;
    for (let i = 1; i < ancoras.length; i++) {
      const a = ancoras[i - 1], b = ancoras[i];
      if (y <= b.pos) return a.hora + (b.hora - a.hora) * ((y - a.pos) / (b.pos - a.pos));
    }
    return ancoras[ancoras.length - 1].hora;
  }
  function atualizarDia() {
    if (!ancoras.length) return;
    const y = window.scrollY;
    const h = horaEm(y);
    // luz: cruza as duas camadas vizinhas
    const horas = [5, 7, 10, 13, 16, 18, 20];
    luzes.forEach((l, i) => {
      const hc = horas[i];
      let o = 0;
      if (i > 0 && h >= horas[i - 1] && h <= hc) o = (h - horas[i - 1]) / (hc - horas[i - 1]);
      else if (i < horas.length - 1 && h >= hc && h <= horas[i + 1]) o = 1 - (h - hc) / (horas[i + 1] - hc);
      if ((i === 0 && h <= hc) || (i === horas.length - 1 && h >= hc)) o = 1;
      l.style.opacity = o.toFixed(3);
    });
    const hh = Math.floor(h), mm = Math.floor((h - hh) * 60 / 5) * 5;
    const texto = String(hh).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
    if (tHora && texto !== ultimoTexto) { tHora.textContent = texto; ultimoTexto = texto; }
    let ativo = 0;
    ancoras.forEach((a, i) => { if (y >= a.pos - 2) ativo = i; });
    if (tCena && ancoras[ativo].cena !== ultimaCena) { tCena.textContent = ancoras[ativo].cena; ultimaCena = ancoras[ativo].cena; }
    if (ativo !== ultimoAtivo) {
      trilhoLinks.forEach((a, i) => a.classList.toggle("ativo", i === ativo));
      if (trilho) trilho.classList.toggle("sobre-claro", ancoras[ativo].el.id === "cotacao");
      ultimoAtivo = ativo;
    }
    const prog = limita((h - 5) / 15, 0, 1);
    if (hudBarra) hudBarra.style.transform = "scaleX(" + prog.toFixed(4) + ")";
    if (terreno && !reduz) {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      terreno.style.transform = "translate3d(0," + (-(y / max) * window.innerHeight * 0.5).toFixed(1) + "px,0)";
    }
  }

  let pedido = false;
  window.addEventListener("scroll", () => {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(() => { pedido = false; atualizaTopo(); atualizarDia(); });
  }, { passive: true });

  /* ---------- Relevo topográfico (desenhado uma vez por tamanho de tela) ---------- */
  function desenharTerreno() {
    if (!terreno) return;
    const ctx = terreno.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const W = window.innerWidth, H = Math.round(window.innerHeight * 1.5);
    terreno.width = Math.round(W * dpr); terreno.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    // ruído de valor com semente fixa (o relevo é sempre o mesmo)
    const hash = (x, y) => { let n = x * 374761393 + y * 668265263; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };
    const suave = (t) => t * t * (3 - 2 * t);
    const ruido = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
      const u = suave(xf), v = suave(yf);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
    const fbm = (x, y) => ruido(x, y) * 0.55 + ruido(x * 2.1 + 7, y * 2.1 + 3) * 0.28 + ruido(x * 4.3 + 11, y * 4.3 + 17) * 0.17;
    const passo = W < 700 ? 10 : 9;
    const cols = Math.ceil(W / passo) + 1, lins = Math.ceil(H / passo) + 1;
    const esc = 1 / 260;
    const v = new Float32Array(cols * lins);
    for (let j = 0; j < lins; j++) for (let i = 0; i < cols; i++) v[j * cols + i] = fbm(i * passo * esc, j * passo * esc);
    const niveis = 16;
    for (let n = 1; n < niveis; n++) {
      const t = n / niveis;
      ctx.beginPath();
      for (let j = 0; j < lins - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const a = v[j * cols + i], b = v[j * cols + i + 1], c = v[(j + 1) * cols + i + 1], d = v[(j + 1) * cols + i];
          const caso = (a > t ? 8 : 0) | (b > t ? 4 : 0) | (c > t ? 2 : 0) | (d > t ? 1 : 0);
          if (caso === 0 || caso === 15) continue;
          const x = i * passo, y = j * passo;
          const lerp = (p, q) => (t - p) / (q - p);
          const top = [x + passo * lerp(a, b), y], dir = [x + passo, y + passo * lerp(b, c)];
          const bai = [x + passo * lerp(d, c), y + passo], esq = [x, y + passo * lerp(a, d)];
          const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
          switch (caso) {
            case 1: case 14: seg(esq, bai); break;
            case 2: case 13: seg(bai, dir); break;
            case 3: case 12: seg(esq, dir); break;
            case 4: case 11: seg(top, dir); break;
            case 6: case 9: seg(top, bai); break;
            case 7: case 8: seg(esq, top); break;
            case 5: seg(esq, top); seg(bai, dir); break;
            case 10: seg(top, dir); seg(esq, bai); break;
          }
        }
      }
      ctx.strokeStyle = n % 4 === 0 ? "rgba(236,231,222,.075)" : "rgba(236,231,222,.035)";
      ctx.lineWidth = n % 4 === 0 ? 1 : 0.8;
      ctx.stroke();
    }
  }

  /* ---------- Lanterna que segue o cursor ---------- */
  const lanterna = $(".lanterna");
  if (lanterna && !reduz && window.matchMedia("(pointer: fine)").matches) {
    let lx = 0, ly = 0, ax = 0, ay = 0, rodando = false;
    const passoL = () => {
      ax += (lx - ax) * 0.12; ay += (ly - ay) * 0.12;
      lanterna.style.transform = "translate3d(" + ax.toFixed(1) + "px," + ay.toFixed(1) + "px,0)";
      if (Math.abs(lx - ax) > 0.5 || Math.abs(ly - ay) > 0.5) requestAnimationFrame(passoL); else rodando = false;
    };
    window.addEventListener("pointermove", (e) => {
      lx = e.clientX; ly = e.clientY;
      lanterna.classList.add("ativa");
      if (!rodando) { rodando = true; requestAnimationFrame(passoL); }
    }, { passive: true });
    document.addEventListener("pointerleave", () => lanterna.classList.remove("ativa"));
  }

  /* ---------- Surgimento ao rolar ---------- */
  const revelaveis = $$("[data-surge], [data-revela]");
  if ("IntersectionObserver" in window && !reduz) {
    const io = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("visivel"); io.unobserve(en.target); } });
    }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
    revelaveis.forEach((el) => io.observe(el));
  } else {
    revelaveis.forEach((el) => el.classList.add("visivel"));
  }

  /* ---------- Cenas com GSAP + ScrollTrigger ---------- */
  const cabe = (el) => el.offsetHeight <= window.innerHeight + 2;

  function cenaHeroi() {
    const heroi = $(".heroi");
    if (!heroi) return;
    gsap.timeline({ scrollTrigger: { trigger: heroi, start: "top top", end: "bottom top", scrub: true } })
      .to(".heroi-conteudo", { yPercent: -18, autoAlpha: 0.15, ease: "none" }, 0)
      .to(".heroi-dados", { yPercent: 60, ease: "none" }, 0)
      .fromTo(".plano", { rotationX: 78 }, { rotationX: 84, ease: "none" }, 0);
  }

  function cenaDocas(grande) {
    const sec = $(".servicos");
    const trilhoDocas = $(".docas-trilho");
    if (!sec || !trilhoDocas) return;
    if (!grande) return;
    sec.classList.add("horizontal");
    $$(".doca", sec).forEach((d) => d.classList.add("visivel"));
    const num = $(".docas-progresso b", sec);
    const barra = $(".docas-progresso > i > i", sec);
    const distancia = () => Math.max(0, trilhoDocas.scrollWidth - (window.innerWidth - parseFloat(getComputedStyle($(".servicos-fixo", sec)).paddingLeft)) + 48);
    const docas = $$(".doca", sec);
    gsap.to(trilhoDocas, {
      x: () => -distancia(),
      ease: "none",
      scrollTrigger: {
        trigger: sec, start: "top top", end: () => "+=" + distancia(), pin: true, scrub: 0.6, invalidateOnRefresh: true,
        onUpdate: (st) => {
          const i = Math.min(docas.length - 1, Math.round(st.progress * (docas.length - 1)));
          if (num) num.textContent = String(i + 1).padStart(2, "0");
          if (barra) barra.style.transform = "scaleX(" + (0.25 + st.progress * 0.75).toFixed(3) + ")";
        }
      }
    });
    return () => sec.classList.remove("horizontal");
  }

  function cenaFrota(grande) {
    const sec = $(".frota");
    if (!sec || !grande) return;
    sec.classList.add("palco");
    if (!cabe(sec)) { sec.classList.remove("palco"); return; }
    const veiculos = $$(".veiculo", sec);
    const faixas = $$(".faixa", sec);
    veiculos.forEach((v) => v.classList.add("visivel"));
    gsap.set(veiculos, { autoAlpha: 0 });
    gsap.set(veiculos[0], { autoAlpha: 1 });
    faixas[0] && faixas[0].classList.add("ativa");
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: sec, start: "top top", end: "+=" + Math.round(window.innerHeight * 1.8), pin: true, scrub: 0.6,
        onUpdate: (st) => {
          const i = Math.min(2, Math.floor(st.progress * 3 * 0.999));
          faixas.forEach((f, k) => f.classList.toggle("ativa", k === i));
        }
      }
    });
    tl.fromTo($(".veiculo-perfil", veiculos[0]), { xPercent: 0 }, { xPercent: -4, duration: 1, ease: "none" }, 0);
    for (let i = 1; i < veiculos.length; i++) {
      const t = i * 1.2 - 0.3;
      tl.to(veiculos[i - 1], { autoAlpha: 0, duration: 0.3 }, t)
        .to($(".veiculo-perfil", veiculos[i - 1]), { xPercent: -30, duration: 0.5, ease: "power1.in" }, t - 0.1)
        .fromTo(veiculos[i], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, t + 0.15)
        .fromTo($(".veiculo-perfil", veiculos[i]), { xPercent: 30 }, { xPercent: 0, duration: 0.6, ease: "power2.out" }, t + 0.1);
    }
    tl.to({}, { duration: 0.4 });
    return () => { sec.classList.remove("palco"); gsap.set(veiculos, { clearProps: "all" }); };
  }

  function viajantes() {
    $$(".rota").forEach((g) => {
      const caminhos = $$(".rota-traco", g);
      $$(".viajante", g).forEach((c, k) => {
        const p = caminhos[k % caminhos.length];
        gsap.to(c, { duration: 5.5 + k * 1.3, repeat: -1, ease: "none", delay: k * 1.7, motionPath: { path: p, align: p, alignOrigin: [0.5, 0.5] } });
      });
    });
  }

  function cenaRotas(grande) {
    const sec = $(".rotas");
    if (!sec || !grande) return;
    sec.classList.add("guiado");
    if (!cabe(sec)) { sec.classList.remove("guiado"); return; }
    const rotas = $$(".rota", sec);
    const itens = $$(".rota-item", sec);
    itens.forEach((it) => it.classList.add("visivel"));
    const ativar = (i) => {
      rotas.forEach((r, k) => r.classList.toggle("ativa", k <= i));
      itens.forEach((it, k) => it.classList.toggle("ativa", k === i));
    };
    ativar(0);
    ScrollTrigger.create({
      trigger: sec, start: "top top", end: "+=" + Math.round(window.innerHeight * 1.6), pin: true,
      onUpdate: (st) => ativar(Math.min(3, Math.floor(st.progress * 4 * 0.999)))
    });
    return () => sec.classList.remove("guiado");
  }

  function iniciarCenas() {
    if (reduz || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    if (window.MotionPathPlugin) { gsap.registerPlugin(MotionPathPlugin); viajantes(); }
    cenaHeroi();
    const mm = gsap.matchMedia();
    mm.add({ grande: "(min-width: 1200px) and (min-height: 760px)", pequeno: "(max-width: 1199px), (max-height: 759px)" }, (ctx) => {
      const g = ctx.conditions.grande;
      const limpa = [cenaDocas(g), cenaFrota(g), cenaRotas(g)];
      ScrollTrigger.refresh();
      medirDia();
      return () => limpa.forEach((f) => f && f());
    });
    ScrollTrigger.addEventListener("refresh", medirDia);
  }

  let timerTela;
  window.addEventListener("resize", () => {
    clearTimeout(timerTela);
    timerTela = setTimeout(() => { desenharTerreno(); medirDia(); }, 200);
  });
  window.addEventListener("load", medirDia);
  desenharTerreno();
  medirDia();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (window.ScrollTrigger) ScrollTrigger.refresh(); medirDia(); });
  iniciarCenas();

  /* ---------- Formulário de cotação ---------- */
  const form = $("#form-cotacao");
  if (form) {
    const servicoUrl = new URLSearchParams(window.location.search).get("servico");
    const selServico = $("#f-servico");
    if (servicoUrl && selServico && $$("option", selServico).some((o) => o.value === servicoUrl)) selServico.value = servicoUrl;

    const numeroPeso = (v) => {
      const t = v.trim().replace(/\s/g, "");
      if (!/^\d[\d.,]*$/.test(t)) return NaN;
      if (t.includes(",")) return parseFloat(t.replace(/\./g, "").replace(",", "."));
      if (/^\d{1,3}(\.\d{3})+$/.test(t)) return parseFloat(t.replace(/\./g, ""));
      return parseFloat(t);
    };
    const regras = [
      { id: "f-nome", erro: "e-nome", msg: "Informe seu nome.", ok: (v) => v.trim().length >= 2 },
      { id: "f-empresa", erro: "e-empresa", msg: "Informe a empresa (ou “pessoa física”).", ok: (v) => v.trim().length >= 2 },
      { id: "f-origem", erro: "e-origem", msg: "Informe a cidade da coleta.", ok: (v) => v.trim().length >= 2 },
      { id: "f-destino", erro: "e-destino", msg: "Informe a cidade da entrega.", ok: (v) => v.trim().length >= 2 },
      { id: "f-tipo", erro: "e-tipo", msg: "Escolha o tipo de carga.", ok: (v) => v !== "" },
      { id: "f-peso", erro: "e-peso", msg: "Informe o peso em números, ex.: 1.200.", ok: (v) => numeroPeso(v) > 0 }
    ];
    const status = $(".form-status", form);

    function validar(regra) {
      const campo = document.getElementById(regra.id);
      const erro = document.getElementById(regra.erro);
      const valido = regra.ok(campo.value);
      campo.setAttribute("aria-invalid", valido ? "false" : "true");
      erro.textContent = valido ? "" : regra.msg;
      erro.hidden = valido;
      return valido;
    }
    regras.forEach((r) => {
      const campo = document.getElementById(r.id);
      const reavalia = () => { if (campo.getAttribute("aria-invalid") === "true") validar(r); };
      campo.addEventListener("input", reavalia);
      campo.addEventListener("change", reavalia);
      campo.addEventListener("blur", () => { if (campo.value.trim() !== "") validar(r); });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const invalidas = regras.filter((r) => !validar(r));
      if (invalidas.length) {
        status.className = "form-status erro-geral";
        status.textContent = invalidas.length === 1 ? "Falta 1 campo obrigatório." : "Faltam " + invalidas.length + " campos obrigatórios.";
        document.getElementById(invalidas[0].id).focus();
        return;
      }
      const v = (id) => document.getElementById(id).value.trim();
      const servicoTexto = selServico && selServico.value ? selServico.options[selServico.selectedIndex].text : "A definir";
      const linhas = [
        "*Pedido de cotação · site Vanteira*",
        "Nome: " + v("f-nome"),
        "Empresa: " + v("f-empresa"),
        "Origem: " + v("f-origem"),
        "Destino: " + v("f-destino"),
        "Tipo de carga: " + v("f-tipo"),
        "Peso aproximado: " + v("f-peso") + " " + v("f-unidade"),
        "Serviço: " + servicoTexto
      ];
      if (v("f-obs")) linhas.push("Observações: " + v("f-obs"));
      const url = linkWhats(linhas.join("\n"));
      const janela = window.open(url, "_blank");
      if (janela) { try { janela.opener = null; } catch (err) { /* ok */ } }
      status.className = "form-status ok";
      status.innerHTML = "";
      status.append("Pronto! Abrimos o WhatsApp com a sua mensagem. ");
      const link = document.createElement("a");
      link.href = url; link.target = "_blank"; link.rel = "noopener";
      link.textContent = "Não abriu? Toque aqui.";
      status.append(link);
    });
  }
})();
