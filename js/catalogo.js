const filtros = {
  coleccion: new URLSearchParams(location.search).get("coleccion") || "",
  texto: "",
  talla: "",
  precioMax: 0,
  orden: "nombre",
};

let carrito = CarritoLocal.cargar();
let pasoCarrito = "items";
let ultimoPedido = null;
let colecciones = [];
let esperaBusqueda = null;

const $ = (sel) => document.querySelector(sel);

function etiquetaStock(stock) {
  if (stock === 0) return '<span class="px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-bold">Agotado</span>';
  if (stock <= 5) return `<span class="px-2 py-0.5 rounded-full bg-rosa/15 text-rosa text-xs font-bold">¡Quedan ${stock}!</span>`;
  return `<span class="px-2 py-0.5 rounded-full bg-turquesa/15 text-teal-700 text-xs font-bold">${stock} en stock</span>`;
}

function renderChips() {
  const opciones = [{ id: "", nombre: "Todas" }, ...colecciones];
  $("#chips-colecciones").innerHTML = opciones
    .map(
      (c) => `<button data-coleccion="${c.id}" aria-pressed="${filtros.coleccion === c.id}"
        class="px-4 py-2 rounded-full text-sm font-bold border-2 border-tinta ${
          filtros.coleccion === c.id ? "bg-tinta text-amarillo" : "bg-white hover:bg-crema"
        }">${escaparHTML(c.nombre)}</button>`
    )
    .join("");
}

function tarjeta(c) {
  const agotado = c.stock === 0;
  const color = colorColeccion(c.coleccionId);
  return `<article class="group flex flex-col rounded-2xl bg-white border-2 border-tinta shadow-[4px_4px_0_#1b1035] hover:-translate-y-1 hover:shadow-[6px_8px_0_#1b1035] transition overflow-hidden">
    <span class="h-2" style="background:${color.fuerte}"></span>
    <button data-ficha="${c.sku}" class="relative h-52 grid place-items-center overflow-hidden" style="background:linear-gradient(160deg,${color.fondo},#fff6e9)" aria-label="Ver ficha de ${escaparHTML(c.nombre)}">
      ${calcetinSVG(c.foto, "h-40 w-auto group-hover:-rotate-6 group-hover:scale-105 transition duration-300 " + (agotado ? "grayscale opacity-50" : ""))}
      <span class="absolute top-3 left-3 px-2 py-1 rounded-md text-white text-[10px] font-bold uppercase tracking-wider" style="background:${color.fuerte}">${escaparHTML(c.coleccion.nombre)}</span>
      ${c.totalResenas ? `<span class="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/90 text-xs font-bold">★ ${c.promedio.toFixed(1)}</span>` : ""}
      ${agotado ? '<span class="absolute inset-x-0 top-1/2 -translate-y-1/2 -rotate-6 bg-tinta text-crema font-display text-center py-1.5 tracking-widest">AGOTADO</span>' : ""}
      <span class="absolute bottom-3 left-1/2 -translate-x-1/2 translate-y-10 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition px-3 py-1 rounded-full bg-tinta text-crema text-xs font-bold">Ver ficha</span>
    </button>
    <div class="flex-1 flex flex-col p-4 border-t-2 border-tinta">
      <div class="flex items-start justify-between gap-2">
        <h2 class="font-display text-lg leading-tight">${escaparHTML(c.nombre)}</h2>
        <p class="font-extrabold text-lg shrink-0">${formatoCLP(c.precio)}</p>
      </div>
      <p class="text-sm text-slate-600 mt-1">${escaparHTML(c.tematica.titulo)} · ${c.tematica.tipo} ${c.tematica.anio}</p>
      <div class="flex items-center gap-2 mt-2">
        ${estrellasHTML(c.promedio)}
        <span class="text-xs text-slate-500">${c.totalResenas ? `${c.totalResenas} ${c.totalResenas === 1 ? "reseña" : "reseñas"}` : "Sin reseñas"}</span>
      </div>
      <div class="flex flex-wrap items-center gap-1.5 mt-3">
        ${etiquetaStock(c.stock)}
        ${c.tallas.map((t) => `<span class="px-2 py-0.5 rounded-full border border-slate-300 text-xs font-semibold">${t}</span>`).join("")}
      </div>
      <div class="mt-auto pt-4 grid grid-cols-[1fr_auto] gap-2">
        <select data-talla="${c.sku}" class="rounded-lg border-2 border-slate-200 px-2 py-2 text-sm bg-white" ${agotado ? "disabled" : ""} aria-label="Talla para ${escaparHTML(c.nombre)}">
          ${c.tallas.map((t) => `<option ${t === filtros.talla ? "selected" : ""}>${t}</option>`).join("")}
        </select>
        <button data-agregar="${c.sku}" ${agotado ? "disabled" : ""}
          class="px-4 py-2 rounded-lg bg-rosa text-white text-sm font-bold hover:bg-rosa/90 active:scale-95 transition disabled:bg-slate-300 disabled:cursor-not-allowed">Agregar</button>
      </div>
    </div>
  </article>`;
}

