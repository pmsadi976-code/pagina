// src/games/primaria.ts
// Juego: ECO RUNNER (3 carriles) — dinámico para primaria
// Mueve el recogedor con 1–2–3, flechas o clic. Atrapa SOLO el "Objetivo".
// Combos, power-up de ralentizar, dificultad progresiva, meta de puntos.
// Muestra el NOMBRE del contenedor (tipo) sobre el recogedor y se ajusta al ancho.

type Category = "organicos" | "reciclables" | "peligrosos";
type Item = { emoji: string; label: string; cat: Category };

const BINS_META: Record<Category, { color: string; label: string }> = {
  organicos:   { color: "#111827", label: "Orgánicos"   },
  reciclables: { color: "#3b82f6", label: "Reciclables" },
  peligrosos:  { color: "#ef4444", label: "Peligrosos"  },
};

const ITEMS: Item[] = [
  // ORGÁNICOS
  { emoji:"🍎", label:"Restos de comida", cat:"organicos" },
  { emoji:"🍌", label:"Cáscara de plátano", cat:"organicos" },
  { emoji:"🥚", label:"Cáscaras de huevo", cat:"organicos" },
  { emoji:"🥕", label:"Restos de verduras", cat:"organicos" },
  { emoji:"🍂", label:"Hojas secas", cat:"organicos" },
  { emoji:"☕️", label:"Posos de café", cat:"organicos" },

  // RECICLABLES
  { emoji:"🧴", label:"Botella de plástico", cat:"reciclables" },
  { emoji:"🍾", label:"Botella de vidrio", cat:"reciclables" },
  { emoji:"🥫", label:"Lata metálica", cat:"reciclables" },
  { emoji:"📦", label:"Caja de cartón", cat:"reciclables" },
  { emoji:"📰", label:"Periódico", cat:"reciclables" },
  { emoji:"🍶", label:"Frasco de vidrio", cat:"reciclables" },

  // PELIGROSOS
  { emoji:"🔋", label:"Pilas", cat:"peligrosos" },
  { emoji:"💉", label:"Jeringa", cat:"peligrosos" },
  { emoji:"💊", label:"Medicamentos vencidos", cat:"peligrosos" },
  { emoji:"💡", label:"Foco fluorescente", cat:"peligrosos" },
  { emoji:"🧪", label:"Químicos", cat:"peligrosos" },
  { emoji:"🛢️", label:"Aceite de motor", cat:"peligrosos" },
];

// ——— Utilidades ———
function choice<T>(a: T[]){ return a[(Math.random()*a.length)|0]; }
function clamp(n:number, lo:number, hi:number){ return Math.max(lo, Math.min(hi, n)); }
function el<K extends keyof HTMLElementTagNameMap>(tag:K, attrs:Record<string,unknown>={}, children:(Node|string)[]=[]){
  const node = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)){
    if (k==="class") (node as HTMLElement).className = String(v);
    else if (k==="style" && v && typeof v === "object") Object.assign((node as HTMLElement).style, v as any);
    else if (k.startsWith("on") && typeof v === "function") (node as any)[k.toLowerCase()] = v;
    else node.setAttribute(k, String(v));
  }
  for (const c of children) node.appendChild(typeof c==="string"? document.createTextNode(c) : c);
  return node;
}
function svgEl<K extends keyof SVGElementTagNameMap>(tag:K, attrs:Record<string,unknown>={}){
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [k,v] of Object.entries(attrs)) (node as Element).setAttribute(k, String(v));
  return node as SVGElementTagNameMap[K];
}

