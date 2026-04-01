# CLAUDE.md — Registry (`@masicn/registry`)

## What This Is

`registry/` is the **component template store**. It is a collection of TypeScript source files and JSON metadata — not an installable package. The CLI reads from it over HTTPS (raw GitHub) to copy component source into user projects.

The registry is the **distribution layer** of masicn. Users never install it directly. They get its contents via `npx masicn add <component>`.

## Role in the Monorepo

```
Playground/src/shared/  →  npm run sync  →  registry/components/ + registry/blocks/
registry/               →  fetched by    →  CLI  →  user projects
```

**Source of truth**: `Playground/src/shared/` is where components are authored and tested. The registry is populated by running `npm run sync` from Playground. **Never edit registry component source directly** — it will be overwritten on the next sync.

## Structure

```
registry/
├── registry.json                   # Master index — all components and blocks
├── schema/
│   └── masicn.json                 # JSON Schema for user project masicn.json config
├── components/
│   └── <name>/
│       ├── component.json          # Metadata: deps, files, props, tags
│       └── <Name>.tsx              # Component source (copied verbatim to user projects)
└── blocks/
    └── <name>/
        ├── component.json
        └── <Name>.tsx
```

## Component Metadata (`component.json`)

Each component entry declares:
- `name`, `displayName`, `description`, `category`, `version`
- `files` — which files to copy and where (`target` path in user's project)
- `masicnVersion` — minimum `@masicn/ui` version required
- `peerDependencies` — e.g. `react-native-reanimated >=3.0.0`
- `registryDependencies` — other registry components this one depends on
- `props` — prop definitions used by the docs site for prop tables
- `hasTests`, `hasAccessibility`

## Validation

```bash
npm run validate       # Validate all component.json files against schema
npm run validate:all   # Full validation including registry.json index
```

Run validation before committing any changes to the registry.

## Component vs Block

| | Component | Block |
|--|-----------|-------|
| Location | `components/<name>/` | `blocks/<name>/` |
| Nature | Self-contained, reusable | Composed pattern, "copy and own" |
| Examples | Button, Card, Modal | Form, OTPInput, DateInput, Swipeable |
| Import style | Imported by other components | Copied once, modified freely |

## Peer Dependency Groups (reference)

- **No deps**: button, card, text, avatar, badge, chip, tag, divider, alert, modal
- **Reanimated only**: spinner, skeleton, shimmer, progress, progress-circle, toast, snackbar, tabs, collapsible, accordion, animated-card, animated-number
- **Reanimated + Gesture Handler**: bottom-sheet, top-sheet, left-sheet, right-sheet, carousel, swipeable, image (pinch zoom), slider
- **Safe area context**: all screen/layout components

## Adding a New Component

1. Author and test in `Playground/src/shared/components/<name>/`
2. Run `npm run sync` from Playground (this copies source here and creates `component.json`)
3. Fill in missing `component.json` fields (props, tags, peer deps)
4. Run `npm run validate`
5. Add entry to `registry.json`

Never add a component to the registry that hasn't been tested in Playground first.
