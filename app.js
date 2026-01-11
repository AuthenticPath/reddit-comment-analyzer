/*******************************************************
 * Front-end controller (vanilla JS)
 *
 * - No secrets here.
 * - No localStorage (starts blank every load).
 * - Shows status messages and basic validation.
 * - Step H will connect it to your Apps Script Web App.
 *******************************************************/

// IMPORTANT: We'll set this in Step H (Connect front-end to Apps Script)
// Example format: "https://script.google.com/macros/s/XXXXXXXX/exec"
const APPS_SCRIPT_WEB_APP_URL = "PASTE_YOUR_WEB_APP_URL_HERE";

const el = {
  redditUrl: document.getElementById("redditUrl"),
  prompt: document.getElementById("prompt"),
  runBtn: document.getElementById("runBtn"),
  openBtn: document.getElementById("openBtn"),
  status: document.getElementById("status"),
  debug: document.getElementById("debug"),
};

// Keep the spreadsheet URL in memory only (not persisted)
let latestSpreadsheetUrl = "";

// Ensure blank on load (no persistence)
function resetUI_() {
  el.redditUrl.value = "";
  el.prompt.value = "";
  el.debug.textContent = "";
  latestSpreadsheetUrl = "";
  el.openBtn.disabled = true;
  setStatus_("Idle. Enter a URL + prompt, then click Run.");
}

// Status helper
function setStatus_(text) {
  el.status.textContent = text;
}

// Debug helper (shows raw JSON or error details)
function setDebug_(objOrText) {
  if (typeof objOrText === "string") {
    el.debug.textContent = objOrText;
  } else {
    el.debug.textContent = JSON.stringify(objOrText, null, 2);
  }
}

// Very lightweight validation (we’ll do deeper server-side checks too)
function validateInputs_() {
  const url = el.redditUrl.value.trim();
  const prompt = el.prompt.value.trim();

  if (!url) return { ok: false, message: "URL is required." };
  if (!prompt) return { ok: false, message: "Prompt is required." };

  // Basic "looks like a Reddit URL" check (not perfect, just helpful)
  const looksLikeReddit =
    url.includes("reddit.com/r/") ||
    url.includes("redd.it/") ||
    url.includes("old.reddit.com/") ||
    url.includes("new.reddit.com/");

  if (!looksLikeReddit) {
    return { ok: false, message: "That URL doesn’t look like a Reddit post link." };
  }

  return { ok: true };
}

// Button click: Run Analysis
async function onRunClick_() {
  // Clear previous output
  el.debug.textContent = "";
  latestSpreadsheetUrl = "";
  el.openBtn.disabled = true;

  const v = validateInputs_();
  if (!v.ok) {
    setStatus_(v.message);
    return;
  }

  // We won’t actually call Apps Script until Step H
  if (APPS_SCRIPT_WEB_APP_URL === "PASTE_YOUR_WEB_APP_URL_HERE") {
    setStatus_("Not connected yet. Step H will paste your Apps Script Web App URL into app.js.");
    return;
  }

  // In Step H we’ll do:
  // 1) setStatus_("Fetching comments…")
  // 2) POST to Apps Script
  // 3) setStatus_("Writing spreadsheet…")
  // 4) Done + enable Open Spreadsheet

  setStatus_("Connected, but wiring is done in Step H. (URL is set.)");
  setDebug_({
    note: "In Step H we will POST to your Web App URL with { redditUrl, prompt }",
    webAppUrl: APPS_SCRIPT_WEB_APP_URL,
  });
}

// Button click: Open spreadsheet
function onOpenClick_() {
  if (!latestSpreadsheetUrl) return;
  window.open(latestSpreadsheetUrl, "_blank", "noopener,noreferrer");
}

// Wire up events
el.runBtn.addEventListener("click", onRunClick_);
el.openBtn.addEventListener("click", onOpenClick_);

// Start blank every time
resetUI_();