// ——— Juego ———
export default function start(root: HTMLElement){
  try{
    root.replaceChildren();
    const wrap = el("div", { class:"w-full max-w-5xl bg-white rounded-2xl shadow p-4 sm:p-6 relative overflow-hidden" });
    root.appendChild(wrap);

    // Título e instrucción breve
    wrap.append(
      el("h3", { class:"text-2xl font-bold text-slate-800 text-center mb-1" }, ["Eco Runner — ¡Atrapa solo el Objetivo!"]),
      el("p",  { class:"text-slate-600 text-center mb-3" }, [
        "Usa ", el("b",{},["1–2–3"]), " o ", el("b",{},["Flechas"]), " o clic en el carril para moverte. ",
        "Atrapa solo la categoría objetivo para sumar puntos."
      ])
    );

    // HUD superior
    const hud = el("div", { class:"flex flex-wrap items-center justify-center gap-2 mb-2" });
    const objEl   = el("div", { class:"px-3 py-1 rounded-xl bg-slate-100 border text-slate-800 text-sm" }, ["Objetivo: —"]);
    const scoreEl = el("div", { class:"px-3 py-1 rounded-xl bg-slate-100 border text-slate-800 text-sm" }, ["Puntos: 0"]);
    const comboEl = el("div", { class:"px-3 py-1 rounded-xl bg-slate-100 border text-slate-800 text-sm" }, ["Combo: x1"]);
    const livesEl = el("div", { class:"px-3 py-1 rounded-xl bg-slate-100 border text-slate-800 text-sm" }, ["Vidas: ❤️❤️❤️"]);
    const keysEl  = el("div", { class:"px-3 py-1 rounded-xl bg-slate-100 border text-slate-600 text-xs" }, ["Teclas: 1-Izq · 2-Centro · 3-Der · Espacio: Pausa"]);
    wrap.appendChild(hud); hud.append(objEl, scoreEl, comboEl, livesEl, keysEl);

    // SVG
    const W = 900, H = 560;
    const svg = svgEl("svg", { viewBox:`0 0 ${W} ${H}`, class:"w-full h-[500px] block" }) as unknown as SVGSVGElement;
    svg.appendChild(svgEl("rect", { x:0, y:0, width:W, height:H, fill:"#F1F5F9" }));
    wrap.appendChild(svg);

    // Tablero
    const board = { x: 70, y: 80, w: W-140, h: H-140 };
    svg.appendChild(svgEl("rect", { x:board.x, y:board.y, width:board.w, height:board.h, rx:22, fill:"#E2E8F0", stroke:"#CBD5E1" }));

    // Carriles
    const laneXs = [board.x + board.w*0.2, board.x + board.w*0.5, board.x + board.w*0.8].map(n=>Math.round(n));
    const laneYTop = board.y + 10;
    const laneYBottom = board.y + board.h - 110;
    const lanesG = svgEl("g", { opacity:"0.35" });
    for (let i=0;i<3;i++){
      lanesG.appendChild(svgEl("rect", {
        x:String(laneXs[i]-90), y:String(board.y+6), width:"180", height:String(board.h-12),
        rx:"18", fill: i%2? "#F8FAFC" : "#F1F5F9", stroke:"#CBD5E1"
      }));
      lanesG.appendChild(svgEl("text", { x:String(laneXs[i]), y:String(board.y+28), "text-anchor":"middle", "font-size":"12", fill:"#64748B" }))
        .appendChild(document.createTextNode(["Izq","Centro","Der"][i]));
    }
    svg.appendChild(lanesG);

    // Toast (encima del tablero)
    const noticeFO = svgEl("foreignObject", {
      x: String(board.x + 12),
      y: String(board.y + 12),
      width: String(board.w - 24),
      height: "36",
      "pointer-events":"none",
    }) as unknown as SVGForeignObjectElement;
    const noticeHost = document.createElement("div");
    noticeHost.setAttribute("xmlns","http://www.w3.org/1999/xhtml");
    Object.assign(noticeHost.style, { display:"flex", justifyContent:"center", alignItems:"center", width:"100%", height:"100%" } as CSSStyleDeclaration);
    noticeFO.appendChild(noticeHost);
    svg.appendChild(noticeFO);
    function toast(msg:string, ok=true){
      const t = el("div", { class:"px-3 py-1 rounded-xl shadow text-white text-sm",
        style:`background:${ok ? "#16a34a" : "#ef4444"}; pointer-events:none;` }, [msg]);
      noticeHost.replaceChildren(t);
      setTimeout(()=>{ if (noticeHost.firstChild===t) noticeHost.replaceChildren(); }, 1200);
    }

    // ——— Recogedor (player) con etiqueta del contenedor ———
    let playerLane = 1; // 0-1-2
    const playerY = laneYBottom + 46;
    const playerG = svgEl("g", { cursor:"pointer" }) as SVGGElement;

    const playerBase = svgEl("rect", { x:String(laneXs[playerLane]-52), y:String(playerY-26), width:"104", height:"52",
      rx:"14", fill:"#FFFFFF", stroke:"#0f172a", "stroke-width":"3" });
    const playerMouth = svgEl("rect", { x:String(laneXs[playerLane]-42), y:String(playerY-12), width:"84", height:"18",
      rx:"8", fill:"#111827" });

    // Etiqueta del contenedor (ajusta ancho al texto)
    const playerLabelBg = svgEl("rect", {
      x: String(laneXs[playerLane] - 48),
      y: String(playerY - 24),
      width: "96",
      height: "14",
      rx: "7",
      fill: "#FFFFFF",
      opacity: "0.9",
      stroke: "#CBD5E1",
      "stroke-width": "2",
    }) as SVGRectElement;

    const playerLabel = svgEl("text", {
      x: String(laneXs[playerLane]),
      y: String(playerY - 14),
      "text-anchor": "middle",
      "font-size": "11",
      fill: "#0f172a",
    }) as SVGTextElement;

    playerG.append(playerBase, playerMouth, playerLabelBg, playerLabel);
    svg.appendChild(playerG);

    // Estado principal
    const TARGET_SCORE = 25;
    let lives = 3;
    let score = 0;
    let combo = 1, comboAcc = 0;
    let paused = false;
    let slowTimer = 0; // power-up
    let target: Category = choice(["organicos","reciclables","peligrosos"] as Category[]);
    let hitsToSwitch = 6; // aciertos para cambiar objetivo

    // HUD
    function updateHUD(){
      const meta = BINS_META[target];
      (objEl.firstChild as any).textContent = `Objetivo: ${meta.label}`;
      (objEl as HTMLElement).style.borderColor = meta.color;
      (objEl as HTMLElement).style.color = "#0f172a";
      (objEl as HTMLElement).style.background = "#f8fafc";
      (scoreEl.firstChild as any).textContent = `Puntos: ${score}`;
      (comboEl.firstChild as any).textContent = slowTimer>0 ? `Combo: x${combo}  (⏱️)` : `Combo: x${combo}`;
      (livesEl.firstChild as any).textContent = `Vidas: ${"❤️".repeat(lives)}${"🤍".repeat(Math.max(0,3-lives))}`;
      setPlayerLabel(); // 👈 actualiza etiqueta del recogedor
    }

    // Ajusta la etiqueta del contenedor (texto y ancho del fondo)
    let playerLabelW = 96;
    function setPlayerLabel(){
      (playerLabel as any).textContent = BINS_META[target].label;
      playerLabel.setAttribute("x", String(laneXs[playerLane]));
      // medir texto y ajustar ancho del fondo
      try {
        const box = playerLabel.getBBox();
        playerLabelW = Math.max(72, Math.ceil(box.width + 16)); // padding 8px por lado
      } catch { playerLabelW = 96; }
      playerLabelBg.setAttribute("width", String(playerLabelW));
      playerLabelBg.setAttribute("x", String(laneXs[playerLane] - playerLabelW/2));
      playerLabelBg.setAttribute("stroke", BINS_META[target].color);
    }

    function movePlayerTo(lane: number){
      playerLane = clamp(lane, 0, 2);
      const x = laneXs[playerLane];
      playerBase.setAttribute("x", String(x-52));
      playerMouth.setAttribute("x", String(x-42));
      playerLabel.setAttribute("x", String(x));
      playerLabelBg.setAttribute("x", String(x - playerLabelW/2));
      // pequeña animación (rebote)
      playerG.setAttribute("transform", `translate(0,-2)`);
      setTimeout(()=>playerG.setAttribute("transform",""), 80);
    }

    // Click en carriles para moverse
    lanesG.addEventListener("click", (e)=>{
      const pt = (svg as any).createSVGPoint(); pt.x = (e as PointerEvent).clientX; pt.y = (e as PointerEvent).clientY;
      const inv = svg.getScreenCTM()?.inverse(); if (!inv) return;
      const p = pt.matrixTransform(inv);
      const lane = laneXs.reduce((best,i,idx,arr)=> Math.abs(p.x-i) < Math.abs(p.x-arr[best]) ? idx : best, 0);
      movePlayerTo(lane);
    });

    function changeTarget(){
      const cats: Category[] = ["organicos","reciclables","peligrosos"];
      const others = cats.filter(c=>c!==target);
      target = choice(others);
      hitsToSwitch = 6;
      // color de la boca según categoría
      playerMouth.setAttribute("fill", BINS_META[target].color);
      playerMouth.setAttribute("opacity", "0.95");
      updateHUD();
      toast(`Nuevo objetivo: ${BINS_META[target].label} ${target==="reciclables"?"♻️": target==="organicos"?"🌱":"⚠️"}`, true);
    }

    // color y etiqueta inicial
    playerMouth.setAttribute("fill", BINS_META[target].color);
    playerMouth.setAttribute("opacity", "0.95");
    updateHUD();

    // Elementos cayendo
    type Kind = "item" | "power";
    type Drop = {
      id:number; kind:Kind; item?:Item; lane:number; x:number; y:number; vy:number; w:number;
      g: SVGGElement; chip: SVGRectElement; em?: SVGTextElement; lb?: SVGTextElement;
    };
    const drops: Drop[] = [];
    let nextId = 1;

    // Spawner
    let spawnCooldown = 0;
    let baseSpeed = 100; // px/s
    function spawn(){
      // power-up ⏱️ ocasional
      if (Math.random() < 0.08){
        const lane = (Math.random()*3)|0;
        const x = laneXs[lane], y = laneYTop;
        const g = svgEl("g") as SVGGElement;
        const chip = svgEl("rect", { x:String(x-30), y:String(y-22), width:"60", height:"44", rx:"12", fill:"#ecfeff", stroke:"#0891b2", "stroke-width":"3" }) as SVGRectElement;
        const em = svgEl("text", { x:String(x), y:String(y+6), "text-anchor":"middle", "font-size":"20", fill:"#0e7490" }) as SVGTextElement;
        (em as any).textContent = "⏱️";
        g.append(chip, em); svg.appendChild(g);
        const d: Drop = { id: nextId++, kind:"power", lane, x, y, vy: baseSpeed*0.9, w:60, g, chip };
        drops.push(d); return;
      }

      // ítem normal (sesgado al objetivo)
      const roll = Math.random();
      const cat = roll < 0.55 ? target : choice((["organicos","reciclables","peligrosos"] as Category[]));
      const candidates = ITEMS.filter(i=>i.cat===cat);
      const it = choice(candidates);
      const lane = (Math.random()*3)|0;
      const x = laneXs[lane], y = laneYTop;

      const g = svgEl("g") as SVGGElement;
      const em = svgEl("text", { x:String(x), y:String(y-2), "text-anchor":"middle", "font-size":"24" }) as SVGTextElement; (em as any).textContent = it.emoji;
      const lb = svgEl("text", { x:String(x), y:String(y+18), "text-anchor":"middle", "font-size":"11", fill:"#334155" }) as SVGTextElement; (lb as any).textContent = it.label;
      g.append(em, lb); svg.appendChild(g);
      const emBox = em.getBBox(), lbBox = lb.getBBox();
      const w = Math.max(76, Math.ceil(Math.max(emBox.width, lbBox.width) + 24));
      const chip = svgEl("rect", { x:String(x - w/2), y:String(y-24), width:String(w), height:"48", rx:"14", fill:"#FFFFFF", stroke:"#0f172a", "stroke-width":"3" }) as SVGRectElement;
      g.insertBefore(chip, em);

      const vy = baseSpeed * (0.9 + Math.random()*0.3);
      const d: Drop = { id: nextId++, kind:"item", item: it, lane, x, y, vy, w, g, chip, em, lb };
      drops.push(d);
    }

    function removeDrop(d:Drop){
      try { d.g.remove(); } catch {}
      const i = drops.findIndex(z=>z.id===d.id);
      if (i>=0) drops.splice(i,1);
    }

    // Feedback flotante
    function floatLabel(text:string, x:number, y:number, ok=true){
      const fo = svgEl("foreignObject", { x:String(x-40), y:String(y-30), width:"80", height:"30", "pointer-events":"none" }) as unknown as SVGForeignObjectElement;
      const div = document.createElement("div");
      div.setAttribute("xmlns","http://www.w3.org/1999/xhtml");
      Object.assign(div.style, { fontSize:"14px", color:"#fff", background:(ok?"#16a34a":"#ef4444"), padding:"2px 6px", borderRadius:"8px", textAlign:"center" } as CSSStyleDeclaration);
      div.textContent = text; fo.appendChild(div); svg.appendChild(fo);
      setTimeout(()=>fo.remove(), 500);
    }

    // Puntuación/vidas
    function addScore(points=1){
      score += points * combo;
      comboAcc += 1;
      if (comboAcc % 4 === 0) combo++;
      updateHUD();
      if (score >= TARGET_SCORE) { endGame(true); }
    }
    function resetCombo(){ combo = 1; comboAcc = 0; updateHUD(); }
    function loseLife(){
      lives--; resetCombo(); updateHUD();
      if (lives<=0) endGame(false);
    }

    // Input
    function handleMove(dir: "left"|"right"){ movePlayerTo(playerLane + (dir==="left" ? -1 : +1)); }
    function handleLane(n:number){ movePlayerTo(n); }
    const keyHandler = (e: KeyboardEvent)=>{
      if (e.key===" "){ paused = !paused; toast(paused? "⏸️ Pausa" : "▶️ Reanudar", true); return; }
      if (paused) return;
      if (e.key==="ArrowLeft") handleMove("left");
      else if (e.key==="ArrowRight") handleMove("right");
      else if (["1","2","3"].includes(e.key)) handleLane(Number(e.key)-1);
    };
    window.addEventListener("keydown", keyHandler);

    // Bucle
    let last = performance.now();
    let raf = 0;
    function loop(t:number){
      const dt0 = (t - last)/1000; last = t;
      if (paused){ raf = requestAnimationFrame(loop); return; }
      let dt = dt0;

      // efecto ralentizar
      if (slowTimer > 0){
        dt *= 0.4; slowTimer -= dt0;
      }

      // spawn
      spawnCooldown -= dt;
      if (spawnCooldown <= 0){
        spawn();
        const base = 0.9 - Math.min(0.5, score*0.015);
        spawnCooldown = clamp(base + (Math.random()*0.3), 0.35, 1.2);
      }

      // mover drops
      for (let i=drops.length-1; i>=0; i--){
        const d = drops[i];
        d.y += d.vy * dt;
        d.chip.setAttribute("y", String(d.y - (d.kind==="power"?22:24)));
        if (d.em) d.em.setAttribute("y", String(d.y - 2));
        if (d.lb) d.lb.setAttribute("y", String(d.y + 18));

        // ¿colisión con jugador?
        const sameLane = d.lane === playerLane;
        const catchY = playerY - 18;
        if (sameLane && d.y >= catchY){
          if (d.kind === "power"){
            slowTimer = 4.0;
            floatLabel("¡Ralentizado!", d.x, catchY, true);
            toast("⏱️ Todo más lento por 4s", true);
            removeDrop(d);
            continue;
          }
          const ok = d.item!.cat === target;
          if (ok){
            floatLabel(`+${1*combo}`, d.x, catchY, true);
            addScore(1);
            hitsToSwitch--; if (hitsToSwitch<=0) changeTarget();
          } else {
            floatLabel("–vida", d.x, catchY, false);
            toast("¡Eso no era del objetivo!", false);
            loseLife();
          }
          removeDrop(d);
          continue;
        }

        // ¿se salió por abajo?
        if (d.y > board.y + board.h - 2){
          if (d.kind === "item" && d.item!.cat === target){
            toast("Se escapó un objetivo 😬", false);
            loseLife();
          }
          removeDrop(d);
        }
      }

      // subir dificultad con el tiempo
      baseSpeed = 100 + Math.min(140, score*4 + (combo-1)*6);

      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame((t)=>{ last=t; loop(t); });

    // Click directo por carril (áreas invisibles)
    for (let i=0;i<3;i++){
      const hit = svgEl("rect", { x:String(laneXs[i]-100), y:String(board.y), width:"200", height:String(board.h), fill:"transparent" });
      hit.addEventListener("click", ()=> handleLane(i));
      svg.appendChild(hit);
    }

    // Fin de juego
    function endGame(win:boolean){
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", keyHandler);
      for (const d of drops) try{ d.g.remove(); } catch {}
      drops.length = 0;

      const overlay = el("div", { class:"absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-center" }, [
        el("div", { class:"text-2xl font-bold text-slate-800" }, [ win ? "¡Meta alcanzada! 🎉" : "¡Fin del juego!" ]),
        el("div", { class:"text-slate-700" }, [ `Puntos: ${score}` ]),
        el("div", { class:"text-slate-600 text-sm" }, [ `Objetivo final: ${BINS_META[target].label} · Combo máx x${combo}` ]),
        el("button", { class:"px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700", onclick: ()=>start(root) }, ["Reiniciar"]),
        el("a", { href:"#menu", class:"px-3 py-1 rounded-xl bg-white border text-slate-700 hover:bg-slate-50" }, ["← Volver al menú"]),
      ]);
      (root.firstChild as HTMLElement).appendChild(overlay);
    }

  } catch (e){
    console.error("[primaria] Eco Runner error", e);
    root.textContent = "Hubo un error al cargar el juego.";
  }
}