function hayFiltros() {
  return Boolean(filtros.coleccion || filtros.texto || filtros.talla || filtros.precioMax || filtros.orden !== "nombre");
}

function limpiarFiltros() {
  Object.assign(filtros, { coleccion: "", texto: "", talla: "", precioMax: 0, orden: "nombre" });
  $("#filtro-texto").value = "";
  $("#filtro-talla").value = "";
  $("#filtro-precio").value = 10000;
  $("#valor-precio").textContent = "sin límite";
  $("#filtro-orden").value = "nombre";
  renderChips();
  cargarCatalogo();
}

async function cargarCatalogo() {
  const respuesta = await ApiGateway.solicitar("GET", "/catalogo", filtros);
  const lista = respuesta.data;
  $("#conteo").textContent = `${lista.length} ${lista.length === 1 ? "modelo" : "modelos"}`;
  $("#btn-limpiar").classList.toggle("hidden", !hayFiltros());
  $("#grilla").innerHTML = lista.length
    ? lista.map(tarjeta).join("")
    : `<div class="col-span-full rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
         <p class="font-display text-xl">No hay calcetines con esos filtros</p>
         <p class="text-slate-600 mt-1">Prueba con otra talla o sube el precio máximo.</p>
         <button data-limpiar class="mt-4 px-5 py-2 rounded-lg bg-tinta text-crema font-bold">Limpiar filtros</button>
       </div>`;
}

function agregarAlCarrito(sku, talla, cantidad = 1) {
  const calcetin = DB.calcetines.find((c) => c.sku === sku);
  if (!calcetin || !talla) return;
  carrito = CarritoLocal.cargar();
  const enCarrito = carrito.items.filter((i) => i.sku === sku).reduce((s, i) => s + i.cantidad, 0);
  const disponibles = calcetin.stock - enCarrito;
  if (disponibles <= 0) {
    const unidades = calcetin.stock === 1 ? "la única unidad disponible" : `las ${calcetin.stock} unidades disponibles`;
    mostrarAviso(`Ya tienes en el carrito ${unidades} de ${calcetin.nombre}`, "error");
    return;
  }
  if (cantidad > disponibles) {
    mostrarAviso(`Solo puedes agregar ${disponibles} ${disponibles === 1 ? "unidad" : "unidades"} más de ${calcetin.nombre}`, "error");
    return;
  }
  carrito.agregar(calcetin, talla, cantidad);
  CarritoLocal.guardar(carrito);
  actualizarContadorCarrito();
  mostrarAviso(`${calcetin.nombre} (${talla}) agregado al carrito`);
}

