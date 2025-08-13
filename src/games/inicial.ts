// src/games/inicial.ts
// Cinta transportadora — UI (Correctas/Vidas/Teclas) y Avisos FUERA de la cinta (en el marco celeste)
// Chips con ancho adaptativo y meta: 20 aciertos o 3 vidas perdidas

type Category = "organicos" | "reciclables" | "peligrosos";
type Item = { emoji: string; label: string; cat: Category };
type Bin  = { cat: Category; color: string; label: string };

const ITEMS: Item[] = [
  // ORGÁNICOS (+ muchos)
  { emoji: "🍎", label: "Restos de comida",        cat: "organicos" },
  { emoji: "🍌", label: "Cáscara de plátano",      cat: "organicos" },
  { emoji: "🥖", label: "Pan duro",                cat: "organicos" },
  { emoji: "🥚", label: "Cáscaras de huevo",       cat: "organicos" },
  { emoji: "🍂", label: "Hojas y podas",           cat: "organicos" },
  { emoji: "🥕", label: "Restos de verduras",      cat: "organicos" },
  { emoji: "🍊", label: "Cáscaras de naranja",     cat: "organicos" },
  { emoji: "🍵", label: "Bolsitas de té",          cat: "organicos" },
  { emoji: "☕️", label: "Posos de café",          cat: "organicos" },
  { emoji: "🥔", label: "Cáscara de papa",         cat: "organicos" },
  { emoji: "🍏", label: "Cáscara de manzana",      cat: "organicos" },
  { emoji: "🍖", label: "Huesos (restos)",         cat: "organicos" },

  // RECICLABLES (+ muchos)
  { emoji: "🧴", label: "Plástico (botella)",      cat: "reciclables" },
  { emoji: "📄", label: "Hoja de papel",           cat: "reciclables" },
  { emoji: "📰", label: "Papel (periódico)",       cat: "reciclables" },
  { emoji: "📦", label: "Cartón",                  cat: "reciclables" },
  { emoji: "🍾", label: "Vidrio (botella)",        cat: "reciclables" },
  { emoji: "🥫", label: "Lata metálica",           cat: "reciclables" },
  { emoji: "🧃", label: "Caja de jugo (Tetra Pak)",cat: "reciclables" },
  { emoji: "🥤", label: "Vaso/plástico rígido",    cat: "reciclables" },
  { emoji: "🧢", label: "Tapa plástica",           cat: "reciclables" },
  { emoji: "📚", label: "Revista/cuaderno",        cat: "reciclables" },
  { emoji: "🥛", label: "Envase de yogur",         cat: "reciclables" },
  { emoji: "🍶", label: "Frasco de vidrio",        cat: "reciclables" },

  // PELIGROSOS (+ muchos)
  { emoji: "🔋", label: "Pilas",                   cat: "peligrosos" },
  { emoji: "💊", label: "Medicamentos vencidos",   cat: "peligrosos" },
  { emoji: "💉", label: "Agujas/jeringas",         cat: "peligrosos" },
  { emoji: "🧪", label: "Químicos/lejía",          cat: "peligrosos" },
  { emoji: "🌡️", label: "Termómetro de mercurio", cat: "peligrosos" },
  { emoji: "🛢️", label: "Aceite de motor",        cat: "peligrosos" },
  { emoji: "💡", label: "Foco fluorescente",       cat: "peligrosos" },
  { emoji: "🧯", label: "Extintor viejo",          cat: "peligrosos" },
  { emoji: "🖨️", label: "Cartucho de tóner",      cat: "peligrosos" },
  { emoji: "📱", label: "Residuos electrónicos",   cat: "peligrosos" },
  { emoji: "🧴", label: "Aerosol (pintura)",       cat: "peligrosos" },
  { emoji: "🧫", label: "Reactivos/lab",           cat: "peligrosos" },
];


const BINS: Record<Category, Bin> = {
  organicos:   { cat: "organicos",   color: "#111827", label: "Orgánicos"   },
  reciclables: { cat: "reciclables", color: "#3b82f6", label: "Reciclables" },
  peligrosos:  { cat: "peligrosos",  color: "#ef4444", label: "Peligrosos"  },
};

