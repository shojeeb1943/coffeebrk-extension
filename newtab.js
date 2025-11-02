const MAX_FAVS = 10;
const FALLBACK_ICON = "icons/logo.svg";

function domainFromUrl(url) {
  try { return new URL(url).hostname; } catch { return null; }
}

function faviconFor(url) {
  const d = domainFromUrl(url);
  return d ? `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(d)}` : FALLBACK_ICON;
}

async function getState() {
  const defaults = { use_as_new_tab: true, favorites: [] };
  const { use_as_new_tab, favorites } = await chrome.storage.sync.get(defaults);
  return { use_as_new_tab, favorites };
}

function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") e.className = v; else if (k.startsWith("on")) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v);
  });
  children.forEach((c) => e.append(c));
  return e;
}

function showDisabled() {
  const main = document.getElementById("main");
  main.innerHTML = "";
  const msg = el("div", { class: "disabled" }, [
    el("div", {}, ["Coffeebrk new tab is disabled."]),
    el("div", {}, [
      el("button", { id: "enable", class: "btn", style: "width:auto; height:auto; padding:8px 12px; border-radius:8px; margin-top:12px;" }, ["Enable"])
    ])
  ]);
  main.append(msg);
  document.getElementById("enable").addEventListener("click", async () => {
    await chrome.storage.sync.set({ use_as_new_tab: true });
    render();
  });
}

function favoriteTile(item, index, favs) {
  const img = el("img", { src: faviconFor(item.url), alt: item.title || item.url, onerror: (e) => { e.target.src = FALLBACK_ICON; } });
  const open = () => window.open(item.url, "_blank");
  const actions = el("div", { class: "tile-actions" }, [
    el("div", { class: "icon", title: "Edit", onclick: () => openEditDialog(index, favs[index]) }, ["✏️"]),
    el("div", { class: "icon", title: "Delete", onclick: async () => { favs.splice(index, 1); await saveFavorites(favs); render(); } }, ["🗑"]) 
  ]);
  const btn = el("button", { class: "btn", draggable: true, ondragstart: (e) => onDragStart(e, index), ondragover: (e) => e.preventDefault(), ondrop: (e) => onDrop(e, index) }, [img]);
  const title = el("div", { class: "tile-label" }, [item.title || domainFromUrl(item.url) || item.url]);
  return el("div", { class: "tile", role: "button", tabindex: 0, onkeydown: (e) => { if (e.key === "Enter") open(); } }, [actions, el("div", { onclick: open }, [btn]), title]);
}

function addTile() {
  const plus = el("div", { class: "btn add", role: "button", tabindex: 0 }, ["+"]);
  plus.addEventListener("click", () => openEditDialog(null, { title: "", url: "" }));
  return el("div", { class: "tile" }, [plus, el("div", { class: "tile-label" }, ["Add"]) ]);
}

function onDragStart(e, index) {
  e.dataTransfer.setData("text/plain", String(index));
}

async function onDrop(e, toIndex) {
  e.preventDefault();
  const fromIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
  if (Number.isNaN(fromIndex)) return;
  const { favorites } = await chrome.storage.sync.get({ favorites: [] });
  const item = favorites.splice(fromIndex, 1)[0];
  favorites.splice(toIndex, 0, item);
  await saveFavorites(favorites);
  render();
}

async function saveFavorites(favs) {
  await chrome.storage.sync.set({ favorites: favs.slice(0, MAX_FAVS) });
}

function openEditDialog(index, item) {
  const dlg = document.getElementById("dlg");
  const title = document.getElementById("dlg_title");
  const url = document.getElementById("dlg_url");
  title.value = item.title || "";
  url.value = item.url || "";
  dlg.style.display = "flex";
  const submit = async () => {
    const urlVal = url.value.trim();
    try { new URL(urlVal); } catch { url.focus(); return; }
    const titleVal = title.value.trim() || domainFromUrl(urlVal) || urlVal;
    const now = new Date().toISOString();
    const { favorites } = await chrome.storage.sync.get({ favorites: [] });
    if (index == null) favorites.push({ title: titleVal, url: urlVal, created_at: now }); else favorites[index] = { ...favorites[index], title: titleVal, url: urlVal };
    await saveFavorites(favorites);
    dlg.style.display = "none";
    render();
  };
  const close = () => { dlg.style.display = "none"; };
  document.getElementById("dlg_save").onclick = submit;
  document.getElementById("dlg_cancel").onclick = close;
}

async function render() {
  const { use_as_new_tab, favorites } = await getState();
  const main = document.getElementById("main");
  main.innerHTML = "";
  if (!use_as_new_tab) { showDisabled(); return; }

  const grid = el("div", { class: "favs", role: "list" });
  favorites.slice(0, MAX_FAVS).forEach((f, i) => grid.append(favoriteTile(f, i, favorites)));
  if (favorites.length < MAX_FAVS) grid.append(addTile());

  main.append(grid);
}

function setupSearch() {
  const input = document.getElementById("search");
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const v = input.value.trim();
      if (!v) return;
      try {
        const u = new URL(v.includes("://") ? v : `https://www.google.com/search?q=${encodeURIComponent(v)}`);
        window.open(u.toString(), "_self");
      } catch {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(v)}`, "_self");
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupSearch();
  render();
});
