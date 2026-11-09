const SECRETO_JWT = "sockbuster-prototipo-2026";
const DURACION_TOKEN_MIN = 60;

function aBase64Url(texto) {
  const bytes = new TextEncoder().encode(texto);
  let binario = "";
  bytes.forEach((b) => (binario += String.fromCharCode(b)));
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function desdeBase64Url(texto) {
  const base = texto.replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(base + "===".slice((base.length + 3) % 4));
  const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function bytesABase64Url(buffer) {
  let binario = "";
  new Uint8Array(buffer).forEach((b) => (binario += String.fromCharCode(b)));
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(texto) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const AuthService = {
  async firmar(payload) {
    const cabecera = aBase64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const cuerpo = aBase64Url(JSON.stringify(payload));
    const clave = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SECRETO_JWT),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const firma = await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(`${cabecera}.${cuerpo}`));
    return `${cabecera}.${cuerpo}.${bytesABase64Url(firma)}`;
  },

  async verificar(token) {
    if (!token || token.split(".").length !== 3) return null;
    const [cabecera, cuerpo, firma] = token.split(".");
    const clave = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SECRETO_JWT),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const esperada = bytesABase64Url(
      await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(`${cabecera}.${cuerpo}`))
    );
    if (esperada !== firma) return null;
    const payload = JSON.parse(desdeBase64Url(cuerpo));
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  },

  async iniciarSesion(email, password) {
    const usuario = DB.usuarios.find((u) => u.email === String(email).trim().toLowerCase());
    if (!usuario || usuario.passwordHash !== (await sha256(password))) {
      return { status: 401, error: "Correo o contraseña incorrectos" };
    }
    const ahora = Math.floor(Date.now() / 1000);
    const token = await this.firmar({
      sub: usuario.id,
      nombre: usuario.nombre,
      rol: usuario.rol,
      iat: ahora,
      exp: ahora + DURACION_TOKEN_MIN * 60,
    });
    return { status: 200, data: { token, nombre: usuario.nombre, rol: usuario.rol } };
  },

  async registrar({ nombre, email, password }) {
    nombre = String(nombre || "").trim();
    email = String(email || "").trim().toLowerCase();
    if (nombre.length < 3) return { status: 400, error: "Escribe tu nombre completo" };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: 400, error: "El correo no es válido" };
    if (String(password || "").length < 6) return { status: 400, error: "La contraseña debe tener al menos 6 caracteres" };
    if (DB.usuarios.some((u) => u.email === email)) return { status: 409, error: "Ese correo ya está registrado" };
    DB.usuarios.push(
      new Usuario({
        id: "u" + Date.now().toString(36),
        nombre,
        email,
        passwordHash: await sha256(password),
        rol: Rol.CLIENTE,
      })
    );
    DB.guardar();
    return this.iniciarSesion(email, password);
  },
};

let colaReservas = Promise.resolve();

