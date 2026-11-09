renderEncabezado("diagramas");

const pestanas = document.querySelectorAll("[data-tab]");
const paneles = document.querySelectorAll("[data-panel]");

function mostrarVista(id, actualizarHash = true) {
  if (!document.getElementById("panel-" + id)) id = pestanas[0].dataset.tab;
  pestanas.forEach((t) => {
    const activa = t.dataset.tab === id;
    t.setAttribute("aria-selected", activa);
    t.classList.toggle("bg-tinta", activa);
    t.classList.toggle("text-amarillo", activa);
    t.classList.toggle("bg-white", !activa);
  });
  paneles.forEach((p) => p.classList.toggle("hidden", p.dataset.panel !== id));
  if (actualizarHash) history.replaceState(null, "", "#" + id);
}

pestanas.forEach((t) => t.addEventListener("click", () => mostrarVista(t.dataset.tab)));
mostrarVista(location.hash.slice(1) || pestanas[0].dataset.tab, false);

const dialogo = document.getElementById("dlg-diagrama");
document.querySelectorAll("[data-ampliar]").forEach((b) =>
  b.addEventListener("click", () => {
    document.getElementById("dlg-diagrama-img").src = b.dataset.ampliar;
    document.getElementById("dlg-diagrama-img").alt = b.dataset.titulo;
    document.getElementById("dlg-diagrama-titulo").textContent = b.dataset.titulo;
    dialogo.showModal();
  })
);
dialogo.addEventListener("click", (e) => {
  if (e.target === dialogo || e.target.closest("[data-cerrar]")) dialogo.close();
});

document.querySelectorAll("[data-ir]").forEach((b) =>
  b.addEventListener("click", () => {
    mostrarVista(b.dataset.ir);
    document.querySelector('[role="tablist"]').scrollIntoView({ behavior: "smooth" });
  })
);
