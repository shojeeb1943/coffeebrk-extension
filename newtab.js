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
  const defaults = { favorites: [], show_feed: true };
  const { favorites, show_feed } = await chrome.storage.sync.get(defaults);
  return { favorites, show_feed };
}

function el(tag, attrs = {}, children = []) {
  const e = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") {
      e.className = v;
    } else if (k.startsWith("on")) {
      e.addEventListener(k.slice(2).toLowerCase(), v);
    } else {
      e.setAttribute(k, v);
    }
  });
  children.forEach((c) => {
    if (typeof c === 'string') {
      e.appendChild(document.createTextNode(c));
    } else {
      e.appendChild(c);
    }
  });
  return e;
}

function renderHeaderFavorites(favorites) {
  const header = document.getElementById('header-favs');
  if (!header) return;
  header.innerHTML = '';
  const row = el('div', { class: 'favs' });
  favorites.slice(0, MAX_FAVS).forEach((f, i) => row.append(favoriteTile(f, i, favorites)));
  if (favorites.length < MAX_FAVS) row.append(addTile());
  // compact styling in header
  row.querySelectorAll('.tile').forEach(t => t.classList.add('small'));
  header.append(row);
}


function favoriteTile(item, index, favs) {
  const img = el("img", { src: faviconFor(item.url), alt: item.title || item.url });
  img.addEventListener('error', () => { img.src = FALLBACK_ICON; });
  
  const open = () => window.open(item.url, "_blank");
  
  const editIcon = el("div", { class: "icon", title: "Edit" }, ["✏️"]);
  editIcon.addEventListener('click', () => openEditDialog(index, favs[index]));
  
  const deleteIcon = el("div", { class: "icon", title: "Delete" }, ["🗑"]);
  deleteIcon.addEventListener('click', async () => { 
    favs.splice(index, 1); 
    await saveFavorites(favs); 
    render(); 
  });
  
  const actions = el("div", { class: "tile-actions" }, [editIcon, deleteIcon]);
  
  const btn = el("button", { class: "btn", draggable: true }, [img]);
  btn.addEventListener('dragstart', (e) => onDragStart(e, index));
  btn.addEventListener('dragover', (e) => e.preventDefault());
  btn.addEventListener('drop', (e) => onDrop(e, index));
  
  const btnWrapper = el("div", {}, [btn]);
  btnWrapper.addEventListener('click', open);
  
  const title = el("div", { class: "tile-label" }, [item.title || domainFromUrl(item.url) || item.url]);
  
  const tile = el("div", { class: "tile", role: "button", tabindex: 0 }, [actions, btnWrapper, title]);
  tile.addEventListener('keydown', (e) => { if (e.key === "Enter") open(); });
  
  return tile;
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
  
  const saveBtn = document.getElementById("dlg_save");
  const cancelBtn = document.getElementById("dlg_cancel");
  
  // Remove old listeners
  const newSaveBtn = saveBtn.cloneNode(true);
  const newCancelBtn = cancelBtn.cloneNode(true);
  saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
  cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
  
  newSaveBtn.addEventListener('click', submit);
  newCancelBtn.addEventListener('click', close);
}

function renderFeed() {
  const main = document.getElementById("main");
  main.innerHTML = "";
  const wrap = el('div', { class: 'feed' }, [
    el('div', { class: 'feed-skeleton' }, [ 'Loading Coffeebrk…' ]),
    el('iframe', { class: 'feed-frame', src: 'https://app.coffeebrk.ai/', referrerpolicy: 'no-referrer-when-downgrade', allow: 'clipboard-read; clipboard-write' })
  ]);
  main.append(wrap);
  const iframe = wrap.querySelector('iframe');
  const skel = wrap.querySelector('.feed-skeleton');
  let loaded = false;
  const onLoaded = () => { loaded = true; skel.style.display = 'none'; };
  iframe.addEventListener('load', onLoaded);
  // Fallback: if feed doesn't load quickly, open the app directly in this tab (avoids iframe restrictions)
  setTimeout(async () => {
    if (!loaded) {
      try { location.replace('https://app.coffeebrk.ai/'); }
      catch (e) { try { await chrome.tabs.update({ url: 'https://app.coffeebrk.ai/' }); } catch {} }
    }
  }, 2000);
}

async function render() {
  const { favorites, show_feed } = await getState();
  
  const main = document.getElementById("main");
  if (!main) return; // Safety check
  main.innerHTML = "";
  // Always show header favorites row
  renderHeaderFavorites(favorites);
  if (show_feed) { renderFeed(); return; }
  // No body grid; favorites now live in header only
  return;
}

document.addEventListener("DOMContentLoaded", () => {
  render();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  if (changes.favorites || changes.show_feed) {
    render();
  }
});
