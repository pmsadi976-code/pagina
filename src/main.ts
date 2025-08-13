// src/main.ts
import "./style.css"; // o "./style.css" donde tengas @tailwind

type RouteKey = "#splash" | "#menu" | "#inicial" | "#primaria" | "#secundaria";

const routes = {
  "#inicial": () => import("./games/inicial"),
  "#primaria": () => import("./games/primaria"),
  "#secundaria": () => import("./games/secundaria"),
} as const;

const mount = document.getElementById("app")!;

function clearMount() {
  mount.replaceChildren();
}

function fadeIn(el: HTMLElement) {
  el.classList.add("opacity-0");
  requestAnimationFrame(() => {
    el.classList.add("transition", "duration-500");
    el.classList.remove("opacity-0");
    el.classList.add("opacity-100");
  });
}

/** Splash inspirado en el boceto */
function renderSplash() {
  clearMount();

  const wrap = document.createElement("div");
  wrap.className = "min-h-screen bg-slate-50 flex items-center justify-center p-6";

  wrap.innerHTML = `
    <section class="relative w-full max-w-md aspect-[3/4] bg-white rounded-3xl border-[6px] border-slate-800 shadow-xl overflow-hidden">
      <!-- Flecha/Entrar -->
      <button id="enterBtn"
        class="absolute top-3 right-3 z-10 rounded-full border-[4px] border-slate-800 p-2 bg-white hover:bg-slate-100 active:scale-95 transition"
        aria-label="Entrar">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M7 5l5 5-5 5" />
        </svg>
      </button>

      <!-- marco interior (sin capturar clicks) -->
      <div class="absolute inset-3 rounded-2xl border-[4px] border-slate-800 pointer-events-none"></div>

      <h1 class="absolute w-full top-1/3 -translate-y-1/2 text-center text-3xl font-bold text-slate-800">
        “Ecoranger”
      </h1>

      <!-- Dibujo -->
      <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 360 480" fill="none" stroke="currentColor" stroke-width="4">
        <circle cx="56" cy="56" r="18" />
        <line x1="56" y1="20" x2="56" y2="6" />
        <line x1="56" y1="92" x2="56" y2="106" />
        <line x1="20" y1="56" x2="6" y2="56" />
        <line x1="92" y1="56" x2="106" y2="56" />
        <line x1="32" y1="32" x2="22" y2="22" />
        <line x1="80" y1="32" x2="90" y2="22" />
        <line x1="32" y1="80" x2="22" y2="90" />
        <line x1="80" y1="80" x2="90" y2="90" />
        <path d="M320 40 q10 30 -10 60 q24 10 28 24 q-18 12 -42 14 q26 12 26 26 q-20 10 -44 8 q20 20 18 34 q-28 10 -48 2 q0 120 0 180" />
        <path d="M320 360 q-10 30 -6 80" />
        <circle cx="120" cy="300" r="16" />
        <line x1="120" y1="316" x2="120" y2="356" />
        <line x1="120" y1="328" x2="100" y2="340" />
        <line x1="120" y1="328" x2="140" y2="340" />
        <line x1="120" y1="356" x2="106" y2="382" />
        <line x1="120" y1="356" x2="138" y2="382" />
        <circle cx="220" cy="360" r="10" />
        <line x1="230" y1="365" x2="238" y2="372" />
        <line x1="210" y1="365" x2="202" y2="372" />
        <line x1="218" y1="370" x2="218" y2="384" />
      </svg>

      <div class="absolute bottom-4 w-full text-center text-slate-500 text-sm">
        Toca la flecha para continuar
      </div>
    </section>
  `;

  mount.appendChild(wrap);
  fadeIn(wrap);

  const go = () => {
    localStorage.setItem("seenSplash", "1");
    location.hash = "#menu";
    // por si el navegador no dispara hashchange inmediatamente:
    setTimeout(renderRoute, 0);
  };
  wrap.querySelector<HTMLButtonElement>("#enterBtn")!.addEventListener("click", go);
  window.addEventListener("keydown", (e) => { if (e.key === "Enter") go(); }, { once: true });
}

// Limpieza de intervals cuando cambiamos de vista
let disposers: Array<() => void> = [];
function clearDisposers() {
  disposers.forEach((fn) => fn());
  disposers = [];
}

