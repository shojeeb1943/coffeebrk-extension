const APP_URL = "https://app.coffeebrk.ai/";

async function load() {
  const defaults = { daily_open_enabled: true, daily_open_time: "00:00", show_feed: false };
  const { daily_open_enabled, daily_open_time, show_feed } = await chrome.storage.sync.get(defaults);
  document.getElementById("daily_open_enabled").checked = !!daily_open_enabled;
  document.getElementById("daily_open_time").value = daily_open_time;
  document.getElementById("daily_open_time").disabled = !daily_open_enabled;
  document.getElementById("show_feed").checked = !!show_feed;
}

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

// Rely on label default behavior; do not re-toggle to avoid double flips

// Removed row-level toggling to avoid interference; rely on label/input clicks only

// Removed label-level custom handler; native input handles clicks

// Ensure the daily_open_enabled switch is always responsive
(() => {
  const dailyInput = document.getElementById('daily_open_enabled');
  const dailyLabel = dailyInput ? dailyInput.closest('label.switch') : null;
  if (dailyLabel && dailyInput) {
    dailyLabel.addEventListener('click', (e) => {
      if (e.target === dailyInput) return; // native toggle
      e.preventDefault();
      e.stopPropagation();
      dailyInput.checked = !dailyInput.checked;
      dailyInput.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
})();

load();