async function abrirFicha(sku) {
  const [producto, resenas] = await Promise.all([
    ApiGateway.solicitar("GET", `/calcetines/${sku}`),
    ApiGateway.solicitar("GET", `/resenas/${sku}`),
  ]);
  if (producto.status !== 200) return mostrarAviso(producto.error, "error");
  const c = producto.data;
  const usuario = Sesion.usuario();
  const agotado = c.stock === 0;

  $("#ficha-contenido").innerHTML = `
    <div class="grid md:grid-cols-2">
      <div class="relative bg-[linear-gradient(135deg,#fff6e9,#ffe4ef)] grid place-items-center p-6 min-h-[260px]">
        ${calcetinSVG(c.foto, "h-56 w-auto " + (agotado ? "grayscale opacity-60" : ""))}
        <span class="absolute top-4 left-4 px-2 py-1 rounded-md bg-tinta text-crema text-[10px] font-bold uppercase tracking-wider">${escaparHTML(c.coleccion.nombre)}</span>
      </div>
      <div class="p-6">
        <div class="flex justify-between items-start gap-3">
          <div>
            <p class="text-xs font-bold text-slate-500">${c.sku}</p>
            <h2 class="font-display text-2xl leading-tight">${escaparHTML(c.nombre)}</h2>
          </div>
          <button data-cerrar class="w-9 h-9 rounded-lg hover:bg-slate-100 text-xl shrink-0" aria-label="Cerrar ficha">×</button>
        </div>
        <p class="text-slate-600 mt-1">Inspirado en <b class="text-tinta">${escaparHTML(c.tematica.titulo)}</b> (${c.tematica.tipo}, ${c.tematica.anio})</p>
        <div class="flex items-center gap-2 mt-2">${estrellasHTML(c.promedio, "text-lg")}<span class="text-sm text-slate-500">${
          c.totalResenas ? `${c.promedio.toFixed(1)} de 5 · ${c.totalResenas} ${c.totalResenas === 1 ? "reseña" : "reseñas"}` : "Sin reseñas aún"
        }</span></div>
        <p class="font-extrabold text-3xl mt-4">${formatoCLP(c.precio)}</p>
        <div class="mt-2">${etiquetaStock(c.stock)}</div>
        <div class="mt-4 grid grid-cols-[1fr_90px] gap-2">
          <label class="text-sm font-semibold">Talla
            <select id="ficha-talla" class="mt-1 w-full rounded-lg border-2 border-slate-200 px-2 py-2 bg-white" ${agotado ? "disabled" : ""}>
              ${c.tallas.map((t) => `<option>${t}</option>`).join("")}
            </select>
          </label>
          <label class="text-sm font-semibold">Cantidad
            <input id="ficha-cantidad" type="number" min="1" max="${Math.max(c.stock, 1)}" value="1" class="mt-1 w-full rounded-lg border-2 border-slate-200 px-2 py-2" ${agotado ? "disabled" : ""}>
          </label>
        </div>
        <button id="ficha-agregar" ${agotado ? "disabled" : ""} class="mt-3 w-full py-3 rounded-xl bg-rosa text-white font-bold hover:bg-rosa/90 disabled:bg-slate-300">${
          agotado ? "Agotado" : "Agregar al carrito"
        }</button>
      </div>
    </div>
    <div class="border-t-2 border-tinta p-6">
      <p class="font-display text-lg">Reseñas de fanáticos</p>
      ${
        usuario && resenas.data.some((r) => r.usuarioId === usuario.sub)
          ? '<p class="mt-3 rounded-xl bg-crema p-4 text-sm">Ya publicaste tu reseña de este modelo. ¡Gracias!</p>'
          : usuario
          ? `<form id="form-resena" class="mt-3 rounded-xl bg-crema p-4 space-y-3" novalidate>
               <fieldset>
                 <legend class="text-sm font-semibold">Tu valoración</legend>
                 <div id="selector-estrellas" class="flex gap-1 mt-1 text-3xl leading-none">
                   ${[1, 2, 3, 4, 5]
                     .map((n) => `<button type="button" data-estrella="${n}" class="text-slate-300 hover:scale-110 transition" aria-label="${n} estrellas">★</button>`)
                     .join("")}
                 </div>
               </fieldset>
               <label class="block text-sm font-semibold">Comentario
                 <textarea name="comentario" rows="3" maxlength="400" placeholder="¿Qué te pareció el diseño y la calidad?" class="mt-1 w-full rounded-lg border-2 border-slate-200 px-3 py-2 bg-white"></textarea>
               </label>
               <p id="error-resena" class="hidden text-sm font-semibold text-rosa" role="alert"></p>
               <button class="px-5 py-2 rounded-lg bg-tinta text-crema font-bold">Publicar reseña</button>
             </form>`
          : `<div class="mt-3 rounded-xl bg-crema p-4 flex flex-wrap items-center justify-between gap-3">
               <p class="text-sm">Inicia sesión para dejar tu reseña.</p>
               <button id="ficha-ingresar" class="px-4 py-2 rounded-lg bg-tinta text-crema text-sm font-bold">Ingresar</button>
             </div>`
      }
      <ul class="mt-4 space-y-3">
        ${
          resenas.data.length
            ? resenas.data
                .map(
                  (r) => `<li class="rounded-xl border border-slate-200 p-4">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <p class="font-bold">${escaparHTML(r.autor)}</p>
                      <p class="text-xs text-slate-500">${r.fecha}</p>
                    </div>
                    <div class="mt-1">${estrellasHTML(r.estrellas)}</div>
                    <p class="mt-2 text-slate-700">${escaparHTML(r.comentario)}</p>
                  </li>`
                )
                .join("")
            : '<li class="text-sm text-slate-500">Todavía nadie opina sobre este modelo.</li>'
        }
      </ul>
    </div>`;

  const dialogo = $("#dlg-ficha");
  if (!dialogo.open) dialogo.showModal();

  const botonAgregar = $("#ficha-agregar");
  if (botonAgregar)
    botonAgregar.addEventListener("click", () => {
      const cantidad = parseInt($("#ficha-cantidad").value, 10);
      if (!Number.isInteger(cantidad) || cantidad < 1) return mostrarAviso("La cantidad debe ser 1 o más", "error");
      agregarAlCarrito(sku, $("#ficha-talla").value, cantidad);
    });

  const ingresar = $("#ficha-ingresar");
  if (ingresar)
    ingresar.addEventListener("click", () => {
      dialogo.close();
      abrirIngreso(() => abrirFicha(sku));
    });

  const formResena = $("#form-resena");
  if (formResena) {
    let estrellas = 0;
    const pintar = () =>
      formResena.querySelectorAll("[data-estrella]").forEach((b) => {
        b.classList.toggle("text-amarillo", Number(b.dataset.estrella) <= estrellas);
        b.classList.toggle("text-slate-300", Number(b.dataset.estrella) > estrellas);
      });
    formResena.querySelectorAll("[data-estrella]").forEach((b) =>
      b.addEventListener("click", () => {
        estrellas = Number(b.dataset.estrella);
        pintar();
      })
    );
    formResena.addEventListener("submit", async (e) => {
      e.preventDefault();
      const respuesta = await new Usuario(Sesion.usuario()).publicarResena({
        sku,
        estrellas,
        comentario: formResena.comentario.value,
      });
      if (respuesta.status !== 201) {
        $("#error-resena").textContent = respuesta.error;
        $("#error-resena").classList.remove("hidden");
        return;
      }
      mostrarAviso("¡Gracias por tu reseña!");
      await abrirFicha(sku);
      cargarCatalogo();
    });
  }
}