// SVGs muy simples (estilo boceto). Puedes mejorarlos cuando quieras.
function mascotSVG(kind: "mono" | "tucan" | "jaguar" | "guia"): string {
  switch (kind) {
    case "mono":
      return `
      <svg viewBox="0 0 96 96" class="w-20 h-20">
        <g fill="none" stroke="currentColor" stroke-width="3">
          <circle cx="48" cy="40" r="20" fill="#a97142"/>
          <circle cx="28" cy="42" r="8" fill="#a97142"/>
          <circle cx="68" cy="42" r="8" fill="#a97142"/>
          <circle cx="42" cy="38" r="2" fill="#1f2937"/>
          <circle cx="54" cy="38" r="2" fill="#1f2937"/>
          <path d="M42 48 q6 6 12 0" stroke="#1f2937" />
          <path d="M60 62 q10 10 16 2" />
        </g>
      </svg>`;
    case "tucan":
      return `
      <svg viewBox="0 0 96 96" class="w-20 h-20">
        <g fill="none" stroke="currentColor" stroke-width="3">
          <circle cx="40" cy="44" r="14" fill="#111827"/>
          <path d="M40 44 q30 -24 36 0 q-20 10 -36 0" fill="#f59e0b" stroke="#f59e0b"/>
          <circle cx="44" cy="40" r="2" fill="#fff"/>
          <path d="M30 58 q10 6 22 6" />
        </g>
      </svg>`;
    case "jaguar":
      return `
      <svg viewBox="0 0 96 96" class="w-20 h-20">
        <g fill="none" stroke="currentColor" stroke-width="3">
          <circle cx="48" cy="44" r="18" fill="#fbbf24"/>
          <circle cx="36" cy="32" r="6" fill="#fbbf24"/>
          <circle cx="60" cy="32" r="6" fill="#fbbf24"/>
          <circle cx="44" cy="42" r="2" fill="#111827"/>
          <circle cx="52" cy="42" r="2" fill="#111827"/>
          <path d="M44 50 q4 3 8 0" stroke="#111827"/>
          <!-- manchas -->
          <circle cx="36" cy="44" r="2" fill="#111827"/>
          <circle cx="58" cy="48" r="2" fill="#111827"/>
          <circle cx="50" cy="34" r="2" fill="#111827"/>
        </g>
      </svg>`;
    default: // guia
      return `
      <svg viewBox="0 0 96 96" class="w-20 h-20">
        <g fill="none" stroke="currentColor" stroke-width="3">
          <!-- tocado -->
          <path d="M32 26 q16 -12 32 0" />
          <path d="M40 20 v-8" />
          <path d="M48 18 v-10" />
          <path d="M56 20 v-8" />
          <!-- cabeza -->
          <circle cx="48" cy="32" r="10" fill="#fde68a"/>
          <!-- cuerpo -->
          <path d="M48 42 v22" />
          <path d="M48 52 l-10 8" />
          <path d="M48 52 l10 8" />
          <path d="M48 64 l-8 12" />
          <path d="M48 64 l8 12" />
        </g>
      </svg>`;
  }
}

type MascotSpec = {
  kind: "mono" | "tucan" | "jaguar" | "guia";
  name: string;
  animClass: string;  // tailwind animation
  messages: string[];
};

// monta los personajes y hace rotar mensajes
function setupMascots(host: HTMLElement) {
  const specs: MascotSpec[] = [
    {
      kind: "mono",
      name: "Mono",
      animClass: "animate-bounce",
      messages: [
        "Cada árbol es un hogar.",
        "Junta tu basura y recíclala.",
        "La selva te escucha: cuídala.",
      ],
    },
    {
      kind: "tucan",
      name: "Tucán",
      animClass: "animate-pulse",
      messages: [
        "Habla por quienes no tienen voz.",
        "Menos ruido, más vida.",
        "Comparte conocimiento, protege más.",
      ],
    },
    {
      kind: "jaguar",
      name: "Jaguar",
      animClass: "animate-pulse",
      messages: [
        "La fuerza es proteger, no destruir.",
        "Camina sin dejar rastro.",
        "Respetar es el primer paso.",
      ],
    },
    {
      kind: "guia",
      name: "Guía",
      animClass: "animate-bounce",
      messages: [
        "Nuestra cultura vive en la selva.",
        "Aprende, respeta y comparte.",
        "Hoy sembramos; mañana agradecemos.",
      ],
    },
  ];

  const intervals: number[] = [];

  specs.forEach((s) => {
    const card = document.createElement("div");
    card.className =
      "relative w-40 h-40 rounded-2xl bg-white shadow flex flex-col items-center justify-end pb-3";

    // dibujo
    const svgWrap = document.createElement("div");
    svgWrap.className = `text-slate-800 ${s.animClass}`;
    svgWrap.innerHTML = mascotSVG(s.kind);
    card.appendChild(svgWrap);

    // nombre
    const caption = document.createElement("div");
    caption.className = "text-sm font-medium text-slate-800 mt-1";
    caption.textContent = s.name;
    card.appendChild(caption);

    // burbuja
    const bubble = document.createElement("div");
    bubble.className =
      "absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-44 bg-white text-slate-700 text-center text-sm rounded-2xl shadow px-3 py-2 transition-opacity";
    bubble.style.pointerEvents = "auto";
    const tail = document.createElement("div");
    tail.className = "absolute left-1/2 -translate-x-1/2 -bottom-1 w-3 h-3 bg-white rotate-45 shadow";
    bubble.appendChild(tail);
    card.appendChild(bubble);

    // rotación de mensajes
    let i = 0;
    const setMsg = (j: number) => {
      bubble.style.opacity = "0";
      setTimeout(() => {
        bubble.textContent = s.messages[j];
        bubble.appendChild(tail); // reanclar cola
        bubble.style.opacity = "1";
      }, 150);
    };
    setMsg(i);
    const id = window.setInterval(() => {
      i = (i + 1) % s.messages.length;
      setMsg(i);
    }, 3500);
    intervals.push(id);

    // click para avanzar mensaje
    card.addEventListener("click", () => {
      i = (i + 1) % s.messages.length;
      setMsg(i);
    });

    host.appendChild(card);
  });

  // devuelve una función para limpiar intervals cuando salgamos del menú
  const dispose = () => intervals.forEach((id) => clearInterval(id));
  disposers.push(dispose);
}


