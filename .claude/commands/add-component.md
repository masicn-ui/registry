Add a new component to the registry. Component name: $ARGUMENTS

## What already exists in the registry:
!`node -e "const r=require('./registry.json'); console.log(r.components.map(c=>c.name).join(', '))" 2>/dev/null`

## Source from Playground (if synced):
!`find /Users/varun/Dev/masicn-ui/Playground/src/shared/components/$ARGUMENTS /Users/varun/Dev/masicn-ui/Playground/src/shared/blocks/$ARGUMENTS -type f 2>/dev/null || echo "Not found in Playground — have you run npm run sync from Playground first?"`

To add `$ARGUMENTS` to the registry:

1. **Check**: Has this been authored and tested in Playground? Has `npm run sync` been run? The sync script should have created the files here automatically.

2. **Create component.json** at `components/$ARGUMENTS/component.json` with:
   - `name`, `displayName`, `description`, `category`
   - `version`: "1.0.0"
   - `files`: list each file with `path` (relative) and `target` (destination in user project)
   - `masicnVersion`: "^0.1.0" (or current minimum)
   - `peerDependencies`: check what the component imports beyond `@masicn/ui`
   - `registryDependencies`: other registry components this depends on
   - `hasTests`: true/false
   - `hasAccessibility`: true/false

3. **Add to registry.json**: insert entry with name, version, category, path.

4. **Run**: `npm run validate` to confirm the entry is valid.

Do not copy component source manually — that's the sync script's job.