function renderCarrito() {
  const cuerpo = $("#carrito-cuerpo");
  const usuario = Sesion.usuario();

  if (pasoCarrito === "resumen" && ultimoPedido) {
    const p = ultimoPedido;
    cuerpo.innerHTML = `
      <div class="text-center">
        <p class="text-5xl">🧦</p>
        <p class="font-display text-xl mt-2">¡Pedido confirmado!</p>
        <p class="text-sm text-slate-600 mt-1">Guarda tu número de pedido</p>
        <p class="mt-3 inline-block px-4 py-2 rounded-xl bg-tinta text-amarillo font-mono font-bold text-lg tracking-wider">${p.id}</p>
      </div>
      <div class="mt-6 rounded-xl bg-white border-2 border-tinta p-4 text-sm">
        <ul class="space-y-2">
          ${p.items
            .map(
              (i) => `<li class="flex justify-between gap-3"><span>${i.cantidad} × ${escaparHTML(i.nombre)} <span class="text-slate-500">(${i.talla})</span></span><span class="font-semibold">${formatoCLP(
                i.cantidad * i.precioUnitario
              )}</span></li>`
            )
            .join("")}
        </ul>
        <div class="border-t border-slate-200 mt-3 pt-3 space-y-1">
          <p class="flex justify-between"><span>Subtotal</span><span>${formatoCLP(p.subtotal)}</span></p>
          <p class="flex justify-between"><span>Envío</span><span>${p.envio ? formatoCLP(p.envio) : "Gratis"}</span></p>
          <p class="flex justify-between font-extrabold text-base"><span>Total pagado</span><span>${formatoCLP(p.total)}</span></p>
        </div>
        <div class="border-t border-slate-200 mt-3 pt-3 text-xs text-slate-600 space-y-0.5">
          <p>Estado: <b class="text-teal-700">${p.estado}</b> · Autorización ${p.autorizacion}</p>
          <p>Cliente: ${escaparHTML(p.cliente.nombre)} · ${escaparHTML(p.cliente.email)}</p>
          <p>Fecha: ${new Date(p.fecha).toLocaleString("es-CL")}</p>
        </div>
      </div>
      <button data-paso="items" class="mt-5 w-full py-3 rounded-xl bg-rosa text-white font-bold">Seguir comprando</button>`;
    return;
  }

  if (carrito.items.length === 0) {
    pasoCarrito = "items";
    cuerpo.innerHTML = `<div class="text-center py-16">
        <p class="font-display text-xl">Tu carrito está vacío</p>
        <p class="text-slate-600 mt-1">Agrega un par desde el catálogo.</p>
        <button data-cerrar class="mt-5 px-5 py-2 rounded-lg bg-tinta text-crema font-bold">Ver catálogo</button>
      </div>`;
    return;
  }

  const subtotal = carrito.calcularTotal();
  const envio = subtotal >= 20000 ? 0 : 2990;
  const resumen = `
    <div class="rounded-xl bg-white border-2 border-tinta p-4 text-sm space-y-1">
      <p class="flex justify-between"><span>Subtotal</span><span>${formatoCLP(subtotal)}</span></p>
      <p class="flex justify-between"><span>Envío</span><span>${envio ? formatoCLP(envio) : "Gratis"}</span></p>
      ${envio ? `<p class="text-xs text-slate-500">Te faltan ${formatoCLP(20000 - subtotal)} para envío gratis.</p>` : ""}
      <p class="flex justify-between font-extrabold text-base pt-1"><span>Total</span><span>${formatoCLP(subtotal + envio)}</span></p>
    </div>`;

  if (pasoCarrito === "pago") {
    cuerpo.innerHTML = `
      <button data-paso="items" class="text-sm font-semibold underline underline-offset-4">← Volver al carrito</button>
      <p class="font-display text-lg mt-4">Pago simulado</p>
      <form id="form-pago" class="mt-3 space-y-3" novalidate>
        <label class="block text-sm font-semibold">Nombre del titular
          <input name="nombre" autocomplete="cc-name" value="${usuario ? escaparHTML(usuario.nombre) : ""}" class="mt-1 w-full rounded-lg border-2 border-slate-200 px-3 py-2 bg-white">
        </label>
        <label class="block text-sm font-semibold">Correo para el comprobante
          <input name="email" type="email" autocomplete="email" class="mt-1 w-full rounded-lg border-2 border-slate-200 px-3 py-2 bg-white">
        </label>
        <div class="grid grid-cols-[1fr_90px] gap-2">
          <label class="block text-sm font-semibold">N° de tarjeta
            <input name="tarjeta" inputmode="numeric" maxlength="19" placeholder="4111 1111 1111 1111" class="mt-1 w-full rounded-lg border-2 border-slate-200 px-3 py-2 bg-white font-mono">
          </label>
          <label class="block text-sm font-semibold">CVV
            <input name="cvv" inputmode="numeric" maxlength="3" placeholder="123" class="mt-1 w-full rounded-lg border-2 border-slate-200 px-3 py-2 bg-white font-mono">
          </label>
        </div>
        <p class="text-xs text-slate-500">Es una pasarela de prueba: no se cobra nada. Cualquier tarjeta de 16 dígitos se aprueba, salvo las que terminan en 0000, que se rechazan.</p>
        ${resumen}
        <p id="error-pago" class="hidden text-sm font-semibold text-rosa" role="alert"></p>
        <button id="btn-pagar" class="w-full py-3 rounded-xl bg-rosa text-white font-bold disabled:opacity-60">Pagar ${formatoCLP(subtotal + envio)}</button>
      </form>`;

    const form = $("#form-pago");
    form.tarjeta.addEventListener("input", () => {
      const digitos = form.tarjeta.value.replace(/\D/g, "").slice(0, 16);
      form.tarjeta.value = digitos.replace(/(\d{4})(?=\d)/g, "$1 ");
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const boton = $("#btn-pagar");
      boton.disabled = true;
      boton.textContent = "Procesando pago…";
      const respuesta = await carrito.checkout({
        nombre: form.nombre.value,
        email: form.email.value,
        tarjeta: form.tarjeta.value,
        cvv: form.cvv.value,
      });
      if (respuesta.status === 201) {
        ultimoPedido = respuesta.data;
        carrito = new Carrito("C-" + Date.now().toString(36));
        CarritoLocal.guardar(carrito);
        actualizarContadorCarrito();
        pasoCarrito = "resumen";
        renderCarrito();
        cargarCatalogo();
        if (!$("#admin").classList.contains("hidden")) renderInventario();
        return;
      }
      $("#error-pago").textContent = respuesta.error;
      $("#error-pago").classList.remove("hidden");
      boton.disabled = false;
      boton.textContent = `Pagar ${formatoCLP(subtotal + envio)}`;
    });
    return;
  }

  cuerpo.innerHTML = `
    <ul class="space-y-3">
      ${carrito.items
        .map((i, indice) => {
          const c = DB.calcetines.find((x) => x.sku === i.sku);
          return `<li class="flex gap-3 rounded-xl bg-white border border-slate-200 p-3">
            <div class="w-14 shrink-0">${c ? calcetinSVG(c.foto, "w-full h-auto") : ""}</div>
            <div class="flex-1 min-w-0">
              <p class="font-bold truncate">${escaparHTML(i.nombre)}</p>
              <p class="text-xs text-slate-500">Talla ${i.talla} · ${formatoCLP(i.precioUnitario)} c/u</p>
              <div class="flex items-center gap-2 mt-2">
                <button data-menos="${indice}" class="w-8 h-8 rounded-lg border-2 border-slate-200 font-bold" aria-label="Quitar una unidad">−</button>
                <span class="w-6 text-center font-bold" aria-live="polite">${i.cantidad}</span>
                <button data-mas="${indice}" class="w-8 h-8 rounded-lg border-2 border-slate-200 font-bold" aria-label="Agregar una unidad">+</button>
                <button data-quitar="${indice}" class="ml-auto text-xs font-semibold text-rosa">Quitar</button>
              </div>
            </div>
            <p class="font-extrabold shrink-0">${formatoCLP(i.subtotal())}</p>
          </li>`;
        })
        .join("")}
    </ul>
    <div class="mt-5">${resumen}</div>
    <button data-paso="pago" class="mt-4 w-full py-3 rounded-xl bg-rosa text-white font-bold">Ir a pagar</button>`;
}

