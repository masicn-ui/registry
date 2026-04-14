Validate the registry entry for $ARGUMENTS and report what's missing or wrong.

## Component files:
!`find components/$ARGUMENTS blocks/$ARGUMENTS -type f 2>/dev/null || echo "Component '$ARGUMENTS' not found in components/ or blocks/"`

## component.json:
!`cat components/$ARGUMENTS/component.json 2>/dev/null || cat blocks/$ARGUMENTS/component.json 2>/dev/null || echo "No component.json found"`

## Registry index entry:
!`node -e "const r=require('./registry.json'); const c=[...r.components,...(r.blocks||[])].find(x=>x.name==='$ARGUMENTS'); console.log(JSON.stringify(c,null,2))" 2>/dev/null || echo "Not in registry.json"`

## Validation output:
!`npm run validate 2>&1 | grep -A5 "$ARGUMENTS" || echo "Run npm run validate:all for full output"`

Check and report:
1. Is `component.json` schema-valid? (required: name, displayName, description, category, version, files, masicnVersion)
2. Do all files listed in `files[]` actually exist?
3. Is this component in `registry.json`?
4. Are `registryDependencies` all valid names that exist in the registry?
5. Are `peerDependencies` consistent with what the component actually imports?
6. Does the component source import anything other than `@masicn/ui`, React Native, and its declared peer deps?