const CatalogoService = {
  listarColecciones() {
    return { status: 200, data: DB.colecciones };
  },

  listarTematicas() {
    return { status: 200, data: DB.tematicas };
  },

  detalle(calcetin) {
    const resenas = DB.resenas.filter((r) => r.sku === calcetin.sku);
    return {
      ...calcetin,
      tematica: DB.tematicas.find((t) => t.id === calcetin.tematicaId),
      coleccion: DB.colecciones.find((c) => c.id === calcetin.coleccionId),
      promedio: calcetin.promedioEstrellas(DB.resenas),
      totalResenas: resenas.length,
    };
  },

  async buscar(filtros = {}) {
    const coleccion =
      DB.colecciones.find((c) => c.id === filtros.coleccion) ||
      new Coleccion({ id: "todas", nombre: "Todas", descripcion: "" });

    const [encontrados, promedios] = await Promise.all([
      Promise.resolve(coleccion.filtrar(DB.calcetines, filtros.talla, Number(filtros.precioMax) || 0)),
      Promise.resolve(new Map(DB.calcetines.map((c) => [c.sku, c.promedioEstrellas(DB.resenas)]))),
    ]);

    const texto = String(filtros.texto || "").trim().toLowerCase();
    let lista = encontrados
      .map((c) => ({ ...this.detalle(c), promedio: promedios.get(c.sku) }))
      .filter(
        (c) =>
          !texto ||
          c.nombre.toLowerCase().includes(texto) ||
          (c.tematica && c.tematica.titulo.toLowerCase().includes(texto))
      );

    const orden = {
      "precio-asc": (a, b) => a.precio - b.precio,
      "precio-desc": (a, b) => b.precio - a.precio,
      valoracion: (a, b) => b.promedio - a.promedio,
      nombre: (a, b) => a.nombre.localeCompare(b.nombre),
    }[filtros.orden || "nombre"];
    if (orden) lista = lista.sort(orden);
    return { status: 200, data: lista };
  },

  obtener(sku) {
    const calcetin = DB.calcetines.find((c) => c.sku === sku);
    if (!calcetin) return { status: 404, error: "Producto no encontrado" };
    return { status: 200, data: this.detalle(calcetin) };
  },

  reservarStock(items) {
    const tarea = colaReservas.then(() => {
      const faltantes = items.filter((i) => {
        const c = DB.calcetines.find((x) => x.sku === i.sku);
        const pedidoTotal = items.filter((x) => x.sku === i.sku).reduce((s, x) => s + x.cantidad, 0);
        return !c || c.stock < pedidoTotal;
      });
      if (faltantes.length > 0) return { ok: false, faltantes: faltantes.map((f) => f.nombre) };
      items.forEach((i) => DB.calcetines.find((x) => x.sku === i.sku).actualizarStock(-i.cantidad));
      DB.guardar();
      return { ok: true };
    });
    colaReservas = tarea.catch(() => {});
    return tarea;
  },

  liberarStock(items) {
    items.forEach((i) => {
      const c = DB.calcetines.find((x) => x.sku === i.sku);
      if (c) c.actualizarStock(i.cantidad);
    });
    DB.guardar();
  },

  registrarCalcetin(datos) {
    const nombre = String(datos.nombre || "").trim();
    const precio = Number(datos.precio);
    const stock = Number(datos.stock);
    const coleccion = DB.colecciones.find((c) => c.id === datos.coleccionId);
    if (nombre.length < 3) return { status: 400, error: "El nombre debe tener al menos 3 letras" };
    if (!coleccion) return { status: 400, error: "Elige una colección" };
    if (!Number.isInteger(precio) || precio < 1000) return { status: 400, error: "El precio debe ser un entero desde $1.000" };
    if (!Number.isInteger(stock) || stock < 0) return { status: 400, error: "El stock debe ser un entero mayor o igual a 0" };
    if (!Array.isArray(datos.tallas) || datos.tallas.length === 0) return { status: 400, error: "Marca al menos una talla" };

    let tematica = DB.tematicas.find((t) => t.id === datos.tematicaId);
    if (!tematica) {
      const titulo = String(datos.nuevaTematica?.titulo || "").trim();
      const anio = Number(datos.nuevaTematica?.anio);
      if (titulo.length < 2) return { status: 400, error: "Escribe el título de la película o serie" };
      if (!["Película", "Serie"].includes(datos.nuevaTematica?.tipo)) return { status: 400, error: "Indica si es película o serie" };
      if (!Number.isInteger(anio) || anio < 1900 || anio > 2030) return { status: 400, error: "El año no es válido" };
      tematica = new Tematica({ id: "t" + Date.now().toString(36), titulo, tipo: datos.nuevaTematica.tipo, anio });
      DB.tematicas.push(tematica);
    }

    const prefijo = { cf: "CF", terror: "TE", drama: "DR", anim: "AN" }[coleccion.id] || "XX";
    const correlativo = DB.calcetines.filter((c) => c.sku.startsWith(`SB-${prefijo}-`)).length + 1;
    let sku = `SB-${prefijo}-${String(correlativo).padStart(2, "0")}`;
    while (DB.calcetines.some((c) => c.sku === sku)) sku += "B";

    const calcetin = new Calcetin({
      sku,
      nombre,
      precio,
      stock,
      tallas: datos.tallas,
      foto: `${datos.motivo || "rayas"};${datos.colorBase || "#1e293b"};${datos.colorFranja || "#f43f5e"};${datos.colorAcento || "#facc15"}`,
      coleccionId: coleccion.id,
      tematicaId: tematica.id,
    });
    calcetin.asociarTematica(tematica);
    coleccion.agregarCalcetin(calcetin, DB.calcetines);
    DB.guardar();
    return { status: 201, data: this.detalle(calcetin) };
  },

  actualizarCalcetin(sku, { stock, precio }) {
    const calcetin = DB.calcetines.find((c) => c.sku === sku);
    if (!calcetin) return { status: 404, error: "Producto no encontrado" };
    try {
      if (stock !== undefined) calcetin.actualizarStock(Number(stock) - calcetin.stock);
      if (precio !== undefined) calcetin.cambiarPrecio(Number(precio));
    } catch (e) {
      return { status: 400, error: e.message };
    }
    DB.guardar();
    return { status: 200, data: this.detalle(calcetin) };
  },
};

