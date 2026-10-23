const crypto = require("node:crypto");
const { log } = require("node:console");
const {
  port,
  enc_key,
  enc_iv,
  enc_key_size,
  enc_iv_size,
} = require("./../../../config");

function padKeyBytes(input, length) {
  const buf = Buffer.alloc(length, 0);
  const source = Buffer.from(String(input || ""), "utf8");
  source.copy(buf, 0, 0, Math.min(source.length, length));
  return buf;
}

function b64UrlDecode(input) {
  let base64 = String(input || "")
    .trim()
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const remainder = base64.length % 4;
  if (remainder) {
    base64 += "=".repeat(4 - remainder);
  }
  return Buffer.from(base64, "base64");
}

function decryptDomainsPayload(input) {
  const keySize = Number(enc_key_size) || 32;
  const ivSize = Number(enc_iv_size) || 16;

  const key = padKeyBytes(enc_key, keySize);
  const iv = padKeyBytes(enc_iv, ivSize);

  // Correct calculation: 32 bytes * 8 = 256 bits -> "aes-256-cbc"
  const algorithm = `aes-${keySize * 8}-cbc`;
  const ciphertext = b64UrlDecode(input);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
}

module.exports = {
  b64UrlDecode,
  padKeyBytes,
  decryptDomainsPayload,
};