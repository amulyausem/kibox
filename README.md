# Kibox

A local pantry app: log what you have, confirm suggestions, and get a daily digest when food is expiring or staples are running low.

**Principle:** adding and updating items has to be almost effortless, or people quit. Inferred items are never shown as certain truth.

## Run

```bash
cd ~/Desktop/Kibox-app
npm install
npx expo start
```

Open in **Expo Go**. No account, no backend.

```bash
npm test
npm run typecheck
```

First launch seeds a sample pantry (Settings → restore / toggle).

## What you can do

- **Pantry** — list by soonest expiry or by place. Suggested rows are dashed, with Confirm / Dismiss.
- **Add** — typeahead against a grocery catalog. Stay on the sheet and keep adding; Done when finished. Same item name+place bumps quantity.
- **Barcode** — local lookup table (sample chips work without a camera). Unknown codes fall back to a name.
- **Photo / receipt / loyalty** — stubbed sources that create *suggested* items.
- **Today** — expired, expiring soon, running low, with Used / Toss / Restock.
- **Restock** — low staples + flagged items; store buttons are stubbed.
- **Settings** — digest time, per-category “soon” windows, default locations, seed data, staple rules.

## Architecture

Screens talk to Zustand (`lib/store.ts`). The store talks to repository **interfaces**, never SQLite.

```
app/         screens (expo-router)
domain/      expiry, restock, confidence — no React
data/        Local* repositories + ingestion stubs
lib/         store, theme, notifications
```

Swap `data/container.ts` later for a remote backend. No UI rewrite.

### Ingestion sources (`IngestionSource`)

| Source | File | Real now? |
| --- | --- | --- |
| Manual | `data/ingestion/manual.ts` | Yes |
| Barcode | `data/ingestion/barcode.ts` + `ProductLookup` | Local table |
| Photo | `PhotoRecognitionSource` | Stub |
| Receipt | `ReceiptIngestionSource` | Stub |
| Loyalty | `LoyaltyIngestionSource` | Stub |

Flags: `data/featureFlags.ts`. Reorder: `data/reorder/handoff.ts`.

## Making stubs real

- **Open Food Facts** — implement in `OpenFoodFactsLookup`, flip `FEATURES.realProductLookup`.
- **Vision** — send `photoUri` in `PhotoRecognitionSource.ingest`, flip `FEATURES.realVisionRecognition`.
- **Receipt / loyalty** — replace sample arrays, flip the matching flags.
- **Reorder** — affiliate URLs in `StubReorderHandoff.open`.

Suggested items still require Confirm / Dismiss after real models.

## Deploy later

1. `eas build` for TestFlight / Play (still local SQLite).
2. Add an API that implements the same repository interfaces.
3. Point `data/container.ts` at remote repos; SQLite can stay as cache.
