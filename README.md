# masicn registry

Component template registry for [masicn](https://github.com/masicn-ui) — the copy-paste React Native UI ecosystem.

This repo holds the source files and metadata for every component and block that the [masicn CLI](https://www.npmjs.com/package/masicn) can install. You don't use this repo directly — the CLI fetches from it over GitHub raw URLs.

**Built from scratch by [Manish Kumar](https://manishh.in) ([@lordofthemind](https://github.com/lordofthemind)) at [skipp.co.in](https://skipp.co.in)**

> **मसि** (masi) means _ink_ in Sanskrit and several Indian languages. Just as ink is the medium for writing anything, masicn is the medium for building anything in React Native.

## How It Works

```
registry/
├── registry.json              ← index: all components + blocks listed here
├── components/
│   └── button/
│       ├── component.json     ← metadata (props, deps, version, files)
│       └── Button.tsx         ← the actual source file copied into user projects
└── blocks/
    └── otp-input/
        ├── component.json
        └── OtpInput.tsx
```

When a user runs `npx masicn add button`, the CLI:
1. Reads `registry.json` to find the component's path
2. Fetches `components/button/component.json` for metadata and file list
3. Fetches `components/button/Button.tsx` and copies it into the user's project
4. Resolves any `registryDependencies` and installs those too

## Components (55+)

### Core
`avatar` `avatar-group` `badge` `button` `card` `chip` `image` `key-value-row` `link` `pin-display` `read-more` `status-dot` `tag`

### Feedback
`alert` `bottom-sheet` `left-sheet` `loading-overlay` `modal` `progress` `progress-circle` `right-sheet` `shimmer` `skeleton` `snackbar` `spinner` `toast` `top-sheet`

### Form
`checkbox` `checkbox-group` `password-input` `radio` `radio-group` `segmented-control` `select` `slider` `switch` `text-input` `toggle-button-group`

### Interactive
`animated-card` `animated-number` `rating`

### Layout
`masonry-grid` `refreshable-list` `refreshable-scroll-view` `screen-layout`

### Navigation
`accordion` `collapsible` `fab` `list-item` `search-bar` `tabs`

### Overlay
`context-menu` `menu` `popover` `tooltip`

## Blocks (17)

Pre-built screens and flows with multiple components composed together.

`action-sheet` `breadcrumb` `carousel` `confirm-dialog` `date-input` `empty-state` `form` `multi-select` `number-input` `otp-input` `pagination` `phone-input` `split-sheet` `step-indicator` `swipeable` `tag-input` `timeline`

## `component.json` Schema

Every component and block has a `component.json` file that describes it:

```json
{
  "name": "button",
  "displayName": "Button",
  "description": "Pressable button with multiple variants...",
  "category": "core",
  "version": "0.0.1",
  "masicnVersion": "^0.0.1",
  "files": [
    { "path": "Button.tsx", "target": "Button.tsx", "type": "component" }
  ],
  "peerDependencies": {},
  "registryDependencies": [],
  "tags": ["interactive", "pressable"],
  "hasTests": false,
  "hasAccessibility": true,
  "props": [
    {
      "name": "variant",
      "type": "'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'",
      "default": "primary",
      "required": false,
      "description": "Visual style variant"
    }
  ]
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Kebab-case identifier used in CLI commands |
| `displayName` | `string` | Human-readable name |
| `description` | `string` | Short description shown in `masicn info` and `masicn list` |
| `category` | `string` | Groups components in `masicn list` |
| `version` | `string` | Component version (semver) |
| `masicnVersion` | `string` | Required `@masicn/ui` version constraint |
| `files` | `RegistryFile[]` | Files to copy into the user's project |
| `peerDependencies` | `Record<string, string>` | npm packages the component needs |
| `registryDependencies` | `string[]` | Other masicn components this one depends on |
| `tags` | `string[]` | Search/filter tags |
| `hasTests` | `boolean` | Whether test files are included |
| `hasAccessibility` | `boolean` | Whether accessibility props are included |
| `props` | `PropDefinition[]` | Props table shown in `masicn info` |
| `subComponentProps` | `Record<string, PropDefinition[]>` | Props for sub-components (e.g. `Item`, `Trigger`) |

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

## `registry.json` Index

The root `registry.json` is the index the CLI fetches first. It lists every component and block with enough info to display them without fetching individual `component.json` files.

```json
{
  "version": "0.0.1",
  "baseUrl": "https://raw.githubusercontent.com/masicn-ui/registry/master",
  "components": [
    {
      "name": "button",
      "version": "0.0.1",
      "category": "core",
      "path": "components/button/component.json"
    }
  ],
  "blocks": [...]
}
```

## Adding a New Component

1. Create `components/<name>/` directory
2. Write the component source file — use primitives and tokens from `@masicn/ui`
3. Write `component.json` with full metadata including the `props` array
4. Add an entry to `registry.json` under `components` or `blocks`

**Guidelines:**
- Components in this registry target **React Native CLI** projects only (not Expo) — do not use Expo-specific APIs
- Import only from `@masicn/ui` — no external UI libraries
- Use `useTheme()` for colors, `useTokens()` for spacing/radius/etc
- Set `hasAccessibility: true` only if the component includes `accessibilityLabel`, `accessibilityRole`, etc.
- List all `registryDependencies` — the CLI uses this for automatic installs
- `masicnVersion` should be `"^0.0.1"` unless a newer `@masicn/ui` API is required

## Adding a New Block

Same as above but in `blocks/<name>/`. Blocks are more opinionated, pre-composed screens or flows. They:
- Live in the user's `blocksDir` (default: `src/shared/blocks`) instead of `outputDir`
- Should have a `category` of `"blocks"` in `component.json`
- Usually depend on multiple registry components via `registryDependencies`

## License

[MIT](./LICENSE) — free to use, modify, and distribute. Copyright © 2026 [Skipp](https://skipp.co.in).

The component source files in this registry are MIT licensed. When the CLI copies them into a user's project, those files become part of that project and remain under MIT — the user owns them and can change, ship, or extend them freely with no restrictions.
