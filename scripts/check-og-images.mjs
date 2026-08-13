import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("artifacts/scholr/public");
const extensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const files = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase()))
  .map((entry) => path.join(root, entry.name));

function dimensions(buffer, extension) {
  if (extension === ".png" && buffer.readUInt32BE(0) === 0x89504e47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }
  if (extension === ".webp" && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    if (buffer.toString("ascii", 12, 16) === "VP8X") {
      return {
        width: 1 + buffer.readUIntLE(24, 3),
        height: 1 + buffer.readUIntLE(27, 3),
      };
    }
    return null;
  }
  if (extension === ".jpg" || extension === ".jpeg") {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
  }
  return null;
}

const hashes = new Map();
let failed = false;
for (const file of files) {
  const buffer = fs.readFileSync(file);
  const extension = path.extname(file).toLowerCase();
  const size = dimensions(buffer, extension);
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const relative = path.relative(process.cwd(), file);
  if (!size) {
    console.warn(`WARN ${relative}: dimensions could not be read`);
    continue;
  }
  const ratio = size.width / size.height;
  if (size.width < 1200 || Math.abs(ratio - 16 / 9) > 0.02 || size.width * size.height < 300000) {
    console.error(`FAIL ${relative}: ${size.width}x${size.height} (requires >=1200px, 16:9, 300,000+ pixels)`);
    failed = true;
  } else {
    console.log(`PASS ${relative}: ${size.width}x${size.height}`);
  }
  if (hashes.has(hash)) {
    console.error(`FAIL ${relative}: duplicate image of ${hashes.get(hash)}`);
    failed = true;
  } else {
    hashes.set(hash, relative);
  }
}

if (failed) process.exitCode = 1;