const APP_URL = "https://app.coffeebrk.ai/";
const FEEDBACK_URL = "https://feedback.coffeebrk.ai/";
const ALARM_NAME = "daily-open";

async function getSettings() {
  const { daily_open_enabled = true, daily_open_time = "00:00" } = await chrome.storage.sync.get({
    daily_open_enabled: true,
    daily_open_time: "00:00"
  });
  return { daily_open_enabled, daily_open_time };
}

function computeNextTrigger(timeStr) {
  const [h, m] = timeStr.split(":").map((n) => parseInt(n, 10));
  const now = new Date();
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

async function scheduleDailyAlarm() {
  const { daily_open_enabled, daily_open_time } = await getSettings();
  await chrome.alarms.clear(ALARM_NAME);
  if (!daily_open_enabled) return;
  const when = computeNextTrigger(daily_open_time).getTime();
  await chrome.alarms.create(ALARM_NAME, { when, periodInMinutes: 24 * 60 });
}

chrome.runtime.onInstalled.addListener(async () => {
  try { await chrome.runtime.setUninstallURL(FEEDBACK_URL); } catch (e) {}
  const current = await chrome.storage.sync.get({ initialized: false });
  if (!current.initialized) {
    await chrome.storage.sync.set({
      daily_open_enabled: true,
      daily_open_time: "00:00",
      favorites: [],
      initialized: true
    });
  }
  await scheduleDailyAlarm();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  const { daily_open_enabled } = await getSettings();
  if (!daily_open_enabled) return;
  try {
    await chrome.tabs.create({ url: APP_URL, active: false });
  } catch (e) {}
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  if (changes.daily_open_time || changes.daily_open_enabled) {
    scheduleDailyAlarm();
  }
});