// Dimensiones base
const W = 800, H = 520;
const BELT = { x: 70, y: 180, w: 660, h: 90 };   // banda negra
const BINS_Y = 430;
const BINS_X = [160, 400, 640];

// Meta
const TARGET_SCORE = 20;

// Alturas para el marco celeste (UI + Aviso por encima de la cinta)
const UI_H = 30;         // alto de la línea de Correctas/Vidas/Teclas
const NOTICE_H = 32;     // alto del aviso Correcto/Incorrecto
const PAD_TOP = 8;       // margen superior interno del marco celeste
const PAD_BOTTOM = 16;   // margen inferior (bajo la cinta)
const GAP = 6;           // separación entre UI y Aviso

// Cálculo del marco celeste para que UI + Aviso queden FUERA de la cinta (arriba de la banda)
const CEL_X = BELT.x - 10;
const CEL_W = BELT.w + 20;
const CEL_Y = BELT.y - (UI_H + NOTICE_H + GAP + PAD_TOP);
const CEL_H = UI_H + NOTICE_H + GAP + PAD_TOP + BELT.h + PAD_BOTTOM;

// Utils
function shuffle<T>(a: T[]) { return [...a].sort(() => Math.random() - 0.5); }
function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }
function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, unknown>={}, children: (Node|string)[]=[]){
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") (node as HTMLElement).className = String(v);
    else if (k === "style" && v && typeof v === "object") Object.assign((node as HTMLElement).style, v as any);
    else if (k.startsWith("on") && typeof v === "function") (node as any)[k.toLowerCase()] = v;
    else node.setAttribute(k, String(v));
  }
  for (const c of children) node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  return node;
}
function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, unknown>={}) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k, v] of Object.entries(attrs)) (node as Element).setAttribute(k, String(v));
  return node as SVGElementTagNameMap[K];
}
function svgPointFromEvent(svg: SVGSVGElement, evt: PointerEvent|MouseEvent) {
  const pt = (svg as any).createSVGPoint();
  pt.x = (evt as PointerEvent).clientX; pt.y = (evt as PointerEvent).clientY;
  const ctm = svg.getScreenCTM(); if (!ctm) return {x:0,y:0};
  const p = pt.matrixTransform(ctm.inverse()); return { x: p.x as number, y: p.y as number };
}

