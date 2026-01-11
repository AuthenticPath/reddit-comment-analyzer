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
const APPS_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwubf0vJtjVTAhkqTIiJStyDIVPXd5gCyyYyhStxFIOw7-Lfk_5X31CcIu3I3lxVyRSLA/exec";

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

  if (APPS_SCRIPT_WEB_APP_URL === "PASTE_YOUR_WEB_APP_URL_HERE") {
    setStatus_("Not connected yet. Paste your Apps Script Web App URL into app.js.");
    return;
  }

  // Disable run button during the request (prevents double-click spam)
  el.runBtn.disabled = true;

  try {
    // 1) User-facing status: Fetching
    setStatus_("Fetching comments from Reddit…");

    // Build request payload
    const payload = {
      redditUrl: el.redditUrl.value.trim(),
      prompt: el.prompt.value.trim(),
    };

    // 2) Call Apps Script Web App
    const resp = await fetch(APPS_SCRIPT_WEB_APP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      // Apps Script doPost can be picky about CORS + content-type.
      // Sending as "text/plain" with JSON string is a reliable pattern.
      body: JSON.stringify(payload),
    });

    // If we can’t even talk to the server, stop here
    if (!resp.ok) {
      throw new Error(`Network error: HTTP ${resp.status} ${resp.statusText}`);
    }

    // 3) Read JSON
    const data = await resp.json();
    setDebug_(data);

    // 4) Interpret Apps Script response
    if (!data.ok) {
      // Backend returned a clean error
      setStatus_(data.message || "Unknown error from backend.");
      return;
    }

    // 5) User-facing status: Writing (even though backend already wrote it,
    // we show this to match your UX requirement)
    setStatus_("Writing Google Sheet…");

    // 6) Success: store URL + enable Open button
    latestSpreadsheetUrl = data.spreadsheetUrl || "";
    if (latestSpreadsheetUrl) {
      el.openBtn.disabled = false;
    }

    // 7) Done
    const fetched = typeof data.commentsFetched === "number" ? data.commentsFetched : "?";
    const written = typeof data.commentsWritten === "number" ? data.commentsWritten : "?";
    setStatus_(`Done. Comments fetched: ${fetched}. Comments written: ${written}.`);

  } catch (err) {
    // Typical failure causes:
    // - CORS blocking
    // - Apps Script error
    // - Reddit OAuth issue
    // - Timeout
    setStatus_(`Failed: ${err.message}`);
    setDebug_(String(err && err.stack ? err.stack : err));
  } finally {
    el.runBtn.disabled = false;
  }
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
