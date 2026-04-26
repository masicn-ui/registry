# masicn registry

Component template registry for [masicn](https://github.com/masicn-ui) — the copy-paste React Native UI ecosystem.

This repo holds the source files and metadata for every component and block that the [masicn CLI](https://www.npmjs.com/package/masicn) can install. You don't use this repo directly — the CLI fetches from it over GitHub raw URLs.

**Built from scratch by [Manish Kumar](https://manishh.in) ([@lordofthemind](https://github.com/lordofthemind))**

> **मसि** (masi) means _ink_ in Sanskrit and several Indian languages. Just as ink is the medium for writing anything, masicn is the medium for building anything in React Native.

## How It Works

```
registry/
├── registry.json               ← index: all components + blocks
├── components/
│   └── button/
│       ├── component.json      ← metadata (props, deps, version, files, examples)
│       └── Button.tsx          ← source file copied into user projects
└── blocks/
    └── action-sheet/
        ├── component.json
        └── ActionSheet.tsx
```

When a user runs `npx masicn add button`, the CLI:
1. Reads `registry.json` to find the component's path
2. Fetches `components/button/component.json` for metadata and file list
3. Fetches `components/button/Button.tsx` and copies it into the user's project
4. Rewrites import paths to match the user's project structure
5. Resolves any `registryDependencies` and installs those too

## Components (54)

| Category | Components |
|----------|-----------|
| Display | `avatar` `avatar-group` `badge` `card` `dot` `expandable` `image` `link` `list-item` `tag` `ticker` |
| Feedback | `alert` `loader` `progress` `progress-ring` `shimmer` `skeleton` `snackbar` `spinner` `toast` |
| Actions | `button` `fab` `rating` `swipe-button` |
| Forms | `checkbox` `checkbox-group` `chip` `radio` `range-slider` `search-bar` `secure-input` `segment` `select` `slider` `switch` `text-input` `textarea` `toggle-group` |
| Navigation | `accordion` `collapsible` `detail-row` `dock` `pin` `tabs` |
| Overlays | `bottom-sheet` `context-menu` `drawer` `left-sheet` `menu` `modal` `popover` `right-sheet` `tooltip` `top-sheet` |

## Blocks (19)

Pre-composed screens and flows: `action-sheet` `breadcrumb` `carousel` `chip-input` `code-input` `confirm` `dual-sheet` `empty-state` `form` `json-tree` `masonry-grid` `numeric` `pagination` `phone` `refreshable-list` `refreshable-scroll-view` `stepper` `swipeable` `timeline`

## `component.json` Schema

Every component and block has a `component.json` file:

```json
{
  "name": "button",
  "displayName": "Button",
  "description": "Pressable button with multiple variants, sizes, loading state, and icon slots.",
  "category": "buttons",
  "version": "0.0.2",
  "masicnVersion": "^0.0.1",
  "files": [
    { "path": "Button.tsx", "target": "Button.tsx", "type": "component" }
  ],
  "peerDependencies": {},
  "registryDependencies": [],
  "tags": ["interactive", "pressable"],
  "hasTests": true,
  "hasAccessibility": true,
  "props": [
    {
      "name": "variant",
      "type": "'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'destructive'",
      "default": "primary",
      "required": false,
      "description": "Visual style variant of the button"
    }
  ],
  "examples": [
    {
      "label": "Example 1",
      "code": "<Button variant=\"primary\" onPress={handleSave}>Save</Button>"
    }
  ],
  "aiPrompt": "Use for primary actions, form submission, and navigation triggers.",
  "aiUsagePattern": "<Button variant=\"primary\" onPress={handleAction}>Label</Button>"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | ✓ | Kebab-case identifier used in CLI commands |
| `displayName` | `string` | ✓ | Human-readable name |
| `description` | `string` | ✓ | Short description shown in `masicn info` and `masicn list` |
| `category` | `string` | ✓ | Groups components in `masicn list` |
| `version` | `string` | ✓ | Component version (semver) |
| `masicnVersion` | `string` | ✓ | Required `@masicn/ui` version constraint |
| `files` | `RegistryFile[]` | ✓ | Files to copy into the user's project |
| `hasTests` | `boolean` | ✓ | Whether test files are included |
| `hasAccessibility` | `boolean` | ✓ | Whether accessibility props are included |
| `peerDependencies` | `Record<string, string>` | — | npm packages the component needs (CLI installs these) |
| `registryDependencies` | `string[]` | — | Other masicn component names this one depends on |
| `tags` | `string[]` | — | Search/filter tags used by `masicn search` |
| `props` | `PropDefinition[]` | — | Props table shown in `masicn info` |
| `subComponentProps` | `Record<string, PropDefinition[]>` | — | Props for sub-components (e.g. `Accordion.Item`) |
| `examples` | `ComponentExample[]` | — | Usage examples (auto-extracted from JSDoc `@example` blocks) |
| `aiPrompt` | `string` | — | One-line hint for AI tools about when to use this component |
| `aiUsagePattern` | `string` | — | Canonical usage snippet for AI code generation |
| `migration` | `ComponentMigration` | — | Breaking-change migration metadata (used by `masicn migrate`) |

### `RegistryFile`

```json
{ "path": "Button.tsx", "target": "Button.tsx", "type": "component" }
```

- `path` — filename in this registry repo
- `target` — destination filename in the user's project
- `type` — `"component"` | `"test"` | `"style"` | `"util"`

### `PropDefinition`

```json
{
  "name": "variant",
  "type": "'primary' | 'secondary'",
  "default": "primary",
  "required": false,
  "description": "Visual style variant"
}
```

### `ComponentExample`

```json
{
  "label": "Example 1",
  "code": "<Button variant=\"primary\" onPress={handleSave}>Save</Button>"
}
```

Examples are automatically extracted from JSDoc `@example` blocks in the source `.tsx` file on each sync.

### `ComponentMigration`

```json
{
  "from": "0.0.1",
  "to": "0.0.2",
  "breakingChanges": ["Renamed prop `danger` → `variant=\"destructive\"`"],
  "autoFixable": true,
  "transforms": [
    { "type": "rename-prop", "from": "danger", "to": "variant", "value": "destructive" }
  ]
}
```

Used by `masicn migrate` to auto-apply prop renames and variant changes.

## `registry.json` Index

The root `registry.json` is the index the CLI fetches first:

```json
{
  "schemaVersion": "1.0",
  "version": "0.0.2",
  "baseUrl": "https://raw.githubusercontent.com/masicn-ui/registry/master",
  "components": [
    {
      "name": "button",
      "version": "0.0.2",
      "category": "buttons",
      "path": "components/button/component.json"
    }
  ],
  "blocks": [...]
}
```

## Contributing a Component

1. Create `components/<name>/` directory
2. Write the component source — use primitives and tokens from `@masicn/ui`
3. Add JSDoc `@example` blocks to the exported component (auto-extracted by the CLI sync)
4. Write `component.json` with full metadata including the `props` array
5. Add an entry to `registry.json` under `components` or `blocks`

**Guidelines:**
- Components target **React Native CLI** projects only — do not use Expo-specific APIs
- Import only from `@masicn/ui` — no external UI libraries
- Use `theme.colors.*` for colors, `spacing.*` / `radius.*` from `useTokens()` for layout
- Never use raw numbers — always tokens
- Set `hasAccessibility: true` only if the component includes `accessibilityRole`, `accessibilityLabel`, `accessibilityHint`
- List all `registryDependencies` — the CLI uses this for automatic installs
- `masicnVersion` should be `"^0.0.1"` unless a newer `@masicn/ui` API is required
- Bump `version` whenever a prop, behavior, or visual output changes

## License

[MIT](./LICENSE) — free to use, modify, and distribute. Copyright © 2026 [Manish Kumar](https://manishh.in).

The component source files in this registry are MIT licensed. When the CLI copies them into a user's project, those files become part of that project and remain under MIT — the user owns them and can change, ship, or extend them freely.