// --------- Juego ---------
export default function start(root: HTMLElement) {
  try {
    root.replaceChildren();
    const wrap = el("div", { class: "w-full max-w-5xl bg-white rounded-2xl shadow p-4 sm:p-6 relative overflow-hidden" });
    root.appendChild(wrap);

    // Título
    wrap.append(
      el("h3", { class:"text-xl sm:text-2xl font-bold text-slate-800 text-center mb-1" }, ["Cinta transportadora: ¡clasifica la basura!"]),
      el("p",  { class:"text-slate-600 text-center mb-3" }, [
        "Arrastra cada elemento al tacho correcto o usa las teclas ",
        el("b", {}, ["1-2-3"]),
        ". No dejes que se salga de la cinta."
      ]),
    );

    // SVG base
    const svg = svgEl("svg", { viewBox: `0 0 ${W} ${H}`, class:"w-full h-[460px] sm:h-[500px] block touch-none" }) as unknown as SVGSVGElement;
    svg.appendChild(svgEl("rect", { x:0, y:0, width:W, height:H, fill:"#F1F5F9" }));
    wrap.appendChild(svg);

    // Capas
    const beltGroup = svgEl("g");
    const itemsGroup = svgEl("g");
    const binsGroup  = svgEl("g");
    svg.append(beltGroup, itemsGroup, binsGroup);

    // ----- Marco celeste + banda -----
    // Marco celeste con altura extendida arriba para alojar UI + Aviso
    beltGroup.appendChild(svgEl("rect", {
      x: CEL_X, y: CEL_Y, width: CEL_W, height: CEL_H, rx: 20, fill:"#CBD5E1"
    }));
    // Cinta (banda negra) — permanece en BELT.y
    const beltRect = svgEl("rect", {
      x: BELT.x, y: BELT.y, width: BELT.w, height: BELT.h, rx: 18, fill:"#1F2937", stroke:"#111827", "stroke-width":2
    });
    beltGroup.appendChild(beltRect);

    // ---- UI (Correctas/Vidas/Teclas) FUERA de la cinta, en el marco celeste (arriba) ----
    const uiFO = svgEl("foreignObject", {
      x: String(CEL_X + 8),
      y: String(CEL_Y + 6),           // arriba, dentro del celeste
      width: String(CEL_W - 16),
      height: String(UI_H),
      "pointer-events": "none",
    }) as unknown as SVGForeignObjectElement;
    const uiHost = document.createElement("div");
    uiHost.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    Object.assign(uiHost.style, {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "12px",
      width: "100%",
      height: "100%",
      fontSize: "12px",
    } as CSSStyleDeclaration);
    const scoreEl = el("div", { class:"px-3 py-1 rounded-xl bg-white/90 text-slate-900 shadow" }, [`Correctas: 0 / ${TARGET_SCORE}`]);
    const livesEl = el("div", { class:"px-3 py-1 rounded-xl bg-white/90 text-slate-900 shadow" }, ["Vidas: ❤️❤️❤️"]);
    const keysEl  = el("div", { class:"px-3 py-1 rounded-xl bg-white/90 text-slate-800 shadow"  }, ["Teclas: ..."]);
    uiHost.append(scoreEl, livesEl, keysEl);
    uiFO.appendChild(uiHost);
    svg.appendChild(uiFO);

    // ----- Avisos (Correcto/Incorrecto) FUERA de la cinta, debajo de la UI (también en el celeste) -----
    const noticeFO = svgEl("foreignObject", {
      x: String(CEL_X + 8),
      y: String(CEL_Y + 6 + UI_H + GAP),   // debajo de la UI pero aún fuera de la cinta
      width: String(CEL_W - 16),
      height: String(NOTICE_H),
      "pointer-events": "none",
    }) as unknown as SVGForeignObjectElement;
    const noticeHost = document.createElement("div");
    noticeHost.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
    Object.assign(noticeHost.style, {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      width: "100%",
      height: "100%",
    } as CSSStyleDeclaration);
    noticeFO.appendChild(noticeHost);
    svg.appendChild(noticeFO);

    function toast(msg: string, ok = true) {
      const bubble = el("div", {
        class: "px-3 py-1 rounded-xl shadow text-white text-sm",
        style: `background:${ok ? "#16a34a" : "#ef4444"}; pointer-events:none;`,
      }, [msg]);
      noticeHost.replaceChildren(bubble);
      setTimeout(() => { if (noticeHost.firstChild === bubble) noticeHost.replaceChildren(); }, 1200);
    }

    // ----- Listones de la cinta (animación) -----
    const clipId = "belt-clip-" + Math.random().toString(36).slice(2);
    const clip = svgEl("clipPath", { id: clipId });
    clip.appendChild(svgEl("rect", { x:BELT.x, y:BELT.y, width:BELT.w, height:BELT.h, rx: 18 }));
    (svg as any).appendChild(clip);

    const slats = svgEl("g", { "clip-path": `url(#${clipId})`, opacity:"0.4" });
    const SLAT_W = 80, GAP_S = 40, Hs = BELT.h, count = Math.ceil((BELT.w+SLAT_W*2)/ (SLAT_W+GAP_S));
    for (let i=0;i<count;i++){
      const x = BELT.x - SLAT_W + i*(SLAT_W+GAP_S);
      const r = svgEl("rect", { x, y: BELT.y+8, width: SLAT_W, height: Hs-16, rx: 10, fill:"#9CA3AF" });
      slats.appendChild(r);
    }
    beltGroup.appendChild(slats);

    // ----- Tachos (orden aleatorio) -----
    const binsOrder = shuffle(Object.values(BINS));
    const binNodes: { x:number; y:number; r:number; bin: Bin; g: SVGGElement }[] = [];
    binsOrder.forEach((bin, i) => {
      const x = BINS_X[i], y = BINS_Y;
      const g = svgEl("g") as SVGGElement;
      const lid  = svgEl("rect", { x:x-38, y:y-60, width:76, height:14, rx:6, fill:bin.color, stroke:"#111827", "stroke-width":2 });
      const body = svgEl("rect", { x:x-32, y:y-48, width:64, height:56, rx:10, fill:bin.color, stroke:"#111827", "stroke-width":2, opacity:0.95 });
      const lbl  = svgEl("text", { x, y:y+24, "text-anchor":"middle", "font-size":14, fill:"#334155" }); (lbl as any).textContent = bin.label;
      g.append(lid, body, lbl);
      binsGroup.appendChild(g);
      binNodes.push({ x, y: y-20, r: 44, bin, g });
    });
    // Teclas dinámicas según orden
    (keysEl.firstChild as any).textContent = `Teclas: 1-${binsOrder[0].label} · 2-${binsOrder[1].label} · 3-${binsOrder[2].label}`;

    // ----- Estado -----
    let score = 0, lives = 3;
    let speed = 70;           // ritmo suave
    const BELT_MULT = 0.6;    // animación visual de la cinta
    let gameOver = false;

    type Drop = {
      id: number;
      item: Item;
      x: number; y: number; vx: number;
      grabbed: boolean;
      w: number;                    // ancho dinámico del chip
      g: SVGGElement;
      chip: SVGRectElement;
      em: SVGTextElement;
      lb: SVGTextElement;
    };
    const drops: Drop[] = [];
    let nextId = 1;

    function updateUI() {
      (scoreEl.firstChild as any).textContent = `Correctas: ${score} / ${TARGET_SCORE}`;
      const hearts = "❤️".repeat(lives) + "🤍".repeat(Math.max(0, 3 - lives));
      (livesEl.firstChild as any).textContent = `Vidas: ${hearts}`;
    }
    updateUI();

    // Spawner
    let spawnCooldown = 0;
    function spawnDrop() {
      if (gameOver) return;
      const it = ITEMS[(Math.random()*ITEMS.length)|0];
      const x = BELT.x + 20, y = BELT.y + BELT.h/2;

      // Creamos el grupo y los textos primero (para medir ancho real)
      const g = svgEl("g", { cursor: "grab" }) as SVGGElement;
      const em  = svgEl("text", { x, y:y-2, "text-anchor":"middle", "font-size":26 }) as SVGTextElement; (em as any).textContent = it.emoji;
      const lb  = svgEl("text", { x, y:y+22, "text-anchor":"middle", "font-size":11, fill:"#334155" }) as SVGTextElement; (lb as any).textContent = it.label;
      g.append(em, lb);
      itemsGroup.appendChild(g);

      // Medimos y definimos ancho del chip
      const emBox = em.getBBox();
      const lbBox = lb.getBBox();
      const minW = 76;
      const padding = 24; // 12px por lado
      const w = Math.max(minW, Math.ceil(Math.max(emBox.width, lbBox.width) + padding));

      // Insertamos el rect por detrás de los textos
      const chip = svgEl("rect", {
        x: String(x - w/2),
        y: String(y - 26),
        width: String(w),
        height: "52",
        rx: "14",
        fill:"#FFFFFF",
        stroke:"#0f172a",
        "stroke-width":"3"
      }) as SVGRectElement;
      g.insertBefore(chip, em);

      const d: Drop = { id: nextId++, item: it, x, y, vx: speed, grabbed: false, w, g, chip, em, lb };
      drops.push(d);

      // Drag & drop
      g.addEventListener("pointerdown", (e) => {
        if (gameOver) return;
        g.setPointerCapture((e as PointerEvent).pointerId);
        const p = svgPointFromEvent(svg, e as PointerEvent);
        d.grabbed = true; g.setAttribute("cursor", "grabbing");
        moveTo(d, p.x, p.y);
      });
      g.addEventListener("pointermove", (e) => {
        if (!d.grabbed) return;
        const p = svgPointFromEvent(svg, e as PointerEvent);
        moveTo(d, p.x, p.y);
      });
      g.addEventListener("pointerup", () => {
        if (!d.grabbed) return;
        d.grabbed = false; g.setAttribute("cursor", "grab");
        const hit = hitBin(d.x, d.y);
        if (hit) resolveDrop(d, hit);
      });
    }

    function moveTo(d: Drop, x: number, y: number) {
      d.x = x; d.y = y;
      d.chip.setAttribute("x", String(d.x - d.w / 2));
      d.chip.setAttribute("y", String(d.y - 26));
      d.em.setAttribute("x", String(d.x));
      d.em.setAttribute("y", String(d.y - 2));
      d.lb.setAttribute("x", String(d.x));
      d.lb.setAttribute("y", String(d.y + 22));
    }

    function hitBin(x:number, y:number) {
      for (const bn of binNodes) {
        const dx = x - bn.x, dy = y - bn.y;
        if (dx*dx + dy*dy <= bn.r*bn.r) return bn;
      }
      return null;
    }

    function resolveDrop(d: Drop, bn: {bin: Bin}) {
      if (gameOver) return;
      const ok = bn.bin.cat === d.item.cat;
      if (ok) {
        score++; updateUI(); toast("¡Correcto! ✅", true);
        if (score >= TARGET_SCORE) return endGame(true);
        if (score % 5 === 0) { speed += 10; drops.forEach(dr => dr.vx = speed); }
      } else {
        lives--; updateUI(); toast("Tacho incorrecto ❌", false);
        if (lives <= 0) return endGame(false);
      }
      d.g.remove();
      const idx = drops.findIndex(x => x.id === d.id);
      if (idx >= 0) drops.splice(idx, 1);
    }

    // Teclas 1-2-3 (izq, centro, der)
    const keyHandler = (e: KeyboardEvent) => {
      if (gameOver) return;
      if (!["1","2","3"].includes(e.key)) return;
      const bn = binNodes[Number(e.key)-1]; if (!bn) return;
      const cand = drops.filter(d => !d.grabbed).sort((a,b)=>b.x-a.x)[0];
      if (!cand) return;
      resolveDrop(cand, bn);
    };
    window.addEventListener("keydown", keyHandler);

    // Bucle
    const BELT_CYCLE = 80 + 40; // SLAT_W + GAP
    let lastTimeRAF = performance.now();
    let slatOffset = 0;
    function tick(now: number) {
      const dt = (now - lastTimeRAF) / 1000; lastTimeRAF = now;
      if (!gameOver) {
        // Animación de listones (visualmente más lenta que los ítems)
        slatOffset = (slatOffset + speed * BELT_MULT * dt) % BELT_CYCLE;
        for (let i=0; i<slats.children.length; i++) {
          const r = slats.children[i] as SVGRectElement;
          const base = BELT.x - 80 + i*(80+40);
          r.setAttribute("x", String(base - slatOffset));
        }

        // Ítems
        for (let i=drops.length-1; i>=0; i--) {
          const d = drops[i];
          if (!d.grabbed) moveTo(d, d.x + d.vx * dt, d.y);
          if (!d.grabbed && d.x > BELT.x + BELT.w - 10) {
            d.g.remove(); drops.splice(i,1);
            lives--; updateUI(); toast("Se escapó de la cinta 😬", false);
            if (lives <= 0) { endGame(false); break; }
          }
        }

        // Spawner (máx 2 en pantalla)
        spawnCooldown -= dt;
        if (spawnCooldown <= 0 && drops.length < 2) {
          spawnDrop();
          spawnCooldown = clamp(1.6 - (score * 0.02), 0.8, 2.2);
        }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame((t)=>{ lastTimeRAF=t; tick(t); });

    function endGame(win = false) {
      if (gameOver) return;
      gameOver = true;
      window.removeEventListener("keydown", keyHandler);
      noticeHost.replaceChildren();
      for (const d of drops) d.g.remove();
      drops.length = 0;

      const headline = win ? "¡Meta alcanzada! 🎉" : "¡Fin del juego!";
      const sub = win ? `Completaste ${TARGET_SCORE} clasificaciones correctas.` : `Puntos: ${score}`;
      const hint = (keysEl.firstChild as any).textContent || "Teclas: 1-2-3";

      wrap.appendChild(el("div", { class:"absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-center" }, [
        el("div", { class:"text-2xl font-bold text-slate-800" }, [headline]),
        el("div", { class:"text-slate-700" }, [sub]),
        el("div", { class:"text-slate-600 text-sm" }, [hint]),
        el("button", { class:"px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700", onclick: () => start(root) }, ["Reiniciar"]),
        el("a", { href:"#menu", class:"px-3 py-1 rounded-xl bg-white border text-slate-700 hover:bg-slate-50" }, ["← Volver al menú"]),
      ]));
    }

    console.debug("[cinta] listo");
  } catch (e) {
    console.error("[cinta] error", e);
    root.textContent = "Hubo un error al cargar el juego.";
  }
}
