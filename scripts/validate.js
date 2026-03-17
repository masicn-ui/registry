#!/usr/bin/env node
// Usage:
//   node scripts/validate.js button         — validate a single component
//   node scripts/validate.js form --block   — validate a block
//   node scripts/validate.js --all          — validate all components + blocks
//   yarn validate button
//   yarn validate:all

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY_JSON = path.join(ROOT, 'registry.json');

// ── ANSI colours ─────────────────────────────────────────────────────────────
const green  = (s) => `\x1b[32m${s}\x1b[0m`;
const red    = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const bold   = (s) => `\x1b[1m${s}\x1b[0m`;

// ── Semver check (simple) ─────────────────────────────────────────────────────
function isValidSemver(v) {
  return /^\d+\.\d+\.\d+$/.test(v);
}

// ── Load registry index ───────────────────────────────────────────────────────
function loadRegistryIndex() {
  try {
    const raw = fs.readFileSync(REGISTRY_JSON, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.error(red(`✘ Cannot read registry.json: ${e.message}`));
    process.exit(1);
  }
}

// ── Validate a single component.json ─────────────────────────────────────────
function validateComponent(name, isBlock = false) {
  const kind = isBlock ? 'blocks' : 'components';
  const dir = path.join(ROOT, kind, name);
  const jsonPath = path.join(dir, 'component.json');
  const errors = [];

  // 1. component.json must exist
  if (!fs.existsSync(jsonPath)) {
    return { name, ok: false, errors: [`component.json not found at ${path.relative(ROOT, jsonPath)}`] };
  }

  let entry;
  try {
    entry = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  } catch (e) {
    return { name, ok: false, errors: [`component.json is invalid JSON: ${e.message}`] };
  }

  // 2. Required top-level fields
  const required = ['name', 'displayName', 'description', 'category', 'version', 'files', 'masicnVersion', 'hasTests', 'hasAccessibility'];
  for (const field of required) {
    if (entry[field] === undefined || entry[field] === null) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  // 3. name must match directory name
  if (entry.name && entry.name !== name) {
    errors.push(`"name" field "${entry.name}" does not match directory name "${name}"`);
  }

  // 4. version must be semver
  if (entry.version && !isValidSemver(entry.version)) {
    errors.push(`"version" must be semver (e.g. "1.0.0"), got "${entry.version}"`);
  }

  // 5. All listed files must exist on disk
  if (Array.isArray(entry.files)) {
    for (const file of entry.files) {
      if (!file.path) {
        errors.push(`A file entry is missing the "path" field`);
        continue;
      }
      const filePath = path.join(dir, file.path);
      if (!fs.existsSync(filePath)) {
        errors.push(`File listed in "files" not found on disk: ${file.path}`);
      }
    }
  }

  // 6. registryDependencies must exist in registry.json
  if (Array.isArray(entry.registryDependencies) && entry.registryDependencies.length > 0) {
    const registry = loadRegistryIndex();
    const allNames = new Set([
      ...registry.components.map((c) => c.name),
      ...registry.blocks.map((b) => b.name),
    ]);
    for (const dep of entry.registryDependencies) {
      if (!allNames.has(dep)) {
        errors.push(`registryDependency "${dep}" not found in registry.json`);
      }
    }
  }

  // 7. props array structure (if present)
  if (entry.props !== undefined) {
    if (!Array.isArray(entry.props)) {
      errors.push(`"props" must be an array`);
    } else {
      entry.props.forEach((prop, i) => {
        const propRequired = ['name', 'type', 'required', 'description'];
        for (const field of propRequired) {
          if (prop[field] === undefined) {
            errors.push(`props[${i}] is missing required field: "${field}"`);
          }
        }
      });
    }
  } else {
    // Warn (not error) when props is missing — it's expected to be filled in
    errors.push(yellow(`  ⚠ "props" array is missing — add props for docs generation`));
  }

  return { name, ok: errors.filter((e) => !e.includes('⚠')).length === 0, errors };
}

// ── Print result ──────────────────────────────────────────────────────────────
function printResult({ name, ok, errors }) {
  if (ok) {
    const warnings = errors.filter((e) => e.includes('⚠'));
    if (warnings.length > 0) {
      console.log(`${yellow('⚠')} ${bold(name)}`);
      warnings.forEach((w) => console.log(`  ${w}`));
    } else {
      console.log(`${green('✔')} ${bold(name)} — valid`);
    }
  } else {
    console.log(`${red('✘')} ${bold(name)}`);
    errors.forEach((e) => {
      if (e.includes('⚠')) {
        console.log(`  ${e}`);
      } else {
        console.log(`  ${red('→')} ${e}`);
      }
    });
  }
  return ok;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

if (args.includes('--all')) {
  // Validate everything
  const registry = loadRegistryIndex();
  let passed = 0;
  let failed = 0;

  console.log(bold('\nComponents:'));
  for (const entry of registry.components) {
    const result = validateComponent(entry.name, false);
    const ok = printResult(result);
    ok ? passed++ : failed++;
  }

  console.log(bold('\nBlocks:'));
  for (const entry of registry.blocks) {
    const result = validateComponent(entry.name, true);
    const ok = printResult(result);
    ok ? passed++ : failed++;
  }

  const total = passed + failed;
  console.log(`\n${bold('Results:')} ${green(`${passed} passed`)}, ${failed > 0 ? red(`${failed} failed`) : `0 failed`} (${total} total)`);
  process.exit(failed > 0 ? 1 : 0);

} else {
  // Validate a single component
  const name = args.find((a) => !a.startsWith('--'));
  const isBlock = args.includes('--block');

  if (!name) {
    console.error(red('Usage: node scripts/validate.js <component-name> [--block] [--all]'));
    console.error('  node scripts/validate.js button');
    console.error('  node scripts/validate.js form --block');
    console.error('  node scripts/validate.js --all');
    process.exit(1);
  }

  const result = validateComponent(name, isBlock);
  const ok = printResult(result);
  process.exit(ok ? 0 : 1);
}
