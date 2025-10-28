document.getElementById("run").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
  document.getElementById("status").innerText = "✅ Calculation triggered!";
  setTimeout(() => (document.getElementById("status").innerText = ""), 2000);
});

// optional autorun toggle (persisted via storage)
const checkbox = document.getElementById("autorun");

checkbox.addEventListener("change", async (e) => {
  const value = e.target.checked;
  await chrome.storage.sync.set({ autorun: value });
  document.getElementById("status").innerText = value
    ? "⚙️ Auto-run enabled"
    : "⛔ Auto-run disabled";
  setTimeout(() => (document.getElementById("status").innerText = ""), 2000);
});

(async function loadPrefs() {
  const data = await chrome.storage.sync.get(["autorun"]);
  if (data.autorun) checkbox.checked = true;
})();
