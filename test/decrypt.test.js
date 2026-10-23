const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const os = require("node:os");
const path = require("node:path");
const {
  b64UrlDecode,
  decryptDomainsPayload,
  padKeyBytes,
} = require("../src/api/server/sources/decrypt");

const samplePayload =
  "wdeBruh3qqn_i5wUNnyaPcXqidp1UWP84FfPHzGyKXB5esl3XtDPsLVskpA5Nf5O_SxnfSE0xPHTv8qa2ChN7egDHsTBaxDf0aSavNCrvsr3eFuwmcSBPLEcvTZ3FCL14I1q1N8Fut7Rlf1IzY9BbRTdLFemq5h2_ssYRaCelVw.";

test("decodes Base64URL padding and strips trailing punctuation", () => {
  assert.deepEqual(
    b64UrlDecode(`${samplePayload}...`),
    b64UrlDecode(samplePayload.slice(0, -1)),
  );
});

test("pads key bytes with zeroes and truncates excess bytes", () => {
  assert.deepEqual(padKeyBytes("key", 5), Buffer.from([107, 101, 121, 0, 0]));
  assert.deepEqual(padKeyBytes("longer", 3), Buffer.from("lon"));
});

test("decrypts the supplied domains payload", () => {
  const result = decryptDomainsPayload(samplePayload);
  assert.ok(result && typeof result === "object");
});

test("loads project env keys when run outside the project directory", () => {
  const decryptModule = path.resolve(
    __dirname,
    "../src/api/server/sources/decrypt.js",
  );
  const script = `
    const { decryptDomainsPayload } = require(${JSON.stringify(decryptModule)});
    const result = decryptDomainsPayload(${JSON.stringify(samplePayload)});
    if (!result || typeof result !== "object") process.exit(1);
  `;
  const env = { ...process.env };
  delete env.ENC_KEY;
  delete env.DOMAINS_ENC_IV;
  delete env.ENC_KEY_SIZE;
  delete env.DOMAINS_ENC_IV_SIZE;

  const child = spawnSync(process.execPath, ["-e", script], {
    cwd: os.tmpdir(),
    env,
    encoding: "utf8",
  });

  assert.equal(child.status, 0, child.stderr || child.error?.message);
});