function cambiarCantidad(indice, delta) {
  const item = carrito.items[indice];
  if (!item) return;
  const calcetin = DB.calcetines.find((c) => c.sku === item.sku);
  const totalSku = carrito.items.filter((i) => i.sku === item.sku).reduce((s, i) => s + i.cantidad, 0);
  if (delta > 0 && calcetin && totalSku + delta > calcetin.stock) {
    mostrarAviso(`Ya tienes ${calcetin.stock === 1 ? "la única unidad disponible" : "las " + calcetin.stock + " unidades disponibles"}`, "error");
    return;
  }
  carrito.modificarCantidad(item, delta === 0 ? 0 : item.cantidad + delta);
  CarritoLocal.guardar(carrito);
  actualizarContadorCarrito();
  renderCarrito();
}

function abrirCarrito() {
  carrito = CarritoLocal.cargar();
  if (pasoCarrito !== "resumen") pasoCarrito = "items";
  renderCarrito();
  $("#dlg-carrito").showModal();
}

let modoRegistro = false;
let despuesDeIngresar = null;

function abrirIngreso(callback = null) {
  despuesDeIngresar = callback;
  modoRegistro = false;
  actualizarModoIngreso();
  $("#dlg-ingresar").showModal();
}

function actualizarModoIngreso() {
  $("#ingresar-titulo").textContent = modoRegistro ? "Crear cuenta" : "Ingresar";
  $("#campo-nombre").classList.toggle("hidden", !modoRegistro);
  $("#btn-alternar-registro").textContent = modoRegistro ? "¿Ya tienes cuenta? Ingresa" : "¿No tienes cuenta? Regístrate";
  $("#error-ingresar").classList.add("hidden");
}

