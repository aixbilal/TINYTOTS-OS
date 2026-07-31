// Temporary QA capture: screenshot the harness at 1920x1080 and print the
// measurement probe output. Delete after QA.
import { execFileSync } from "node:child_process";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const out = process.argv[2] || "shot.png";

execFileSync(CHROME, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--force-device-scale-factor=1",
  "--window-size=1920,1080",
  "--virtual-time-budget=5000",
  `--screenshot=c:/TINYTOTS OS/.qa/${out}`,
  "http://localhost:4020/",
], { stdio: ["ignore", "ignore", "ignore"] });

const dom = execFileSync(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    "--window-size=1920,1080",
    "--virtual-time-budget=5000",
    "--dump-dom",
    "http://localhost:4020/",
  ],
  { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] }
);

const match = dom.match(/<pre id="qa-probe"[^>]*>([\s\S]*?)<\/pre>/);
if (!match) {
  console.log("probe missing");
} else {
  console.log(match[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"));
}
