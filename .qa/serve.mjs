// Temporary static server for the QA harness. Delete after QA.
import http from "node:http";
import { readFileSync } from "node:fs";

const PORT = 4020;
http
  .createServer((req, res) => {
    const name = req.url === "/" ? "/harness.html" : req.url.split("?")[0];
    try {
      const body = readFileSync(new URL(`.${name}`, import.meta.url));
      res.writeHead(200, {
        "content-type": name.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream",
        "cache-control": "no-store",
      });
      res.end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  })
  .listen(PORT, () => console.log(`harness on http://localhost:${PORT}/`));
