import sharp from "sharp";

const REF1 =
  "C:/Users/H P/.cursor/projects/c-TINYTOTS-OS/assets/c__Users_H_P_AppData_Roaming_Cursor_User_workspaceStorage_896ee47a7df66c34fc6e9028e28fe44a_images_ae3d196a-6902-4e08-a98b-f06c9df715ff-556ce040-b131-40ed-8546-0bb33f5bf15d.png";
const REF2 =
  "C:/Users/H P/.cursor/projects/c-TINYTOTS-OS/assets/c__Users_H_P_AppData_Roaming_Cursor_User_workspaceStorage_896ee47a7df66c34fc6e9028e28fe44a_images_6dbe90aa-650f-4446-9c4d-c75868f022d7-12751b53-25d2-4d66-9ea3-e511032f5344.png";
const CUR = "c:/TINYTOTS OS/.qa/current-01.png";
const W = 1920;
const H = 1080;

async function resizeTo(f) {
  return sharp(f).resize(W, H, { fit: "fill" }).png().toBuffer();
}

async function rowProfile(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const rows = [];
  for (let y = 0; y < H; y++) {
    let s = 0;
    for (let x = 0; x < W; x += 3) {
      const i = (y * W + x) * ch;
      s += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    rows.push(s / (W / 3));
  }
  return { rows, data, ch };
}

async function colProfile(data, ch, y0, y1) {
  const cols = [];
  for (let x = 0; x < W; x++) {
    let s = 0;
    let c = 0;
    for (let y = y0; y < y1; y += 2) {
      const i = (y * W + x) * ch;
      s += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      c++;
    }
    cols.push(s / c);
  }
  return cols;
}

function findDarkFooter(rows) {
  let start = H;
  for (let y = H - 1; y > H * 0.7; y--) {
    if (rows[y] < 95) start = y;
    else if (start < H) break;
  }
  return { start, pct: +(100 * start / H).toFixed(2), hPct: +(100 * (H - start) / H).toFixed(2) };
}

const files = [
  ["REF_DENIM", REF1],
  ["REF_WINTER", REF2],
  ["CURRENT", CUR],
];

for (const [name, f] of files) {
  const meta = await sharp(f).metadata();
  const buf = name === "CURRENT" ? await sharp(f).png().toBuffer() : await resizeTo(f);
  const { rows, data, ch } = await rowProfile(buf);
  const foot = findDarkFooter(rows);
  const cols = await colProfile(data, ch, Math.floor(H * 0.22), Math.floor(H * 0.42));

  let artStart = null;
  let run = 0;
  for (let x = Math.floor(W * 0.15); x < W * 0.6; x++) {
    if (cols[x] < 210) {
      run++;
      if (run > 15) {
        artStart = x - 15;
        break;
      }
    } else run = 0;
  }

  let artEnd = null;
  run = 0;
  for (let x = W - 50; x > W * 0.55; x--) {
    if (cols[x] < 215) {
      run++;
      if (run > 12) {
        artEnd = x + 12;
        break;
      }
    } else run = 0;
  }

  // left margin via darker logo pixels near top
  let left = null;
  for (let x = 20; x < 400; x++) {
    let dark = 0;
    for (let y = Math.floor(H * 0.03); y < Math.floor(H * 0.12); y += 2) {
      const i = (y * W + x) * ch;
      const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (l < 140) dark++;
    }
    if (dark > 4) {
      left = x;
      break;
    }
  }

  const profile = [];
  for (let p = 0; p <= 100; p += 2) {
    const y = Math.min(H - 1, Math.floor((H * p) / 100));
    profile.push(`${p}:${Math.round(rows[y])}`);
  }

  console.log("\n===" + name + "===", meta.width + "x" + meta.height);
  console.log({
    footer: foot,
    leftPct: left != null ? +(100 * left / W).toFixed(2) : null,
    artStartPct: artStart != null ? +(100 * artStart / W).toFixed(2) : null,
    artEndPct: artEnd != null ? +(100 * artEnd / W).toFixed(2) : null,
    leftColWidthPct:
      artStart != null && left != null ? +(100 * (artStart - left) / W).toFixed(2) : null,
    bannerWidthPct:
      artStart != null && artEnd != null ? +(100 * (artEnd - artStart) / W).toFixed(2) : null,
    statsWidthPct: artEnd != null ? +(100 * (W - artEnd) / W).toFixed(2) : null,
  });
  console.log("rowLuma", profile.join(" "));
}

const refW = await resizeTo(REF2);
const refD = await resizeTo(REF1);
const cur = await sharp(CUR).resize(W, H, { fit: "fill" }).png().toBuffer();

await sharp({
  create: { width: W * 2, height: H, channels: 3, background: { r: 0, g: 0, b: 0 } },
})
  .composite([
    { input: refW, left: 0, top: 0 },
    { input: cur, left: W, top: 0 },
  ])
  .png()
  .toFile("c:/TINYTOTS OS/.qa/side-by-side-winter.png");

await sharp({
  create: { width: W * 2, height: H, channels: 3, background: { r: 0, g: 0, b: 0 } },
})
  .composite([
    { input: refD, left: 0, top: 0 },
    { input: cur, left: W, top: 0 },
  ])
  .png()
  .toFile("c:/TINYTOTS OS/.qa/side-by-side-denim.png");

console.log("\nwrote side-by-side images");