const ResenaService = {
  listar(sku) {
    const lista = DB.resenas.filter((r) => r.sku === sku).sort((a, b) => b.fecha.localeCompare(a.fecha));
    return { status: 200, data: lista };
  },

  publicar(usuario, { sku, estrellas, comentario }) {
    if (!DB.calcetines.some((c) => c.sku === sku)) return { status: 404, error: "Producto no encontrado" };
    if (DB.resenas.some((r) => r.sku === sku && r.usuarioId === usuario.sub)) {
      return { status: 409, error: "Ya publicaste una reseña de este producto" };
    }
    const resena = new Resena({
      id: "r" + Date.now().toString(36),
      sku,
      usuarioId: usuario.sub,
      autor: usuario.nombre,
      estrellas: Number(estrellas),
      comentario: String(comentario || "").trim(),
      fecha: new Date().toISOString().slice(0, 10),
    });
    if (!resena.esValida()) {
      return { status: 400, error: "Elige de 1 a 5 estrellas y escribe un comentario de al menos 10 caracteres" };
    }
    DB.resenas.push(resena);
    DB.guardar();
    return { status: 201, data: resena };
  },
};

const PasarelaPago = {
  cobrar(total, tarjeta) {
    return new Promise((resolve) =>
      setTimeout(() => {
        const aprobado = !tarjeta.endsWith("0000");
        resolve({ aprobado, codigo: aprobado ? "AUT-" + Math.floor(100000 + Math.random() * 900000) : null });
      }, 600)
    );
  },
};

const PedidoService = {
  generarId() {
    const hoy = new Date();
    const fecha = `${hoy.getFullYear()}${String(hoy.getMonth() + 1).padStart(2, "0")}${String(hoy.getDate()).padStart(2, "0")}`;
    let id;
    do {
      id = `SB-${fecha}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    } while (DB.pedidos.some((p) => p.id === id));
    return id;
  },

  validarPago(pago) {
    const tarjeta = String(pago.tarjeta || "").replace(/\s/g, "");
    if (String(pago.nombre || "").trim().length < 3) return "Escribe el nombre del titular";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(pago.email || ""))) return "El correo no es válido";
    if (!/^\d{16}$/.test(tarjeta)) return "La tarjeta debe tener 16 dígitos";
    if (!/^\d{3}$/.test(String(pago.cvv || ""))) return "El CVV debe tener 3 dígitos";
    return null;
  },

  async checkout(carrito, pago) {
    if (!carrito || !carrito.items || carrito.items.length === 0) return { status: 400, error: "El carrito está vacío" };
    const errorPago = this.validarPago(pago);
    if (errorPago) return { status: 400, error: errorPago };

    const items = carrito.items.map((i) => {
      const actual = DB.calcetines.find((c) => c.sku === i.sku);
      return new ItemCarrito({ ...i, precioUnitario: actual ? actual.precio : i.precioUnitario });
    });

    const [reserva, subtotal] = await Promise.all([
      CatalogoService.reservarStock(items),
      Promise.resolve(items.reduce((s, i) => s + i.subtotal(), 0)),
    ]);
    if (!reserva.ok) return { status: 409, error: `Sin stock suficiente: ${reserva.faltantes.join(", ")}` };

    const envio = subtotal >= 20000 ? 0 : 2990;
    const pedido = new Pedido({
      id: this.generarId(),
      fecha: new Date().toISOString(),
      items,
      subtotal,
      envio,
      total: subtotal + envio,
      estado: EstadoPedido.PENDIENTE,
      cliente: { nombre: pago.nombre.trim(), email: pago.email.trim() },
    });

    const resultado = await PasarelaPago.cobrar(pedido.total, String(pago.tarjeta).replace(/\s/g, ""));
    if (resultado.aprobado) {
      pedido.estado = EstadoPedido.PAGADO;
      pedido.autorizacion = resultado.codigo;
      DB.pedidos.push(pedido);
      DB.guardar();
      return { status: 201, data: pedido };
    }

    pedido.estado = EstadoPedido.RECHAZADO;
    DB.pedidos.push(pedido);
    CatalogoService.liberarStock(items);
    return { status: 402, error: "La pasarela rechazó el pago. Prueba con otra tarjeta.", data: pedido };
  },
};
