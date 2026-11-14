// Index fără frontiere: catalog, căutare, comutare limbă/temă, fără rețea.
import path from "node:path"; import {fileURLToPath} from "node:url"; import {createRequire} from "node:module";
const require = createRequire(process.env.PW_ROOT || import.meta.url); const {chromium} = require("playwright");
const FILE = "file://" + path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "index.html");
let ok = 0, bad = 0; const check = (n, c, x) => { if (c) { ok++; console.log("  ok   " + n); } else { bad++; console.log("  FAIL " + n + (x !== undefined ? " -> " + JSON.stringify(x) : "")); } };
const b = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || undefined, args: ["--no-sandbox"]});
const errs = [], net = []; const ctx = await b.newContext({serviceWorkers: "block"}); await ctx.route(/^https?:/, r => { net.push(r.request().url()); r.abort(); });
const p = await ctx.newPage(); p.on("pageerror", e => errs.push(e.message)); await p.goto(FILE); await p.waitForTimeout(600);
const links = await p.locator("a[href^='http']").count(); check("catalogul are cel puțin 16 linkuri", links >= 16, links);
const ro = await p.evaluate(() => document.body.innerText); await p.click("#lang-btn"); await p.waitForTimeout(200);
check("comutarea limbii schimbă textul", (await p.evaluate(() => document.body.innerText)) !== ro);
const th = await p.evaluate(() => document.documentElement.getAttribute("data-theme")); await p.click("#theme-btn"); await p.waitForTimeout(100);
check("comutarea temei schimbă atributul", (await p.evaluate(() => document.documentElement.getAttribute("data-theme"))) !== th);
check("fără erori JS", errs.length === 0, errs); check("fără cereri de rețea", net.length === 0, net);
await b.close(); console.log(`\n${ok} ok, ${bad} eșuate`); process.exit(bad ? 1 : 0);
