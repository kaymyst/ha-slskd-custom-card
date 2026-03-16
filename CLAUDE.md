# CLAUDE.md — slskd Custom Card for Home Assistant

## Project Overview

This is a single-file Home Assistant custom Lovelace card (`slskd-card.js`) that provides a UI for searching and downloading music via [slskd](https://github.com/slskd/slskd) (a Soulseek client), integrated through a Home Assistant custom integration.

- **Type:** Home Assistant Custom Lovelace Card (HACS-compatible)
- **Technology:** Lit-Element Web Component (vanilla JavaScript, no build step)
- **License:** MIT

---

## Repository Structure

```
ha-slskd-custom-card/
├── slskd-card.js       # Main (and only) source file — the entire card component
├── mockup.html         # Interactive visual mockup for local development/testing
├── hacs.json           # HACS distribution metadata
├── README.md           # User-facing installation and configuration documentation
└── LICENSE             # MIT License
```

There is no build system, no package.json, no TypeScript, and no test framework. The single file `slskd-card.js` is deployed directly.

---

## Architecture

### `slskd-card.js`

The card is implemented as a Lit-Element Web Component registered as `custom:slskd-card`.

**Class:** `SlskdCard extends LitElement`

#### Reactive Properties

| Property      | Type    | Description                              |
|---------------|---------|------------------------------------------|
| `hass`        | Object  | Home Assistant instance (injected by HA) |
| `config`      | Object  | Card configuration from Lovelace YAML    |
| `_searchText` | String  | Local state for the search input field   |

#### Key Methods

**Configuration**
- `setConfig(config)` — Validates required entities; throws on missing fields
- `getCardSize()` — Returns `4` (HA layout hint)

**Computed Getters** (prefix: `_`)
- `_connectionState` — Boolean from `connection_entity` binary sensor
- `_searchState` / `_downloadState` — Sensor state objects from `hass.states`
- `_results` — Parsed JSON attributes, capped at 10 items
- `_searchStatus` — Current search progress string
- `_totalFound` — Integer count of total results

**Event Handlers** (prefix: `_handle`)
- `_handleSearch()` — Calls `slskd.search` HA service
- `_handleDownload(result)` — Calls `slskd.download` HA service
- `_handleKeyDown(e)` — Triggers search on Enter
- `_handleInput(e)` — Updates `_searchText`

**Render Methods** (prefix: `_render`)
- `render()` — Main template; assembles all sub-renders
- `_renderHeader()` — Title + animated connection dot
- `_renderSearch()` — Search input bar
- `_renderStatus()` — Results count + status badge
- `_renderEmpty()` — Idle/searching spinner state
- `_renderResults(results)` — Scrollable results list
- `_renderDownload(dlState)` — Download progress bar

**Utilities**
- `_extractFilename(path)` — Parses Windows-style file paths
- `_formatSize(bytes)` — Formats bytes to human-readable KB/MB

---

## Configuration (User YAML)

```yaml
type: custom:slskd-card
search_entity: sensor.slskd_last_search_result_total
download_entity: sensor.slskd_last_download_status
connection_entity: switch.slskd_connection
title: slskd   # optional
```

All three entity fields are required. `setConfig()` throws an error if any are missing.

---

## Styling Conventions

Styles are defined in a `static get styles()` CSS template literal inside the class.

**Color palette (CSS variables):**
- Accent: `#d4a54a` (warm gold)
- Success/connected: `#30d158` (green)
- Disconnected: `#ff453a` (red)
- Background: `#1c1c1e` (dark)
- Border: `#3a3a3c`

**Rules:**
- Dark theme optimized; adapts to HA theme via CSS custom properties where possible
- Mobile styles use `@media (hover: none)` — do not use pointer-type media queries
- Animations: `pulse-dot` (connection indicator), `spin` (search spinner)
- No external CSS frameworks; all styles are self-contained within the component

---

## Development Workflow

### Making Changes

1. Edit `slskd-card.js` directly — there is no compilation or transpilation step.
2. Preview changes locally by opening `mockup.html` in a browser. It contains toggle buttons for all card states (idle, searching, with results, downloading).
3. Deploy by copying `slskd-card.js` to your HA `www/` directory (manual install) or via HACS.

### Testing

There is no automated test suite. Validate changes using:
1. `mockup.html` — covers all visual states with mock data
2. Live testing in a real Home Assistant instance

### Adding New States or Features

- Add new computed getters for new entity data
- Add a corresponding `_render*()` method for new UI sections
- Keep private methods/properties prefixed with `_`
- Do not introduce external dependencies — this must remain a single deployable JS file with no build step

---

## HACS Distribution

`hacs.json` configures this as a HACS Frontend (Dashboard) integration:
- `"content_in_root": true` — `slskd-card.js` is in the repository root
- `"filename": "slskd-card.js"` — explicit entry point
- `"render_readme": true` — README shown in HACS UI

When updating, ensure `slskd-card.js` is always at the repository root. Do not move it or add a `dist/` build output directory without updating `hacs.json`.

---

## Key Constraints for AI Assistants

- **No build system.** Do not introduce webpack, rollup, vite, or any bundler unless explicitly requested.
- **No npm/package.json.** Do not add a `package.json` or node_modules.
- **Single-file principle.** All card logic must remain in `slskd-card.js`. Do not split into modules.
- **No TypeScript.** Keep this as plain JavaScript (ES2020+).
- **No external runtime dependencies.** Lit is loaded from HA's built-in Lit bundle via `import` from a CDN/HA path, not bundled locally.
- **Backward compatibility.** The card must work with HA's HACS frontend loader which loads the file directly in the browser. Use only browser-native APIs.
- **Do not rename `slskd-card.js`.** This filename is referenced in `hacs.json` and user documentation.
