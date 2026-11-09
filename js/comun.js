const Sesion = {
  clave: "sockbuster-token",

  obtenerToken() {
    try {
      return localStorage.getItem(this.clave);
    } catch (e) {
      return null;
    }
  },

  guardar(token) {
    try {
      localStorage.setItem(this.clave, token);
    } catch (e) {}
  },

  cerrar() {
    try {
      localStorage.removeItem(this.clave);
    } catch (e) {}
  },

  usuario() {
    const token = this.obtenerToken();
    if (!token) return null;
    try {
      const payload = JSON.parse(desdeBase64Url(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        this.cerrar();
        return null;
      }
      return payload;
    } catch (e) {
      return null;
    }
  },
};

const CarritoLocal = {
  clave: "sockbuster-carrito",

  cargar() {
    try {
      const guardado = JSON.parse(localStorage.getItem(this.clave));
      if (guardado) return new Carrito(guardado.id, guardado.items);
    } catch (e) {}
    return new Carrito("C-" + Date.now().toString(36));
  },

  guardar(carrito) {
    try {
      localStorage.setItem(this.clave, JSON.stringify(carrito));
    } catch (e) {}
  },

  unidades() {
    return this.cargar().items.reduce((s, i) => s + i.cantidad, 0);
  },
};

function escaparHTML(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

let contadorSVG = 0;

function motivoSVG(motivo, acento, franja) {
  const motivos = {
    estrellas: `<path d="M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6z" fill="${acento}"/><circle cx="3" cy="17" r="1" fill="${acento}"/>`,
    rayos: `<path d="M0 14 L5 6 L10 14 L15 6 L20 14" fill="none" stroke="${acento}" stroke-width="2.5"/>`,
    rayas: `<rect x="0" y="0" width="20" height="5" fill="${acento}"/><rect x="0" y="10" width="20" height="3" fill="${franja}"/>`,
    cuadros: `<rect width="10" height="10" fill="${acento}" opacity=".8"/><rect x="10" y="10" width="10" height="10" fill="${acento}" opacity=".8"/>`,
    hexagonos: `<path d="M10 2 L17 6 L17 14 L10 18 L3 14 L3 6 Z" fill="none" stroke="${acento}" stroke-width="2.2"/><path d="M10 7 L13 9 L13 12 L10 14 L7 12 L7 9 Z" fill="${franja}"/>`,
    cristales: `<path d="M10 3 L14 10 L10 17 L6 10 Z" fill="${acento}" opacity=".9"/>`,
    copos: `<g stroke="${acento}" stroke-width="1.6" stroke-linecap="round"><path d="M10 4v12M4 10h12M6 6l8 8M14 6l-8 8"/></g>`,
    luces: `<path d="M0 6 Q10 14 20 6" fill="none" stroke="#111827" stroke-width="1"/><circle cx="5" cy="9" r="2.6" fill="${franja}"/><circle cx="15" cy="9" r="2.6" fill="${acento}"/>`,
    puntos: `<rect x="3" y="4" width="6" height="2.4" rx="1.2" fill="${acento}" transform="rotate(30 6 5)"/><rect x="11" y="13" width="6" height="2.4" rx="1.2" fill="${franja}" transform="rotate(-25 14 14)"/><rect x="13" y="3" width="5" height="2.2" rx="1.1" fill="#ffffff" transform="rotate(70 15 4)"/>`,
    hojas: `<ellipse cx="10" cy="10" rx="6" ry="3" fill="${acento}" transform="rotate(-35 10 10)"/><path d="M5 14 L15 6" stroke="${franja}" stroke-width="1"/>`,
    espiral: `<circle cx="10" cy="10" r="7" fill="none" stroke="${acento}" stroke-width="2"/><circle cx="10" cy="10" r="3.2" fill="none" stroke="${franja}" stroke-width="2"/>`,
  };
  return motivos[motivo] || motivos.rayas;
}

function calcetinSVG(foto, clases = "") {
  const [motivo, base, franja, acento] = String(foto).split(";");
  const id = "sk" + ++contadorSVG;
  const forma =
    "M45 8 H95 V100 C95 108 99 113 106 117 L124 128 C137 136 139 152 129 162 C120 171 106 170 96 164 L52 138 C40 131 45 120 45 110 Z";
  return `<svg viewBox="0 0 150 180" class="${clases}" role="img" aria-label="Ilustración del calcetín">
    <defs>
      <clipPath id="${id}c"><path d="${forma}"/></clipPath>
      <pattern id="${id}p" width="20" height="20" patternUnits="userSpaceOnUse">${motivoSVG(motivo, acento, franja)}</pattern>
    </defs>
    <ellipse cx="88" cy="172" rx="48" ry="5" fill="#000" opacity=".12"/>
    <g clip-path="url(#${id}c)">
      <rect width="150" height="180" fill="${base}"/>
      <rect y="28" width="150" height="152" fill="url(#${id}p)"/>
      <rect y="8" width="150" height="22" fill="${franja}"/>
      <rect y="13" width="150" height="3" fill="${acento}"/>
      <rect y="20" width="150" height="3" fill="${acento}"/>
      <circle cx="50" cy="134" r="19" fill="${franja}"/>
      <circle cx="128" cy="153" r="20" fill="${franja}"/>
    </g>
    <path d="${forma}" fill="none" stroke="#1b1035" stroke-width="3" stroke-linejoin="round"/>
  </svg>`;
}

function estrellasHTML(promedio, tamano = "text-base") {
  const llenas = Math.round(promedio);
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += `<span class="${i <= llenas ? "text-amarillo" : "text-slate-300"}">★</span>`;
  }
  return `<span class="${tamano} leading-none tracking-tight" aria-label="${promedio.toFixed(1)} de 5 estrellas">${html}</span>`;
}

function mostrarAviso(mensaje, tipo = "ok") {
  const contenedor = document.querySelector("dialog[open]") || document.body;
  let zona = contenedor.querySelector(".zona-avisos");
  if (!zona) {
    zona = document.createElement("div");
    zona.className = "zona-avisos fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm";
    contenedor.appendChild(zona);
  }
  const aviso = document.createElement("div");
  const colores = tipo === "error" ? "bg-rosa text-white" : "bg-tinta text-crema";
  aviso.className = `${colores} rounded-xl px-4 py-3 shadow-lg text-sm font-semibold`;
  aviso.setAttribute("role", "status");
  aviso.textContent = mensaje;
  zona.appendChild(aviso);
  setTimeout(() => aviso.remove(), 3200);
}

function renderEncabezado(activa) {
  const enlaces = [
    { id: "inicio", texto: "Inicio", href: "index.html" },
    { id: "catalogo", texto: "Catálogo", href: "catalogo.html" },
    { id: "diagramas", texto: "Arquitectura UML", href: "diagramas.html" },
  ];
  const usuario = Sesion.usuario();
  const unidades = CarritoLocal.unidades();
  const encabezado = document.getElementById("encabezado");
  encabezado.innerHTML = `
    <div class="bg-tinta text-crema">
      <div class="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
        <a href="index.html" class="flex items-center gap-2 shrink-0" aria-label="Sockbuster, inicio">
          <span class="grid place-items-center w-9 h-9 rounded-lg bg-amarillo text-tinta font-display text-lg -rotate-6">S</span>
          <span class="leading-none">
            <span class="block font-display text-lg tracking-wide text-amarillo">SOCKBUSTER</span>
            <span class="block text-[10px] uppercase tracking-[.3em] text-crema/70">Video &amp; Socks</span>
          </span>
        </a>
        <nav class="hidden md:flex items-center gap-1 ml-6" aria-label="Principal">
          ${enlaces
            .map(
              (e) =>
                `<a href="${e.href}" class="px-3 py-2 rounded-lg text-sm font-semibold ${
                  e.id === activa ? "bg-white/10 text-amarillo" : "text-crema/80 hover:text-white hover:bg-white/5"
                }">${e.texto}</a>`
            )
            .join("")}
        </nav>
        <div class="ml-auto flex items-center gap-2">
          ${
            usuario
              ? `<span class="hidden sm:inline text-xs text-crema/80">Hola, <b class="text-crema">${escaparHTML(usuario.nombre.split(" ")[0])}</b>${
                  usuario.rol === Rol.ADMIN ? ' <span class="ml-1 px-1.5 py-0.5 rounded bg-turquesa text-tinta font-bold">ADMIN</span>' : ""
                }</span>
                 <button id="btn-salir" class="text-xs font-semibold px-3 py-2 rounded-lg border border-white/20 hover:bg-white/10">Salir</button>`
              : `<a href="catalogo.html#ingresar" id="btn-ingresar" class="text-xs font-semibold px-3 py-2 rounded-lg border border-white/20 hover:bg-white/10">Ingresar</a>`
          }
          <a href="catalogo.html#carrito" id="btn-carrito" class="relative grid place-items-center w-10 h-10 rounded-lg bg-rosa hover:bg-rosa/90" aria-label="Ver carrito">
            <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 1.9-1.4L21 8H6"/><circle cx="10" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/></svg>
            <span id="contador-carrito" class="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-amarillo text-tinta text-[11px] font-bold grid place-items-center ${
              unidades ? "" : "hidden"
            }">${unidades}</span>
          </a>
        </div>
      </div>
      <nav class="md:hidden flex border-t border-white/10" aria-label="Principal móvil">
        ${enlaces
          .map(
            (e) =>
              `<a href="${e.href}" class="flex-1 text-center py-2.5 text-xs font-semibold ${
                e.id === activa ? "text-amarillo bg-white/5" : "text-crema/80"
              }">${e.texto}</a>`
          )
          .join("")}
      </nav>
    </div>
    <div class="h-1.5 bg-[repeating-linear-gradient(90deg,#ff3d7f_0_40px,#ffc83d_40px_80px,#19c3b1_80px_120px)]"></div>`;

  const salir = document.getElementById("btn-salir");
  if (salir)
    salir.addEventListener("click", () => {
      Sesion.cerrar();
      mostrarAviso("Sesión cerrada");
      setTimeout(() => location.reload(), 500);
    });
}

function actualizarContadorCarrito() {
  const contador = document.getElementById("contador-carrito");
  if (!contador) return;
  const unidades = CarritoLocal.unidades();
  contador.textContent = unidades;
  contador.classList.toggle("hidden", unidades === 0);
}

function renderPie() {
  const pie = document.getElementById("pie");
  if (!pie) return;
  pie.innerHTML = `
    <div class="bg-tinta text-crema/70 text-sm">
      <div class="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <p><span class="font-display text-amarillo">SOCKBUSTER</span> · Prototipo académico · TI3025 Modelamiento de soluciones informáticas · INACAP Punta Arenas</p>
        <p>Mauricio Aravena · Benjamin Aguayo · Oscar Ojeda</p>
      </div>
    </div>`;
}
