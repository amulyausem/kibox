# Kibox

Household grocery tracker for the food you already bought. It answers two questions: **what should we eat first**, and **what is actually running out**.

There is no account. Pantry, list, and settings live in SQLite on the phone. Inferred items are always suggestions. You confirm them before they count as truth.

**Principle:** adding and updating items has to be almost effortless, or people quit.

Expo SDK 57, TypeScript, local-first.

## What it does

| Tab | Role |
| --- | --- |
| **Pantry** | Everything in the house. Sort by soonest expiry or by place (fridge, freezer, pantry). Suggested rows are dashed until you Confirm or Dismiss. |
| **Today** | Eat-these-first, expired, expiring soon, staples running low. Toss logs waste $ when a receipt price exists. Used decrements quantity and trains staple intervals. |
| **List** | Check-off shopping list. Share as text. Open Instacart / Amazon / Walmart. Checked rows can land back in the pantry. |
| **Settings** | Daily digest, expiry windows, household sync, JSON backup, photo consent, staple rules, Siri Used shortcut. |

Ways to get food in:

- **Type** a name (catalog typeahead). Same name + place bumps quantity instead of duplicating.
- **Barcode** via Open Food Facts, then a name if the code is unknown.
- **Photo** of a grocery or a receipt. Gemini extracts line items; you confirm.
- **Paste receipt** from email or SMS. Local parser if vision is off.
- **Onboarding sample pantry** if you want to poke around before adding real food.

Opened packages use a shorter shelf life than sealed ones. Staple rules start from defaults and learn from how often you tap Used.

## How it works

```
  Camera / paste / type
           │
           ▼
  ingestion (barcode, Gemini, receipt text)
           │  candidates, never auto-confirmed
           ▼
  Zustand store  (lib/store.ts)
           │
           ▼
  repository interfaces  (data/container.ts)
           │
           ▼
  SQLite kibox.db on device
```

Screens never talk to SQLite. They call the store. The store calls repository **interfaces**. Today those are local (`data/localInventory.ts`, `localShopping.ts`, …). Swap `data/container.ts` for a remote backend later without rewriting UI.

Pure logic lives in `domain/` so it can be unit-tested without React:

- **expiry** — sealed vs opened clocks, “soon” windows per category
- **restock** — quantity thresholds and typical buy intervals
- **staplesLearn** — median gap between Used taps
- **receiptExtract** — model JSON + heuristic paste parser
- **money** — waste totals from receipt prices
- **household** — last-write-wins snapshot compare
- **shopping** — list formatting

After each mutation the store:

1. Writes SQLite
2. Refreshes the daily notification
3. Pushes the Home Screen widget snapshot (native build only)
4. If a household code is set, PUTs a JSON snapshot to the companion server

Suggested items come from two places: vision/receipt candidates you review, and heuristics on launch (expired perishables that were probably used, staples past their interval). Those stay dashed until Confirm.

### Companion server

`server/vision-proxy.mjs` (`npm run proxy`) is a small local HTTP server for three jobs that should not live in the app bundle:

| Route | Job |
| --- | --- |
| `POST /` or `/vision` | Gemini receipt/photo extract, so the API key stays on your computer |
| `GET/PUT/POST /household/:code` | In-memory/file household rooms (`/tmp/kibox-households.json`) |
| `POST /instacart/list` | Instacart Developer Platform shopping-list page |

Phones poll the household room every 8 seconds. A pull applies only if the snapshot is newer **and** came from another device. Last write wins. Both phones must reach the same LAN URL.

This is not iCloud or a hosted backend. Restarting the proxy can drop rooms (they sit in a temp file).

### Deep links and widget

Scheme: `kibox://`

| URL | Action |
| --- | --- |
| `kibox://used?name=Milk` | Mark that item Used, or add it to the list |
| `kibox://add?name=…` | Quick-add by name |
| `kibox://join?code=…` | Join a household |
| `kibox://list` | Open the List tab |
| `kibox://today` | Open the Today tab |

Siri: Shortcuts → Open URL with `kibox://used?name=Milk`.

The **Kibox** widget (`widgets/KiboxToday.tsx`) shows what to use first and how many list items are open. Widgets and a real Instacart cart page need a development or TestFlight build, not Expo Go.

## Repo layout

```
app/            expo-router screens (tabs + add flows)
components/     shared UI, onboarding, ingest review
domain/         pure logic + tests
data/           SQLite repos, ingestion, lookup, household sync
lib/            store, theme, notifications, widget publish
server/         companion (vision + household + Instacart)
widgets/        iOS Home Screen widget
```

## Run

```bash
git clone https://github.com/amulyausem/kibox.git
cd kibox
npm install
cp .env.example .env
npx expo start
```

Open in **Expo Go** for pantry, list, barcode, and paste-receipt. Restart Expo after changing `.env`.

```bash
npm test
npm run typecheck
```

### Environment

| Variable | Where | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_GEMINI_API_KEY` | `.env` | On-device Gemini (dev only; ships in the JS bundle) |
| `GEMINI_API_KEY` | proxy process | Preferred. Key never leaves your computer |
| `EXPO_PUBLIC_VISION_PROXY_URL` | `.env` | Phone → companion, e.g. `http://192.168.1.10:8787` |
| `EXPO_PUBLIC_SYNC_URL` | `.env` | Household sync host (falls back to the vision URL) |
| `INSTACART_API_KEY` | proxy process | Real Instacart shopping-list page |
| `EXPO_PUBLIC_INSTACART_API_KEY` | `.env` | Same, on-device (dev only) |
| `EXPO_PUBLIC_OPENAI_API_KEY` | `.env` | Optional `sk-` key instead of Gemini |

Get a Gemini key at [Google AI Studio](https://aistudio.google.com/apikey). Photos leave the device when vision is on; Settings has a consent toggle.

### Companion on the home network

```bash
GEMINI_API_KEY=... INSTACART_API_KEY=... npm run proxy
```

Point both phones at that machine, restart Expo, then Settings → Household → Create / Join.

Without an Instacart partner key, List → Instacart cart copies the list and walks Instacart search.

## Native / store builds

Widget, App Group, and a production vision proxy need a binary:

```bash
npm i -g eas-cli
eas build --profile development --platform ios   # widget + Siri on device
eas build --profile preview --platform ios       # TestFlight-style
```

Bundle id: `com.kiboxofficial.app`. Set `EXPO_PUBLIC_VISION_PROXY_URL` for production so the Gemini key is not in the app.

## Honest limits

- Expo Go: no Home Screen widget, no App Intents. Deep links and the rest of the app work.
- Household sync needs both phones on the same companion. Last-write-wins, not CRDT/CloudKit.
- Instacart’s real cart page needs their Developer Platform. Otherwise search URLs.
- Receipt vision sends images to Google (or OpenAI). Toggle off in Settings to block new reads.
- Companion household rooms are a local file, not a durable cloud.