async function enviarIngreso(e) {
  e.preventDefault();
  const form = e.target;
  const respuesta = modoRegistro
    ? await ApiGateway.solicitar("POST", "/auth/registro", {
        nombre: form.nombre.value,
        email: form.email.value,
        password: form.password.value,
      })
    : await new Usuario({}).iniciarSesion(form.email.value, form.password.value);
  if (respuesta.status !== 200) {
    $("#error-ingresar").textContent = respuesta.error;
    $("#error-ingresar").classList.remove("hidden");
    return;
  }
  Sesion.guardar(respuesta.data.token);
  $("#dlg-ingresar").close();
  form.reset();
  renderEncabezado("catalogo");
  conectarEncabezado();
  mostrarAviso(`Bienvenido/a, ${respuesta.data.nombre.split(" ")[0]}`);
  prepararAdmin();
  if (despuesDeIngresar) despuesDeIngresar();
  despuesDeIngresar = null;
}

function prepararAdmin() {
  const usuario = Sesion.usuario();
  const esAdmin = usuario && usuario.rol === Rol.ADMIN;
  $("#admin").classList.toggle("hidden", !esAdmin);
  if (!esAdmin) return;

  $("#admin-coleccion").innerHTML = colecciones.map((c) => `<option value="${c.id}">${escaparHTML(c.nombre)}</option>`).join("");
  renderSelectorTematicas();
  renderVistaPrevia();
  renderInventario();
}

