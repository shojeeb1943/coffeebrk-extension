const APP_URL = "https://app.coffeebrk.ai/";

async function load() {
  const defaults = { use_as_new_tab: true, daily_open_enabled: true, daily_open_time: "00:00", show_feed: false };
  const { use_as_new_tab, daily_open_enabled, daily_open_time, show_feed } = await chrome.storage.sync.get(defaults);
  document.getElementById("use_as_new_tab").checked = !!use_as_new_tab;
  document.getElementById("daily_open_enabled").checked = !!daily_open_enabled;
  document.getElementById("daily_open_time").value = daily_open_time;
  document.getElementById("daily_open_time").disabled = !daily_open_enabled;
  document.getElementById("show_feed").checked = !!show_feed;
}

document.getElementById("use_as_new_tab").addEventListener("change", async (e) => {
  await chrome.storage.sync.set({ use_as_new_tab: e.target.checked });
});

document.getElementById("daily_open_enabled").addEventListener("change", async (e) => {
  await chrome.storage.sync.set({ daily_open_enabled: e.target.checked });
  document.getElementById("daily_open_time").disabled = !e.target.checked;
});

document.getElementById("daily_open_time").addEventListener("change", async (e) => {
  const v = e.target.value || "00:00";
  // basic HH:MM validation
  const ok = /^\d{2}:\d{2}$/.test(v);
  if (!ok) return; 
  await chrome.storage.sync.set({ daily_open_time: v });
});

document.getElementById("show_feed").addEventListener("change", async (e) => {
  await chrome.storage.sync.set({ show_feed: e.target.checked });
});

document.getElementById("open_coffeebrk").addEventListener("click", async () => {
  await chrome.tabs.create({ url: APP_URL, active: true });
});

document.getElementById("manage_favorites").addEventListener("click", async () => {
  await chrome.tabs.create({ url: "chrome://newtab/", active: true });
});

// Make entire switch label toggle the input and trigger change
document.querySelectorAll('.switch').forEach((sw) => {
  sw.addEventListener('click', (e) => {
    if (e.target.tagName.toLowerCase() === 'input') return;
    const input = sw.querySelector('input');
    if (!input) return;
    input.checked = !input.checked;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
});

// Also allow clicking the whole row to toggle
document.querySelectorAll('.row-toggle').forEach((row) => {
  row.addEventListener('click', (e) => {
    // Avoid toggling when clicking on interactive controls inside the row (input or button)
    const tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'button' || e.target.closest('label.switch')) return;
    const inputId = row.getAttribute('data-input');
    if (!inputId) return;
    const input = document.getElementById(inputId);
    if (!input) return;
    input.checked = !input.checked;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
});

load();
