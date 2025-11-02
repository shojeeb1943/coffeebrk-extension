const APP_URL = "https://app.coffeebrk.ai/";

async function load() {
  const defaults = { use_as_new_tab: true, daily_open_enabled: true, daily_open_time: "00:00" };
  const { use_as_new_tab, daily_open_enabled, daily_open_time } = await chrome.storage.sync.get(defaults);
  document.getElementById("use_as_new_tab").checked = !!use_as_new_tab;
  document.getElementById("daily_open_enabled").checked = !!daily_open_enabled;
  document.getElementById("daily_open_time").value = daily_open_time;
}

document.getElementById("use_as_new_tab").addEventListener("change", async (e) => {
  await chrome.storage.sync.set({ use_as_new_tab: e.target.checked });
});

document.getElementById("daily_open_enabled").addEventListener("change", async (e) => {
  await chrome.storage.sync.set({ daily_open_enabled: e.target.checked });
});

document.getElementById("daily_open_time").addEventListener("change", async (e) => {
  const v = e.target.value || "00:00";
  // basic HH:MM validation
  const ok = /^\d{2}:\d{2}$/.test(v);
  if (!ok) return; 
  await chrome.storage.sync.set({ daily_open_time: v });
});

document.getElementById("open_coffeebrk").addEventListener("click", async () => {
  await chrome.tabs.create({ url: APP_URL, active: true });
});

document.getElementById("manage_favorites").addEventListener("click", async () => {
  await chrome.tabs.create({ url: "chrome://newtab/", active: true });
});

load();
