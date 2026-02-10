"use strict";
const path = require("path");
const fs = require("fs");
const { loadConfig } = require("../core/config");
const { initState } = require("../core/state");
const { writeJsonAtomic, readJson } = require("../core/io");

async function main() {
  const ROOT = process.cwd();
  const { config, accounts } = loadConfig(ROOT);
  const { stateFile, state } = initState(ROOT, config, accounts);

  const removed = [];
  const keep = [];

  for (const a of accounts.alts) {
    const id = a.id || a.username;
    const auth = String(a.auth || "").toLowerCase();
    const st = state.alts?.[id];
    const isMs = auth.includes("micro") || auth.includes("microsoft") || auth.includes("ms");
    const offline = !st || st.sessionStatus !== "online";
    if (isMs && offline) {
      removed.push(id);
    } else {
      keep.push(a);
    }
  }

  if (!removed.length) {
    console.log("No offline Microsoft accounts found to remove.");
    return;
  }

  // Backup files
  const accFp = path.join(ROOT, "accounts.json");
  const accBak = accFp + ".bak." + Date.now();
  try { fs.copyFileSync(accFp, accBak); } catch (e) { /* ignore */ }

  try {
    const newAcc = { ...accounts, alts: keep };
    writeJsonAtomic(accFp, newAcc);
    // remove from state
    for (const id of removed) delete state.alts?.[id];
    writeJsonAtomic(stateFile, state);
    console.log(`Removed ${removed.length} offline Microsoft accounts:`);
    for (const id of removed) console.log(` - ${id}`);
    console.log(`Backup of accounts.json saved to ${accBak}`);
  } catch (e) {
    console.error("Failed to update accounts/state:", e?.message || e);
    process.exit(2);
  }
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });
