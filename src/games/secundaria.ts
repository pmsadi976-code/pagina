// secundaria.ts — Pupiletra ecológica (sopa de letras) con validación mientras arrastras

type Coord = { r: number; c: number };

export default function start(root: HTMLElement) {
  root.replaceChildren();

  const palabrasMostrar = [
    "Reciclar",
    "Ahorrar",
    "Evitar",
    "Reutilizar",
    "Botar",
    "Conservación",
    "Desarrollo",
    "Reciclaje",
    "Biodegradable",
    "Sostenibilidad",
    "Ecología",
    "Biodiversidad",
  ];

  const limpiar = (s: string) =>
    s
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "");

  type Palabra = { display: string; clean: string; found: boolean };

  const palabras: Palabra[] = palabrasMostrar.map((p) => ({
    display: p,
    clean: limpiar(p),
    found: false,
  }));

  const SIZE = 16;
  const ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const container = document.createElement("div");
  container.id = "pupiletra";
  container.innerHTML = `
    <div class="panel">
      <div class="header">
        <h1>🧩 Pupiletra ecológica</h1>
        <div class="sub">Mantén el click (o dedo) presionado y arrastra en línea recta. Valida al instante.</div>
      </div>
      <div class="info">
        <div><strong>Encontradas:</strong> <span id="found-count">0</span> / <span id="total-count">${palabras.length}</span></div>
        <div class="actions">
          <button id="btn-reiniciar" title="Nuevo tablero">🔄 Reiniciar</button>
        </div>
      </div>
      <ul class="lista" id="lista-palabras"></ul>
    </div>
    <div class="grid-wrap">
      <div class="grid" id="grid" role="grid" aria-label="Pupiletra"></div>
      <div class="toast" id="toast" aria-live="polite"></div>
    </div>
    <style>
      #pupiletra {
        --cell: 36px; --gap: 6px;
        color: #e5e7eb; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans";
        display: grid; grid-template-columns: 360px 1fr; gap: 16px; align-items: start;
        user-select: none;
      }
      #pupiletra .panel{background:linear-gradient(180deg,#0f172a,#0b1220);border:1px solid #1f2937;border-radius:16px;padding:16px;box-shadow:0 10px 30px #00000040;position:sticky;top:0}
      #pupiletra .header h1{margin:0 0 4px 0;font-size:20px;line-height:1.2}
      #pupiletra .header .sub{color:#64748b;font-size:13px}
      #pupiletra .info{margin:12px 0 8px;display:flex;justify-content:space-between;align-items:center;gap:8px}
      #pupiletra .actions button{background:#111827;color:#e5e7eb;border:1px solid #1f2937;padding:8px 10px;border-radius:10px;cursor:pointer;transition:transform .06s, background .2s, border-color .2s}
      #pupiletra .actions button:hover{background:#0b1220;border-color:#334155;transform:translateY(-1px)}
      #pupiletra .lista{list-style:none;margin:8px 0 0;padding:0;display:grid;grid-template-columns:1fr;gap:8px}
      #pupiletra .lista li{background:#0b1220;border:1px dashed #1f2937;border-radius:10px;padding:8px 10px;display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:14px}
      #pupiletra .lista li .chip{font-size:10px;padding:2px 6px;border-radius:999px;background:#111827;border:1px solid #1f2937;color:#93c5fd}
      #pupiletra .lista li.found{border-style:solid;border-color:#14532d;background:#052e16;color:#86efac;text-decoration:line-through}
      #pupiletra .grid-wrap{display:grid;justify-content:start;align-content:start;gap:12px}
      #pupiletra .grid{display:grid;grid-template-columns:repeat(${SIZE}, var(--cell));gap:var(--gap);touch-action:none}
      #pupiletra .cell{width:var(--cell);height:var(--cell);display:grid;place-items:center;font-weight:700;font-size:16px;color:#e5e7eb;background:#0f172a;border:1px solid #1f2937;border-radius:10px;transition:background .1s,border-color .1s,transform .04s}
      #pupiletra .cell:hover{border-color:#334155}
      #pupiletra .cell.preview{background:#0ea5e933;border-color:#155e75}
      #pupiletra .cell.found{background:#16a34a22;border-color:#14532d;color:#a7f3d0}
      #pupiletra .cell.active{outline:2px solid #0ea5e9}
      #pupiletra .toast{min-height:20px;font-size:14px;color:#93c5fd}
      @media (max-width:1024px){#pupiletra{grid-template-columns:1fr}}
    </style>
  `;
  root.appendChild(container);

  const gridEl = container.querySelector<HTMLDivElement>("#grid")!;
  const listaEl = container.querySelector<HTMLUListElement>("#lista-palabras")!;
  const foundCountEl = container.querySelector<HTMLSpanElement>("#found-count")!;
  const toastEl = container.querySelector<HTMLDivElement>("#toast")!;
  const btnReiniciar = container.querySelector<HTMLButtonElement>("#btn-reiniciar")!;

  function renderLista() {
    listaEl.replaceChildren(
      ...palabras.map((p) => {
        const li = document.createElement("li");
        li.textContent = p.display;
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = limpiar(p.display);
        li.appendChild(chip);
        if (p.found) li.classList.add("found");
        return li;
      })
    );
  }

  const dirs: Coord[] = [
    { r: 0, c: 1 }, { r: 0, c: -1 }, { r: 1, c: 0 }, { r: -1, c: 0 },
    { r: 1, c: 1 }, { r: -1, c: -1 }, { r: 1, c: -1 }, { r: -1, c: 1 },
  ];

  const grid: string[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(""));
  const cellEls: HTMLDivElement[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(null as any));
  const posicionPalabra = new Map<string, Coord[]>();

  function colocarPalabras() {
    const sorted = [...palabras].sort((a, b) => b.clean.length - a.clean.length);
    for (const p of sorted) {
      const placed = intentarColocar(p.clean);
      if (!placed) {
        for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) grid[r][c] = "";
        posicionPalabra.clear();
        return colocarPalabras();
      }
    }
  }

  function intentarColocar(word: string): boolean {
    const tries = 400;
    for (let t = 0; t < tries; t++) {
      const dir = dirs[Math.floor(Math.random() * dirs.length)];
      const maxR = dir.r === 1 ? SIZE - word.length : SIZE - 1;
      const minR = dir.r === -1 ? word.length - 1 : 0;
      const maxC = dir.c === 1 ? SIZE - word.length : SIZE - 1;
      const minC = dir.c === -1 ? word.length - 1 : 0;
      const startR = randInt(minR, maxR);
      const startC = randInt(minC, maxC);

      let ok = true;
      const path: Coord[] = [];
      for (let i = 0; i < word.length; i++) {
        const r = startR + dir.r * i;
        const c = startC + dir.c * i;
        if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) { ok = false; break; }
        const ch = grid[r][c];
        if (ch !== "" && ch !== word[i]) { ok = false; break; }
        path.push({ r, c });
      }
      if (!ok) continue;

      for (let i = 0; i < word.length; i++) {
        const { r, c } = path[i];
        grid[r][c] = word[i];
      }
      posicionPalabra.set(word, path);
      return true;
    }
    return false;
  }

  function randInt(a: number, b: number) {
    const min = Math.min(a, b);
    const max = Math.max(a, b);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  colocarPalabras();

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === "") grid[r][c] = ABC[randInt(0, ABC.length - 1)];
    }
  }

  function renderGrid() {
    const frag = document.createDocumentFragment();
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.textContent = grid[r][c];
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);
        cell.setAttribute("role", "gridcell");
        cell.tabIndex = -1;
        frag.appendChild(cell);
        cellEls[r][c] = cell;
      }
    }
    gridEl.replaceChildren(frag);
  }

  renderLista();
  renderGrid();

  // === Selección con puntero (valida mientras arrastras) ===
  let seleccionando = false;
  let selStart: Coord | null = null;
  let lastPreview: Coord[] = [];

  gridEl.addEventListener("pointerdown", (ev) => {
    const cell = ev.target as HTMLElement;
    if (!cell.classList.contains("cell")) return;
    ev.preventDefault();
    seleccionando = true;
    selStart = getCoord(cell)!;
    clearPreview();
    cell.classList.add("active");
  });

  gridEl.addEventListener("pointermove", (ev) => {
    if (!seleccionando || !selStart) return;

    // Importante: cuando arrastras, el target puede NO ser la celda (por eso usamos elementFromPoint)
    const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
    if (!el || !el.classList || !el.classList.contains("cell")) return;
    const end = getCoord(el)!;

    // vista previa de la línea
    previewPath(selStart, end);

    // VALIDACIÓN EN TIEMPO REAL
    const path = linePath(selStart, end);
    if (!path) return;
    const palabraSel = path.map(({ r, c }) => grid[r][c]).join("");
    const palabraSelRev = [...palabraSel].reverse().join("");
    const objetivo = palabras.find((p) => !p.found && (p.clean === palabraSel || p.clean === palabraSelRev));
    if (objetivo) {
      confirmarSeleccion(path, objetivo);
      seleccionando = false;
      selStart = null;
      clearPreview();
      ping(`✅ ¡Bien! Encontraste: ${objetivo.display}`);
      if (palabras.every((p) => p.found)) ping("🎉 ¡Excelente! ¡Encontraste todas!");
    }
  });

  // Fallback: si suelta sin haber validado aún, intenta validar al final
  gridEl.addEventListener("pointerup", (ev) => {
    if (!seleccionando || !selStart) return;
    const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
    const end = el && el.classList.contains("cell") ? getCoord(el)! : selStart;
    finalizarSeleccion(selStart, end);
    seleccionando = false;
    selStart = null;
  });

  function getCoord(cell: HTMLElement): Coord | null {
    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    return Number.isFinite(r) && Number.isFinite(c) ? { r, c } : null;
  }

  function unitStep(v: number) {
    if (v === 0) return 0;
    return v > 0 ? 1 : -1;
  }

  function linePath(a: Coord, b: Coord): Coord[] | null {
    const dr = b.r - a.r;
    const dc = b.c - a.c;
    const adr = Math.abs(dr);
    const adc = Math.abs(dc);
    if (!(dr === 0 || dc === 0 || adr === adc)) return null;
    const steps = Math.max(adr, adc);
    const sr = unitStep(dr);
    const sc = unitStep(dc);
    const path: Coord[] = [];
    for (let i = 0; i <= steps; i++) {
      path.push({ r: a.r + sr * i, c: a.c + sc * i });
    }
    return path;
  }

  function previewPath(a: Coord, b: Coord) {
    clearPreview();
    const path = linePath(a, b);
    if (!path) return;
    lastPreview = path;
    for (const { r, c } of path) {
      cellEls[r][c].classList.add("preview");
    }
  }

  function clearPreview() {
    if (lastPreview.length) {
      for (const { r, c } of lastPreview) cellEls[r][c].classList.remove("preview");
      lastPreview = [];
    }
    gridEl.querySelectorAll(".cell.active").forEach((el) => el.classList.remove("active"));
  }

  function confirmarSeleccion(path: Coord[], objetivo: Palabra) {
    objetivo.found = true;
    for (const { r, c } of path) cellEls[r][c].classList.add("found");
    renderLista();
    actualizarContador();
  }

  function finalizarSeleccion(a: Coord, b: Coord) {
    const path = linePath(a, b);
    clearPreview();
    if (!path) { ping("Selecciona en línea recta (horizontal, vertical o diagonal)."); return; }
    const palabraSel = path.map(({ r, c }) => grid[r][c]).join("");
    const palabraSelRev = [...palabraSel].reverse().join("");
    const objetivo = palabras.find((p) => !p.found && (p.clean === palabraSel || p.clean === palabraSelRev));
    if (objetivo) {
      confirmarSeleccion(path, objetivo);
      if (palabras.every((p) => p.found)) ping("🎉 ¡Excelente! ¡Encontraste todas!");
      else ping(`✅ ¡Bien! Encontraste: ${objetivo.display}`);
    } else {
      for (const { r, c } of path) {
        const el = cellEls[r][c];
        el.animate(
          [{ transform: "translateX(0px)" }, { transform: "translateX(-2px)" }, { transform: "translateX(2px)" }, { transform: "translateX(0px)" }],
          { duration: 120, iterations: 1 }
        );
      }
      ping("❌ Esa selección no coincide con ninguna palabra pendiente.");
    }
  }

  function actualizarContador() {
    foundCountEl.textContent = String(palabras.filter((p) => p.found).length);
  }

  function ping(msg: string) {
    toastEl.textContent = msg;
    toastEl.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 1 }, { opacity: 0 }], { duration: 1400, easing: "ease" });
  }

  btnReiniciar.addEventListener("click", () => {
    start(root);
  });
}