async function renderSelectorTematicas() {
  const tematicas = (await ApiGateway.solicitar("GET", "/tematicas")).data;
  $("#admin-tematica").innerHTML =
    tematicas.map((t) => `<option value="${t.id}">${escaparHTML(t.titulo)} (${t.tipo}, ${t.anio})</option>`).join("") +
    '<option value="nueva">+ Nueva película o serie…</option>';
}

function renderVistaPrevia() {
  const f = $("#form-nuevo");
  $("#vista-previa").innerHTML = calcetinSVG(
    `${f.motivo.value};${f.colorBase.value};${f.colorFranja.value};${f.colorAcento.value}`,
    "h-full w-auto py-2"
  );
}

function renderInventario() {
  $("#tabla-inventario").innerHTML = DB.calcetines
    .map((c) => {
      const t = DB.tematicas.find((x) => x.id === c.tematicaId);
      return `<tr>
        <td class="px-3 py-2"><p class="font-bold">${escaparHTML(c.nombre)}</p><p class="text-xs text-slate-500">${c.sku}</p></td>
        <td class="px-3 py-2 text-slate-600">${t ? escaparHTML(t.titulo) : "—"}</td>
        <td class="px-3 py-2"><input data-precio="${c.sku}" type="number" min="1000" step="10" value="${c.precio}" class="w-24 rounded-md border-2 border-slate-200 px-2 py-1" aria-label="Precio de ${escaparHTML(c.nombre)}"></td>
        <td class="px-3 py-2"><input data-stock="${c.sku}" type="number" min="0" value="${c.stock}" class="w-20 rounded-md border-2 border-slate-200 px-2 py-1" aria-label="Stock de ${escaparHTML(c.nombre)}"></td>
        <td class="px-3 py-2"><button data-guardar="${c.sku}" class="px-3 py-1.5 rounded-md bg-tinta text-crema text-xs font-bold">Guardar</button></td>
      </tr>`;
    })
    .join("");
}

async function guardarFila(sku) {
  const respuesta = await ApiGateway.solicitar("PATCH", `/admin/calcetines/${sku}`, {
    precio: parseInt(document.querySelector(`[data-precio="${sku}"]`).value, 10),
    stock: parseInt(document.querySelector(`[data-stock="${sku}"]`).value, 10),
  });
  if (respuesta.status !== 200) return mostrarAviso(respuesta.error, "error");
  mostrarAviso(`${respuesta.data.nombre} actualizado`);
  cargarCatalogo();
}

async function registrarModelo(e) {
  e.preventDefault();
  const f = e.target;
  const respuesta = await ApiGateway.solicitar("POST", "/admin/calcetines", {
    nombre: f.nombre.value,
    coleccionId: f.coleccionId.value,
    tematicaId: f.tematicaId.value,
    nuevaTematica: { titulo: f.tituloTematica.value, tipo: f.tipoTematica.value, anio: parseInt(f.anioTematica.value, 10) },
    precio: parseInt(f.precio.value, 10),
    stock: parseInt(f.stock.value, 10),
    tallas: [...f.querySelectorAll('[name="tallas"]:checked')].map((x) => x.value),
    motivo: f.motivo.value,
    colorBase: f.colorBase.value,
    colorFranja: f.colorFranja.value,
    colorAcento: f.colorAcento.value,
  });
  const error = $("#error-nuevo");
  if (respuesta.status !== 201) {
    error.textContent = respuesta.error;
    error.classList.remove("hidden");
    return;
  }
  error.classList.add("hidden");
  f.reset();
  $("#nueva-tematica").classList.add("hidden");
  mostrarAviso(`${respuesta.data.nombre} registrado como ${respuesta.data.sku}`);
  await renderSelectorTematicas();
  renderVistaPrevia();
  renderInventario();
  cargarCatalogo();
}

function conectarEncabezado() {
  const botonCarrito = $("#btn-carrito");
  if (botonCarrito)
    botonCarrito.addEventListener("click", (e) => {
      e.preventDefault();
      abrirCarrito();
    });
  const botonIngresar = $("#btn-ingresar");
  if (botonIngresar)
    botonIngresar.addEventListener("click", (e) => {
      e.preventDefault();
      abrirIngreso();
    });
}

