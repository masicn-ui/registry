// File: scripts/validate.js
//
// Validates registry.json and every referenced component.json against the
// registry's own conventions. No build step, no dependencies — plain Node.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ALL = process.argv.includes('--all');

const REQUIRED_FIELDS = [
  'name',
  'displayName',
  'description',
  'category',
  'version',
  'masicnVersion',
  'files',
  'hasTests',
  'hasAccessibility',
];

const SEMVER_RE = /^\d+\.\d+\.\d+$/;

let errors = 0;
let checked = 0;

function fail(msg) {
  console.error(`\x1b[31m✗\x1b[0m ${msg}`);
  errors++;
}

function ok(msg) {
  console.log(`\x1b[32m✓\x1b[0m ${msg}`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

const registryPath = path.join(ROOT, 'registry.json');
if (!fs.existsSync(registryPath)) {
  fail(`registry.json not found at ${registryPath}`);
  process.exit(1);
}

const registry = readJson(registryPath);
const indexEntries = [...(registry.components ?? []), ...(registry.blocks ?? []), ...(registry.flows ?? [])];

for (const entry of indexEntries) {
  checked++;
  const componentJsonPath = path.join(ROOT, entry.path);

  if (!fs.existsSync(componentJsonPath)) {
    fail(`${entry.name}: referenced component.json not found at ${entry.path}`);
    continue;
  }

  let component;
  try {
    component = readJson(componentJsonPath);
  } catch (err) {
    fail(`${entry.name}: failed to parse ${entry.path} — ${err.message}`);
    continue;
  }

  for (const field of REQUIRED_FIELDS) {
    if (component[field] === undefined) {
      fail(`${entry.name}: missing required field "${field}" in ${entry.path}`);
    }
  }

  if (component.version && !SEMVER_RE.test(component.version)) {
    fail(`${entry.name}: version "${component.version}" is not valid semver`);
  }

  if (Array.isArray(component.files)) {
    const componentDir = path.dirname(componentJsonPath);
    for (const file of component.files) {
      if (!file.path) {
        fail(`${entry.name}: a files[] entry is missing "path"`);
        continue;
      }
      const filePath = path.join(componentDir, file.path);
      if (!fs.existsSync(filePath)) {
        fail(`${entry.name}: files[].path "${file.path}" does not exist on disk`);
      }
    }
  }
}

if (ALL) {
  if (!registry.schemaVersion) fail('registry.json is missing "schemaVersion"');
  if (!registry.version) fail('registry.json is missing "version"');
  if (!registry.baseUrl) fail('registry.json is missing "baseUrl"');

  for (const dir of ['components', 'blocks']) {
    const dirPath = path.join(ROOT, dir);
    if (!fs.existsSync(dirPath)) continue;

    const onDisk = fs.readdirSync(dirPath).filter((f) => fs.statSync(path.join(dirPath, f)).isDirectory());
    const indexed = new Set((registry[dir] ?? []).map((e) => e.name));

    for (const name of onDisk) {
      if (!indexed.has(name)) {
        fail(`${dir}/${name} exists on disk but has no entry in registry.json`);
      }
    }
    for (const name of indexed) {
      if (!onDisk.includes(name)) {
        fail(`registry.json indexes "${name}" but ${dir}/${name}/ does not exist on disk`);
      }
    }
  }
}

console.log(`\nChecked ${checked} registry entr${checked === 1 ? 'y' : 'ies'}${ALL ? ' (full validation)' : ''}.`);

if (errors > 0) {
  console.error(`\x1b[31m${errors} error(s) found.\x1b[0m`);
  process.exit(1);
}

ok('All registry entries valid.');
