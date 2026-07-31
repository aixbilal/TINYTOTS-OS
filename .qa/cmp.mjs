// Temporary QA comparator: renders reference vs implementation crops. Delete after QA.
import { execFileSync } from "node:child_process";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const [x, y, w, h, z, out, shot] = process.argv.slice(2);
const zoom = Number(z || 2);
const width = Math.round(Number(w) * zoom);
const height = Math.round(Number(h) * zoom) * 2 + 20;
const url = `http://localhost:4020/compare.html?x=${x}&y=${y}&w=${w}&h=${h}&z=${zoom}&shot=${shot || "shot.png"}`;

execFileSync(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${width},${height}`,
    "--virtual-time-budget=4000",
    `--screenshot=c:/TINYTOTS OS/.qa/${out}`,
    url,
  ],
  { stdio: ["ignore", "ignore", "ignore"] }
);
console.log("wrote", out, `${width}x${height}`);