function conectarEventos() {
  $("#chips-colecciones").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-coleccion]");
    if (!chip) return;
    filtros.coleccion = chip.dataset.coleccion;
    renderChips();
    cargarCatalogo();
  });

  $("#filtro-texto").addEventListener("input", (e) => {
    filtros.texto = e.target.value;
    clearTimeout(esperaBusqueda);
    esperaBusqueda = setTimeout(cargarCatalogo, 250);
  });

  $("#filtro-talla").addEventListener("change", (e) => {
    filtros.talla = e.target.value;
    cargarCatalogo();
  });

  $("#filtro-precio").addEventListener("input", (e) => {
    const valor = Number(e.target.value);
    filtros.precioMax = valor >= 10000 ? 0 : valor;
    $("#valor-precio").textContent = filtros.precioMax ? formatoCLP(valor) : "sin límite";
    clearTimeout(esperaBusqueda);
    esperaBusqueda = setTimeout(cargarCatalogo, 150);
  });

  $("#filtro-orden").addEventListener("change", (e) => {
    filtros.orden = e.target.value;
    cargarCatalogo();
  });

  $("#btn-limpiar").addEventListener("click", limpiarFiltros);

  $("#grilla").addEventListener("click", (e) => {
    if (e.target.closest("[data-limpiar]")) return limpiarFiltros();
    const ficha = e.target.closest("[data-ficha]");
    if (ficha) return abrirFicha(ficha.dataset.ficha);
    const agregar = e.target.closest("[data-agregar]");
    if (agregar) {
      const sku = agregar.dataset.agregar;
      agregarAlCarrito(sku, document.querySelector(`[data-talla="${sku}"]`).value);
    }
  });

  $("#carrito-cuerpo").addEventListener("click", (e) => {
    const paso = e.target.closest("[data-paso]");
    if (paso) {
      pasoCarrito = paso.dataset.paso;
      if (pasoCarrito === "items") ultimoPedido = null;
      return renderCarrito();
    }
    const menos = e.target.closest("[data-menos]");
    if (menos) return cambiarCantidad(Number(menos.dataset.menos), -1);
    const mas = e.target.closest("[data-mas]");
    if (mas) return cambiarCantidad(Number(mas.dataset.mas), 1);
    const quitar = e.target.closest("[data-quitar]");
    if (quitar) return cambiarCantidad(Number(quitar.dataset.quitar), 0);
  });

  document.querySelectorAll("dialog").forEach((d) => {
    d.addEventListener("click", (e) => {
      if (e.target === d || e.target.closest("[data-cerrar]")) d.close();
    });
  });

  $("#form-ingresar").addEventListener("submit", enviarIngreso);
  $("#btn-alternar-registro").addEventListener("click", () => {
    modoRegistro = !modoRegistro;
    actualizarModoIngreso();
  });

  $("#form-nuevo").addEventListener("submit", registrarModelo);
  $("#form-nuevo").addEventListener("input", (e) => {
    if (["motivo", "colorBase", "colorFranja", "colorAcento"].includes(e.target.name)) renderVistaPrevia();
  });
  $("#admin-tematica").addEventListener("change", (e) => {
    $("#nueva-tematica").classList.toggle("hidden", e.target.value !== "nueva");
  });
  $("#tabla-inventario").addEventListener("click", (e) => {
    const boton = e.target.closest("[data-guardar]");
    if (boton) guardarFila(boton.dataset.guardar);
  });
  $("#btn-restablecer").addEventListener("click", () => {
    if (!confirm("¿Volver a los datos de prueba? Se pierden los cambios del inventario, reseñas y pedidos.")) return;
    DB.restablecer();
    CarritoLocal.vaciar();
    carrito = CarritoLocal.cargar();
    actualizarContadorCarrito();
    prepararAdmin();
    cargarCatalogo();
    mostrarAviso("Datos de prueba restablecidos");
  });
}

function abrirSegunHash() {
  if (location.hash === "#carrito") abrirCarrito();
  else if (location.hash === "#ingresar" && !Sesion.usuario()) abrirIngreso();
  else if (location.hash === "#admin") $("#admin").scrollIntoView();
}

(async function iniciar() {
  renderEncabezado("catalogo");
  conectarEncabezado();
  colecciones = (await ApiGateway.solicitar("GET", "/colecciones")).data;
  if (!colecciones.some((c) => c.id === filtros.coleccion)) filtros.coleccion = "";
  renderChips();
  conectarEventos();
  prepararAdmin();
  await cargarCatalogo();
  abrirSegunHash();
  window.addEventListener("hashchange", abrirSegunHash);
  const skuInicial = new URLSearchParams(location.search).get("sku");
  if (skuInicial && DB.calcetines.some((c) => c.sku === skuInicial)) abrirFicha(skuInicial);
})();
