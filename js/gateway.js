const RUTAS = [
  { metodo: "POST", patron: /^\/auth\/login$/, acceso: "publico", accion: (p, b) => AuthService.iniciarSesion(b.email, b.password) },
  { metodo: "POST", patron: /^\/auth\/registro$/, acceso: "publico", accion: (p, b) => AuthService.registrar(b) },
  { metodo: "GET", patron: /^\/colecciones$/, acceso: "publico", accion: () => CatalogoService.listarColecciones() },
  { metodo: "GET", patron: /^\/tematicas$/, acceso: "publico", accion: () => CatalogoService.listarTematicas() },
  { metodo: "GET", patron: /^\/catalogo$/, acceso: "publico", accion: (p, b) => CatalogoService.buscar(b) },
  { metodo: "GET", patron: /^\/calcetines\/([\w-]+)$/, acceso: "publico", accion: (p) => CatalogoService.obtener(p[1]) },
  { metodo: "GET", patron: /^\/resenas\/([\w-]+)$/, acceso: "publico", accion: (p) => ResenaService.listar(p[1]) },
  { metodo: "POST", patron: /^\/resenas$/, acceso: "registrado", accion: (p, b, u) => ResenaService.publicar(u, b) },
  { metodo: "POST", patron: /^\/pedidos$/, acceso: "publico", accion: (p, b) => PedidoService.checkout(b.carrito, b.pago) },
  { metodo: "POST", patron: /^\/admin\/calcetines$/, acceso: Rol.ADMIN, accion: (p, b) => CatalogoService.registrarCalcetin(b) },
  { metodo: "PATCH", patron: /^\/admin\/calcetines\/([\w-]+)$/, acceso: Rol.ADMIN, accion: (p, b) => CatalogoService.actualizarCalcetin(p[1], b) },
];

const ApiGateway = {
  latenciaMs: 120,

  async solicitar(metodo, ruta, cuerpo = {}) {
    await new Promise((r) => setTimeout(r, this.latenciaMs));

    const destino = RUTAS.find((r) => r.metodo === metodo && r.patron.test(ruta));
    if (!destino) return { status: 404, error: `Ruta no encontrada: ${metodo} ${ruta}` };

    let usuario = null;
    if (destino.acceso !== "publico") {
      const token = typeof Sesion !== "undefined" ? Sesion.obtenerToken() : null;
      usuario = await AuthService.verificar(token);
      if (!usuario) return { status: 401, error: "Debes iniciar sesión para continuar" };
      if (destino.acceso === Rol.ADMIN && usuario.rol !== Rol.ADMIN) {
        return { status: 403, error: "Solo el administrador puede hacer esto" };
      }
    }

    try {
      return await destino.accion(ruta.match(destino.patron), cuerpo, usuario);
    } catch (e) {
      return { status: 500, error: "Error interno: " + e.message };
    }
  },
};