function renderMenu() {
  // limpiar pantalla y cualquier interval previo
  clearMount();
  clearDisposers();

  const div = document.createElement("div");
  div.className =
    "min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 p-6";

  div.innerHTML = `
    <h2 class="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800 text-center">
      Juegos educativos
    </h2>
    <p class="text-slate-600 text-center mb-12 sm:mb-16">Elige un nivel para empezar</p>

    <!-- Franja de personajes -->
    <div id="mascotRow" class="w-full max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4"></div>

    <!-- Tarjetas de niveles -->
    <div class="grid gap-4 grid-cols-1 sm:grid-cols-3 w-full max-w-4xl">
      <a href="#inicial" class="rounded-2xl shadow p-6 bg-white hover:shadow-md transition text-center">
        <div class="text-xl font-semibold mb-2">Inicial</div>
        <div class="text-slate-500 text-sm">Habilidad motora y atención</div>
      </a>
      <a href="#primaria" class="rounded-2xl shadow p-6 bg-white hover:shadow-md transition text-center">
        <div class="text-xl font-semibold mb-2">Primaria</div>
        <div class="text-slate-500 text-sm">Plataformas y coordinación</div>
      </a>
      <a href="#secundaria" class="rounded-2xl shadow p-6 bg-white hover:shadow-md transition text-center">
        <div class="text-xl font-semibold mb-2">Secundaria</div>
        <div class="text-slate-500 text-sm">Reflejos y evasión</div>
      </a>
    </div>
  `;

  mount.appendChild(div);

  // montar personajes con mensajes
  const host = div.querySelector<HTMLDivElement>("#mascotRow")!;
  setupMascots(host);
}


async function renderRoute() {
  const hash = (location.hash || "#splash") as RouteKey;

  // Mostrar splash solo la primera vez
  if (hash === "#splash" || (!location.hash && !localStorage.getItem("seenSplash"))) {
    renderSplash();
    return;
  }

  if (hash === "#menu") {
    renderMenu();
    return;
  }

  // Juegos
  clearMount();

  const root = document.createElement("div");
  root.id = "game-root";
  root.className = "min-h-screen flex items-center justify-center p-4 bg-slate-50";
  mount.appendChild(root);

  const back = document.createElement("a");
  back.href = "#menu";
  back.textContent = "← Volver";
  back.className =
    "fixed top-4 left-4 px-3 py-1 rounded-xl shadow bg-white/90 hover:bg-white";
  mount.appendChild(back);

  const loader = document.createElement("div");
  loader.textContent = "Cargando juego…";
  loader.className = "absolute top-20 left-1/2 -translate-x-1/2 text-slate-500";
  mount.appendChild(loader);

  try {
    
    const mod = await routes[hash]();
    loader.remove();
    (mod as { default: (el: HTMLElement) => void }).default(root);
  } catch (e) {
    loader.textContent = "Error al cargar el juego 😕";
    console.error(e);
  }
}

window.addEventListener("hashchange", renderRoute);
renderRoute();
