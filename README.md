# Arma Reforger — Vanilla Fire Control System (FCS) & Tactical Map

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue?logo=github)](https://krsdq-pixel.github.io/arma-reforger-2/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet)](https://leafletjs.com/)

A high-precision fire control calculator and interactive tactical map built specifically for **Arma Reforger** vanilla mortar artillery and direct fire weapons.

Designed for mortar squads, forward observers, and fire direction centers (FDC) seeking instant, reliable firing solutions in both **NATO (6400)** and **Soviet / Warsaw Pact (60-00)** mil systems.

---

## 🗺️ Supported Vanilla Terrains

| Terrain | Map Dimensions | Available Layers | Native Zoom Levels |
| :--- | :--- | :--- | :--- |
| **Everon** | 12.8 km × 12.8 km (12,800m) | Topographic (`topo`), Satellite (`sat`), Tactical Drawn (`drawn`) | Zoom 0 to 7 (scaled to 9) |
| **Arland** | 4.1 km × 4.1 km (4,096m) | Topographic (`topo`), Satellite (`sat`), Tactical Drawn (`drawn`) | Zoom 0 to 7 (scaled to 9) |
| **Kolguyev** | 12.8 km × 12.8 km (12,800m) | Topographic (`topo`), Satellite (`sat`) | Zoom 0 to 7 (scaled to 9) |

- **True 1:1 In-Game Coordinates**: Powered by a custom Leaflet CRS matching Arma Reforger's meter grid coordinate system.
- **Arma Grid Reference**: Displays coordinates in standard 6-digit (100m) and 8-digit (10m) grid formats (`XXX ZZZ` / `XXXX ZZZZ`).
- **Tactical Points of Interest (POIs)**: 1-click targeting for major capitals, towns, villages, military compounds, and hills.
- **Interactive Measurement Ruler**: Multi-point distance, heading (degrees), and azimuth (mils) tool.

---

## 🎯 Ballistic Engine & Weapon Systems

### 1. 🇺🇸 American Mortar — M252 81mm (M821 HE)
- **Sight Scale**: M67 Sight Unit — **6400 NATO Mils** (1 mil ≈ 0.05625°, 17.78 mils/deg).
- **Elevation Range**: 800 mils (45.0°) to 1515 mils (85.2°).
- **Propellant Charge Rings (0 to 4)**:
  - **Ring 0**: 75m – 480m (Muzzle Velocity: 68 m/s, TOF: 7.9s – 12.8s)
  - **Ring 1**: 200m – 1,080m (Muzzle Velocity: 105 m/s, TOF: 11.1s – 20.2s)
  - **Ring 2**: 400m – 2,050m (Muzzle Velocity: 145 m/s, TOF: 14.9s – 27.8s)
  - **Ring 3**: 650m – 3,200m (Muzzle Velocity: 182 m/s, TOF: 18.6s – 34.8s)
  - **Ring 4**: 950m – 4,500m (Muzzle Velocity: 220 m/s, TOF: 21.6s – 42.0s)

### 2. 🇷🇺 Soviet Mortar — 2B14 Podnos 82mm (O-832DU HE)
- **Sight Scale**: MPM-44M Sight — **60-00 Warsaw Pact Mils** (6000 mils per circle; formatted as `XX-YY`, where 100 mils = 6.0°).
- **Elevation Range**: 748 mils (44.9° / `07-48`) to 1415 mils (84.9° / `14-15`).
- **Propellant Charge Rings (0 to 4)**:
  - **Ring 0**: 80m – 470m (Muzzle Velocity: 70 m/s, TOF: 6.8s – 12.2s)
  - **Ring 1**: 220m – 1,150m (Muzzle Velocity: 110 m/s, TOF: 10.2s – 19.4s)
  - **Ring 2**: 420m – 2,100m (Muzzle Velocity: 150 m/s, TOF: 14.0s – 26.8s)
  - **Ring 3**: 650m – 3,100m (Muzzle Velocity: 185 m/s, TOF: 18.2s – 33.8s)
  - **Ring 4**: 950m – 4,250m (Muzzle Velocity: 215 m/s, TOF: 20.5s – 40.5s)

### 3. 🛡️ SPG-9 Kopye 73mm Recoilless Rifle
- High-velocity direct fire (435 m/s) with elevation solutions from 100m to 1,300m.

---

## ⚡ Core Features

- **Automatic Ring Optimization**: Automatically picks the safest, most stable charge ring based on target range while supporting immediate manual overrides.
- **Altitude / Slope Correction ($\Delta H$)**: Accurately corrects high-angle tube elevation for terrain elevation differences between gun and target.
- **Physical Limit Protection**: Alerts the crew if elevation angles exceed maximum tube limits (45° – 85°).
- **Squad Radio Callout Copier**: Generates standardized military callouts with 1-click clipboard copy:
  ```
  [FIRE MISSION - EVERON] M252 81mm Mortar (81mm M821 HE) | RING: 2 | AZ: 1245 mils (70.0°) | EL: 1339 mils (75.3°) | RNG: 1000m (ΔH: +7m) | TOF: 25.9s | GUN: 048 071 | TGT: 057 070
  ```
- **Mobile-Ready Responsive HUD**: Seamless switching between the tactical map and the fire control calculator on handheld devices.

---

## 🚀 GitHub Pages Deployment Guide

This project is configured with a automated GitHub Actions deployment workflow (`.github/workflows/deploy.yml`).

### Required GitHub Repository Setup:
1. Navigate to your repository on GitHub: `https://github.com/krsdq-pixel/arma-reforger-2`.
2. Go to **Settings** → **Pages**.
3. Under **Build and deployment** → **Source**, select **GitHub Actions** (do **not** select "Deploy from a branch").
4. Every `push` to `main` will automatically build the Vite application and publish to GitHub Pages.

> **Note on Jekyll:** The repository deliberately avoids `jekyll-gh-pages.yml` because Jekyll is only intended for Ruby static generators. This project uses React + Vite and deploys the compiled `./dist` directory.

---

## 💻 Local Development

### Prerequisites
- Node.js 20+ or 22+
- npm 10+

### Setup & Run
```bash
# Clone the repository
git clone https://github.com/krsdq-pixel/arma-reforger-2.git
cd arma-reforger-2

# Install dependencies (zero conflicts)
npm install

# Start local development server
npm run dev

# Run TypeScript type check
npm run lint

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 📄 License & Attribution
- Game data, coordinate mappings, and world assets &copy; **Bohemia Interactive a.s.**
- Tactical map tile services powered by **Enfumap / Bohemia Interactive**.
- Code released for the Arma Reforger community.


---

## ⚠️ Data status (updated)

- **Calculator rules:** no invented defaults for missing table columns (they show as `---`), no clamping to table edges, and a target outside the selected ring gets no elevation. A corrected elevation outside the tube limits (US 800–1515, 2B14 748–1415 mils) is refused.
- **Tables are ESTIMATES.** `src/data/estimatedTables.ts` builds each ring from a high-angle model (range = Rmax · sin(2θ)^p). The old hand-typed tables were inconsistent (e.g. US Ring 4 ended at 750 mils, below the M252's own 800-mil minimum) and are kept in `ballistics.ts` only as legacy data.
- **M252 (US) M821:** ring ranges are the confirmed in-game values — Ring 0 71–400 m, Ring 1 160–900, Ring 2 275–1600, Ring 3 383–2300, Ring 4 495–2900 — and mean dispersion 10/23/39/54/69 m. Elevations between those limits are modelled, not read from the game.
- **2B14 (Russian):** same model on the 6000-mil circle with estimated ring ranges (Ring 4 fitted to OCR'd in-game rows). No confirmed Russian readings yet.
- **Other ammunition (smoke, illumination, training, S-832S, D-832DU):** scaled from the HE tables, unverified.
- **Map:** the gun and target markers can be dragged directly; right-click on the map also places the target. (The pulse animation used to sit on Leaflet's own marker element, which overrides Leaflet's positioning and breaks dragging.)
- Every solution from an estimated table carries a note in the Fire Control panel.

---

## ✅ Latest changes (v2.1)

- **Ring 4 only.** Rings 0–3 were removed from both mortars (all ammo types). Everything (calculator, auto-selection, info tables, range circle) is based on Ring 4: US 495–2900 m, 2B14 435–2370 m. Targets outside that range get no solution (no clamping).
- **50 m table step.** Firing-table rows are generated every 50 m (values between rows are linearly interpolated).
- **45° at max range.** Tube limits stay as read in game: M252 800–1515 mil (45.0°–85.2°), 2B14 748–1415 mil (44.9°–84.9°). In both tables the max-range row closes at exactly 45.0° (800 mil US / 750 mil RU).
- **Map grid numbers.** Grid numbers (3-digit, same format as the `XXX ZZZ` input) are pinned to all four screen edges and follow pan/zoom. An orange border marks the exact map edge, a scale bar in real meters was added, and the HUD shows the map size (e.g. Everon 12,800 m = 12.8 × 12.8 km).
- **Safer settings.** Every value read from the browser or from an imported backup is validated field by field (types, ranges, allowed options); bad or old data falls back to defaults instead of breaking the app. Defaults are unchanged; the menu/panel position, sizes and visibility can still be changed in Settings.
- **Arabic.** Full RTL (`<html lang/dir>` follows the language), Cairo font, map always stays LTR, more strings translated, first visit follows the browser language.
- **Browser-only data.** Settings, markers and custom mortars live only in `localStorage`; nothing is sent to a server. The only network use is loading map tiles and fonts.

> Note: Russian (2B14) Ring 4 values are still an estimate until verified in game. Tests were updated for Ring 4 but need `npm install && npm test` on your machine (no network was available here).

### Map tools (v2.1)
- **Distance circles** around the gun: horizontal meters only (never elevation). Light lines near, clearer every 500 m, amber every 1000 m, distance written on each circle; spacing is automatic by zoom or fixed (100/250/500/1000 m) in Settings. They follow the gun marker and can be switched off.
- **Compass rose** (map is always north-up: game +Z = North, +X = East) and a label on the gun→target line with distance, true-north bearing in degrees and the 8-point direction (N, NE, E…).
- **Elevation scale** in the FCS panel, in degrees, with 45/50/60/70/80° ticks and the weapon's real limits (6400-mil circle US, 6000-mil RU). Separate from distance.
- `compass.test.ts` checks that 1000 m spans the same pixels east and north on Everon, Arland and Kolguyev at several zoom levels.

### v2.3
- **Personal calibration per mortar** (Settings → Mortar): range % (−20…+20) and elevation offset (−60…+60 mil). Default 0 = standard data. Raise range % if shells land farther than the table, lower it if they land short. Saved only in the browser, included in backup export/import, and a banner shows in the FCS panel while it is active.
- **Phone settings:** full-screen sheet, 44 px tap targets, 16 px inputs (no iOS zoom), single column, safe-area padding. Fixed a crash risk: the modal returned early before its hooks.
- **Map place names in Arabic** (Everon): English/French pronunciation written in Arabic letters. Setting: Auto / English / Arabic / Both.
- The 50 m is only the spacing of firing-table rows; the elevation between rows is interpolated per metre.

### v2.4
- Firing tables now end exactly at the tube minimum on the max-range row: **M252 = 800 mil (45.0°)**, **2B14 = 748 mil (44.9°)**.
- Extra rows are inserted near the maximum range (where elevation changes fastest). Before, the 50 m rows made the elevation jump from about 50° straight to 45° in the last 50 m, and interpolation there was off by 20+ mils (e.g. 2875 m now gives 867 mil instead of ~847).

### v2.5
- **Angle lock per mortar** (Settings → Mortar → "Lock minimum angle"): choose the lowest elevation you want to fire at (30–80°). Off = free (tube limit: M252 45.0°, 2B14 44.9°). A lock above the tube limit (e.g. 50° or 52°) shortens the maximum range to what that angle reaches, and the table/gauge/range circle follow it. Values at or below the tube limit change nothing because the tube cannot go lower.
- **Map performance:** vector layers use a canvas renderer, mouse-move and tile-counter updates are throttled (they re-rendered the whole app), and the distance circles are built once per zoom and only moved while dragging the gun.

### v2.6
- **Closing angle** (Settings → Mortar): the elevation of the max-range row is yours to set (30–80°, even below the tube limit). Off = standard (US 45.0°, RU 44.9°). The min-range end is unchanged; elevations in between are re-mapped. Works together with the angle lock.
- **Circle options:** on/off, spacing (auto/100/250/500/1000 m), outer radius (auto/1–6 km) and distance text on/off. The min/max range rings have their own switch.

### v2.7 — fix: elevation disappeared close to max range
Root cause: with a height difference (the defaults are gun 65 m / target 72 m) the table needs its "D ELEV per +100 m" value. Near the max range (from about 2790 m US / 2360 m RU... where the angle drops to ~52-53°) that +100 m solution does not exist, so the solver returned no elevation at all ("--"). Now the height correction is solved exactly with the same vacuum model the tables use (`exactAltitudeCorrectionMils`); only a target that is really unreachable at that height gets a "cannot be reached" message.

### v2.8
- **Full free mode** per mortar (Settings → Mortar): tube elevation limits and the angle lock are ignored, so you can use any closing angle (e.g. 40° or 45°) and control everything yourself.
- **Distance method:** exact maths from the coordinates (default, no map/zoom involved) or maths + optional AI second opinion. The AI never replaces the numbers: it re-computes distance/azimuth, flags differences (> 1 m or > 2 mil) and lists practical notes. It needs your own API key (kept only in this browser, not exported); only gun/target coordinates and weapon type are sent when you press "Check now".
- v2.9: the AI check supports **Google Gemini** (default model `gemini-3.5-flash`, header `x-goog-api-key`) as well as Anthropic Claude. Pick the provider in Settings and paste your own key there (never in chat or in the code); the model name stays editable.
