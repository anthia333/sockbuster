const CLAVE_DB = "sockbuster-db-v1";

const DATOS_INICIALES = {
  colecciones: [
    { id: "cf", nombre: "Ciencia Ficción", descripcion: "Naves, viajes en el tiempo y futuros con neón." },
    { id: "terror", nombre: "Terror 80s", descripcion: "Para ver películas de miedo con los pies calientes." },
    { id: "drama", nombre: "Series de Drama", descripcion: "Las series que no dejaste de ver hasta las 3 AM." },
    { id: "anim", nombre: "Animación", descripcion: "Dibujos animados de toda la vida." },
  ],
  tematicas: [
    { id: "t1", titulo: "Star Wars", tipo: "Película", anio: 1977 },
    { id: "t2", titulo: "Volver al Futuro", tipo: "Película", anio: 1985 },
    { id: "t3", titulo: "Blade Runner", tipo: "Película", anio: 1982 },
    { id: "t4", titulo: "Viernes 13", tipo: "Película", anio: 1980 },
    { id: "t5", titulo: "Pesadilla en la Calle Elm", tipo: "Película", anio: 1984 },
    { id: "t6", titulo: "El Resplandor", tipo: "Película", anio: 1980 },
    { id: "t7", titulo: "Breaking Bad", tipo: "Serie", anio: 2008 },
    { id: "t8", titulo: "Game of Thrones", tipo: "Serie", anio: 2011 },
    { id: "t9", titulo: "Stranger Things", tipo: "Serie", anio: 2016 },
    { id: "t10", titulo: "Los Simpson", tipo: "Serie", anio: 1989 },
    { id: "t11", titulo: "Mi Vecino Totoro", tipo: "Película", anio: 1988 },
    { id: "t12", titulo: "Rick y Morty", tipo: "Serie", anio: 2013 },
  ],
  calcetines: [
    { sku: "SB-CF-01", nombre: "Hiperespacio", precio: 7990, stock: 24, tallas: ["35-38", "39-42", "43-46"], foto: "estrellas;#14143a;#ffd23f;#7dd3fc", coleccionId: "cf", tematicaId: "t1" },
    { sku: "SB-CF-02", nombre: "Condensador de Flujo", precio: 8490, stock: 12, tallas: ["35-38", "39-42"], foto: "rayos;#3b3b4f;#f97316;#facc15", coleccionId: "cf", tematicaId: "t2" },
    { sku: "SB-CF-03", nombre: "Replicante", precio: 8990, stock: 6, tallas: ["39-42", "43-46"], foto: "rayas;#0f172a;#ec4899;#22d3ee", coleccionId: "cf", tematicaId: "t3" },
    { sku: "SB-TE-01", nombre: "Cabaña del Lago", precio: 6990, stock: 18, tallas: ["35-38", "39-42", "43-46"], foto: "cuadros;#7f1d1d;#111827;#fca5a5", coleccionId: "terror", tematicaId: "t4" },
    { sku: "SB-TE-02", nombre: "Calle del Terror", precio: 6990, stock: 3, tallas: ["39-42"], foto: "rayas;#14532d;#b91c1c;#166534", coleccionId: "terror", tematicaId: "t5" },
    { sku: "SB-TE-03", nombre: "Hotel Overlook", precio: 9490, stock: 15, tallas: ["35-38", "39-42", "43-46"], foto: "hexagonos;#9a3412;#7c2d12;#fb923c", coleccionId: "terror", tematicaId: "t6" },
    { sku: "SB-DR-01", nombre: "Laboratorio Azul", precio: 7490, stock: 20, tallas: ["35-38", "39-42", "43-46"], foto: "cristales;#065f46;#e5e7eb;#38bdf8", coleccionId: "drama", tematicaId: "t7" },
    { sku: "SB-DR-02", nombre: "Se Acerca el Invierno", precio: 8990, stock: 9, tallas: ["39-42", "43-46"], foto: "copos;#1e3a5f;#cbd5e1;#f8fafc", coleccionId: "drama", tematicaId: "t8" },
    { sku: "SB-DR-03", nombre: "Hawkins 83", precio: 7990, stock: 0, tallas: ["35-38", "39-42"], foto: "luces;#1f2937;#dc2626;#fde047", coleccionId: "drama", tematicaId: "t9" },
    { sku: "SB-AN-01", nombre: "Rosquilla Rosada", precio: 5990, stock: 30, tallas: ["35-38", "39-42", "43-46"], foto: "puntos;#facc15;#38bdf8;#f472b6", coleccionId: "anim", tematicaId: "t10" },
    { sku: "SB-AN-02", nombre: "Espíritu del Bosque", precio: 7490, stock: 11, tallas: ["35-38", "39-42"], foto: "hojas;#4d7c0f;#a3a3a3;#d9f99d", coleccionId: "anim", tematicaId: "t11" },
    { sku: "SB-AN-03", nombre: "Portal Verde", precio: 6990, stock: 14, tallas: ["39-42", "43-46"], foto: "espiral;#0e7490;#84cc16;#bef264", coleccionId: "anim", tematicaId: "t12" },
  ],
  usuarios: [
    { id: "u1", nombre: "Administrador Sockbuster", email: "admin@sockbuster.cl", passwordHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9", rol: "ADMIN" },
    { id: "u2", nombre: "Valentina Rojas", email: "cliente@sockbuster.cl", passwordHash: "09a31a7001e261ab1e056182a71d3cf57f582ca9a29cff5eb83be0f0549730a9", rol: "CLIENTE" },
  ],
  resenas: [
    { id: "r1", sku: "SB-CF-01", usuarioId: "u2", autor: "Valentina Rojas", estrellas: 5, comentario: "Los compré para el estreno y los uso todas las semanas. No se destiñen.", fecha: "2026-10-02" },
    { id: "r2", sku: "SB-TE-03", usuarioId: "u2", autor: "Valentina Rojas", estrellas: 4, comentario: "El diseño de la alfombra es igualito. La talla 39-42 queda un poco justa.", fecha: "2026-10-15" },
    { id: "r3", sku: "SB-AN-01", usuarioId: "u2", autor: "Valentina Rojas", estrellas: 5, comentario: "Regalo perfecto, mi hermano no se los saca.", fecha: "2026-10-28" },
  ],
  pedidos: [],
};

const DB = {
  colecciones: [],
  tematicas: [],
  calcetines: [],
  usuarios: [],
  resenas: [],
  pedidos: [],

  cargar() {
    let datos = null;
    try {
      const guardado = localStorage.getItem(CLAVE_DB);
      if (guardado) datos = JSON.parse(guardado);
    } catch (e) {
      datos = null;
    }
    if (!datos) datos = JSON.parse(JSON.stringify(DATOS_INICIALES));
    this.colecciones = datos.colecciones.map((c) => new Coleccion(c));
    this.tematicas = datos.tematicas.map((t) => new Tematica(t));
    this.calcetines = datos.calcetines.map((c) => new Calcetin(c));
    this.usuarios = datos.usuarios.map((u) => new Usuario(u));
    this.resenas = datos.resenas.map((r) => new Resena(r));
    this.pedidos = datos.pedidos.map((p) => new Pedido(p));
  },

  guardar() {
    try {
      localStorage.setItem(
        CLAVE_DB,
        JSON.stringify({
          colecciones: this.colecciones,
          tematicas: this.tematicas,
          calcetines: this.calcetines,
          usuarios: this.usuarios,
          resenas: this.resenas,
          pedidos: this.pedidos,
        })
      );
    } catch (e) {}
  },

  restablecer() {
    try {
      localStorage.removeItem(CLAVE_DB);
    } catch (e) {}
    this.cargar();
  },
};

DB.cargar();
