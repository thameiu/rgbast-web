# RGBAST web

Frontend of [RGBAST](https://rgbast.com), a color palette editor that keeps the full history of every palette: each save is a snapshot, you can branch, merge and go back to any version.

Built with Vue 3, TypeScript and Vite. The API lives in [rgbast](https://github.com/thameiu/rgbast).

## Features

### Palette editor
`/users/<username>/<folders>/<palette>`

- Up to 15 colors, shown as full height columns
- Add, delete, move and lock colors, edit hex values and labels
- Generation from a harmony (analogous, complementary, triadic, split complementary, tetradic), with contrast, shades and base colors
- Color extraction from an image, done in the browser with rgbaster
- Undo and redo
- Unsaved changes are kept as local drafts, so nothing is lost on reload
- History panel: snapshot graph, branches, merge, revert, browsing older versions
- Accessibility audit: contrast between colors, against white and black, and color blindness previews
- Display settings and global adjustments
- Export to PNG, PDF, SVG, Adobe Illustrator and CSS, or copy the palette link. Image exports can use several fonts, including Inter and Comic Sans MS
- Interactive tutorial and a shortcut cheat sheet
- Palettes from other users are read only

### Color page
`/color/<hex>`

- Color picker with three modes: classic, RGB cube in 3D and OKLab in 3D (three.js)
- Color spaces, shades, tints and harmonies
- Contrast and color blindness previews
- Bast index ☥: how hard the color is to name, from 0 to 100
- Bookmark the color with a custom label

### Atelier
- `/atelier/palettes`: your palettes and their folder tree, the URL follows the open folder
- `/atelier/bookmarks`: your color bookmarks

### Other pages
- Landing page
- Discover (`/search`): recent palettes, palettes from colleagues, search by name or by color
- Profiles (`/users/<username>`): palettes, bookmarks, colleagues
- Account settings
- Registration, login, email verification and password reset
- About page

The interface is available in English and French.

## Keyboard shortcuts

| Keys | Action |
|---|---|
| `+` | Add a color |
| `1` to `9`, `A` to `F` | Select a color |
| `←` `→` | Move the selected color |
| `L` | Lock the selected color |
| `Delete` | Delete the selected color, or the last one |
| `Shift` `Delete` | Delete the first color |
| `Ctrl` `Delete` | Delete the palette |
| `Space` | Generate a palette |
| `Ctrl` `Space` | Generation settings |
| `Ctrl` `I` | Extract colors from an image |
| `Ctrl` `Z` | Undo |
| `Ctrl` `Y` or `Ctrl` `Shift` `Z` | Redo |
| `Ctrl` `S` | Save a snapshot |
| `Shift` `S` | Edit the palette |
| `S` | Share and export |
| `I` | Accessibility audit |
| `P` | Display settings |
| `Ctrl` `C` | Copy all colors |
| `Ctrl` `V` | Paste colors and add them |
| `Ctrl` `Shift` `V` | Paste colors and replace the palette |
| `H` | Shortcut cheat sheet |

## Stack

| | |
|---|---|
| Framework | Vue 3, Vue Router |
| Language | TypeScript |
| Build | Vite |
| Styles | Tailwind CSS 4 and per component CSS files |
| Animations | GSAP |
| 3D | three.js |
| Icons | Lucide |
| Image extraction | rgbaster |

## Getting started

You need Node.js 20.19 or later (22.12 or later on the 22 line), and the API running locally.

```sh
npm install
cp .env.example .env
npm run dev
```

The app runs on http://localhost:5173, which is already allowed by the API's CORS settings.

### Environment variables

| Variable | Description |
|---|---|
| `VITE_BACKEND_URL` | API address, for example `http://localhost:8000` |
| `BACKEND_URL` | Same, kept for compatibility. `VITE_BACKEND_URL` takes priority |

Both prefixes are exposed to the app through `envPrefix` in `vite.config.ts`.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Type check and production build into `dist/` |
| `npm run build-only` | Production build without type check |
| `npm run type-check` | Type check only (`vue-tsc`) |
| `npm run preview` | Serve the production build locally |

## Project layout

```
src/
  api/          one module per API resource, client.ts holds the base URL and token handling
  components/   shared components (palette, color, folder, layout, ui...)
  views/        one folder per page; large pages have their own components/ and composables/
  i18n/         en.json, fr.json
  router/       routes
  utils/        exports, OKLab, accessibility, palette constraints
  assets/       fonts, icons, global CSS
```

The palette editor is split into composables in `src/views/palette/composables/`: context, saving, history actions, keyboard, generation, undo, tutorial.

### Local storage

| Key | Content |
|---|---|
| `access_token` | JWT of the logged in user |
| `rgbast_palette_drafts` | Unsaved palette drafts |
| `rgbast_last_watched_color` | Last color opened on the color page |

### Translations

Every visible string goes through `src/i18n/en.json` and `src/i18n/fr.json`. Add a key to both files when adding text.

## Deployment

Each push on `main` runs the GitHub Actions workflow in `.github/workflows/deploy.yml`, which connects to the VPS over SSH and runs the `deploy-frontend` script there. Required secrets: `VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_SSH_KEY`.

`vercel.json` holds the rewrites for a Vercel deployment: `robots.txt` and the sitemaps are proxied to the API, every other path falls back to the single page app.
