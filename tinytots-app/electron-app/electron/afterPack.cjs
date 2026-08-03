/**
 * electron-builder excludes node_modules from extraResources by default.
 * Copy backend runtime deps (and .env) into resources after pack.
 */
const { cpSync, existsSync } = require("node:fs");
const path = require("node:path");

exports.default = async function afterPack(context) {
  const projectDir = context.packager.projectDir;
  const resourcesBackend = path.join(context.appOutDir, "resources", "backend");
  const srcNm = path.join(projectDir, "backend", "node_modules");
  const destNm = path.join(resourcesBackend, "node_modules");
  const srcEnv = path.join(projectDir, "backend", ".env");
  const destEnv = path.join(resourcesBackend, ".env");

  if (!existsSync(resourcesBackend)) {
    throw new Error(
      `afterPack: expected packaged backend at ${resourcesBackend} (extraResources missing?)`
    );
  }
  if (!existsSync(srcNm)) {
    throw new Error(
      "afterPack: backend/node_modules missing — run npm install in backend/"
    );
  }
  if (!existsSync(srcEnv)) {
    throw new Error(
      "afterPack: backend/.env missing — required for a packaged standalone POS"
    );
  }

  console.log("afterPack: copying backend/node_modules → resources/backend/node_modules");
  cpSync(srcNm, destNm, { recursive: true, force: true });
  cpSync(srcEnv, destEnv, { force: true });
  console.log("afterPack: backend runtime + .env ready");
};
