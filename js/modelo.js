const Rol = Object.freeze({ CLIENTE: "CLIENTE", ADMIN: "ADMIN" });

const EstadoPedido = Object.freeze({
  PENDIENTE: "PENDIENTE",
  PAGADO: "PAGADO",
  RECHAZADO: "RECHAZADO",
});

class Tematica {
  constructor({ id, titulo, tipo, anio }) {
    this.id = id;
    this.titulo = titulo;
    this.tipo = tipo;
    this.anio = anio;
  }
}

class Calcetin {
  constructor({ sku, nombre, precio, stock, tallas, foto, coleccionId, tematicaId }) {
    this.sku = sku;
    this.nombre = nombre;
    this.precio = precio;
    this.stock = stock;
    this.tallas = tallas;
    this.foto = foto;
    this.coleccionId = coleccionId;
    this.tematicaId = tematicaId;
  }

  actualizarStock(cantidad) {
    const nuevo = this.stock + cantidad;
    if (!Number.isInteger(nuevo) || nuevo < 0) throw new Error("El stock no puede quedar negativo");
    this.stock = nuevo;
  }

  cambiarPrecio(precio) {
    if (!Number.isInteger(precio) || precio <= 0) throw new Error("El precio debe ser un entero mayor a 0");
    this.precio = precio;
  }

  asociarTematica(tematica) {
    this.tematicaId = tematica.id;
  }

  promedioEstrellas(resenas) {
    const propias = resenas.filter((r) => r.sku === this.sku);
    if (propias.length === 0) return 0;
    return propias.reduce((suma, r) => suma + r.estrellas, 0) / propias.length;
  }
}

class Coleccion {
  constructor({ id, nombre, descripcion }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
  }

  agregarCalcetin(calcetin, catalogo) {
    calcetin.coleccionId = this.id;
    catalogo.push(calcetin);
  }

  filtrar(catalogo, talla, precioMax) {
    return catalogo.filter(
      (c) =>
        (this.id === "todas" || c.coleccionId === this.id) &&
        (!talla || c.tallas.includes(talla)) &&
        (!precioMax || c.precio <= precioMax)
    );
  }
}

class Resena {
  constructor({ id, sku, usuarioId, autor, estrellas, comentario, fecha }) {
    this.id = id;
    this.sku = sku;
    this.usuarioId = usuarioId;
    this.autor = autor;
    this.estrellas = estrellas;
    this.comentario = comentario;
    this.fecha = fecha;
  }

  esValida() {
    return (
      Number.isInteger(this.estrellas) &&
      this.estrellas >= 1 &&
      this.estrellas <= 5 &&
      typeof this.comentario === "string" &&
      this.comentario.trim().length >= 10
    );
  }
}

class Usuario {
  constructor({ id, nombre, email, passwordHash, rol }) {
    this.id = id;
    this.nombre = nombre;
    this.email = email;
    this.passwordHash = passwordHash;
    this.rol = rol;
  }

  iniciarSesion(email, password) {
    return ApiGateway.solicitar("POST", "/auth/login", { email, password });
  }

  publicarResena(resena) {
    return ApiGateway.solicitar("POST", "/resenas", resena);
  }
}

class ItemCarrito {
  constructor({ sku, nombre, talla, cantidad, precioUnitario }) {
    this.sku = sku;
    this.nombre = nombre;
    this.talla = talla;
    this.cantidad = cantidad;
    this.precioUnitario = precioUnitario;
  }

  subtotal() {
    return this.cantidad * this.precioUnitario;
  }
}

class Carrito {
  constructor(id, items = []) {
    this.id = id;
    this.items = items.map((i) => new ItemCarrito(i));
  }

  agregar(calcetin, talla, cantidad) {
    const existente = this.items.find((i) => i.sku === calcetin.sku && i.talla === talla);
    if (existente) existente.cantidad += cantidad;
    else
      this.items.push(
        new ItemCarrito({
          sku: calcetin.sku,
          nombre: calcetin.nombre,
          talla,
          cantidad,
          precioUnitario: calcetin.precio,
        })
      );
  }

  modificarCantidad(item, cantidad) {
    if (cantidad <= 0) this.items = this.items.filter((i) => i !== item);
    else item.cantidad = cantidad;
  }

  calcularTotal() {
    return this.items.reduce((suma, i) => suma + i.subtotal(), 0);
  }

  checkout(datosPago) {
    return ApiGateway.solicitar("POST", "/pedidos", { carrito: this, pago: datosPago });
  }
}

class Pedido {
  constructor({ id, fecha, items, subtotal, envio, total, estado, cliente }) {
    this.id = id;
    this.fecha = fecha;
    this.items = items;
    this.subtotal = subtotal;
    this.envio = envio;
    this.total = total;
    this.estado = estado;
    this.cliente = cliente;
  }

  generarResumen() {
    const lineas = this.items.map((i) => `${i.cantidad} x ${i.nombre} (${i.talla})`);
    return `Pedido ${this.id} · ${lineas.join(", ")} · Total ${formatoCLP(this.total)}`;
  }
}

function formatoCLP(valor) {
  return "$" + Math.round(valor).toLocaleString("es-CL");
}
