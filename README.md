# Kibox

Local-only MVP of the Kibox household pantry app. Track groceries, confirm suggestions, and get a daily digest for food that’s expiring and staples that are running low.

The product principle: **keeping inventory up to date has to be almost effortless**, and inferred items are never shown as certain truth.

## Run locally

```bash
npm install
npm start
```

Then open in **Expo Go** (iOS or Android).

```bash
npm test          # domain unit tests
npm run typecheck
```

No account, no backend, no Stripe. Data lives in SQLite on device and survives restarts.

Demo accounts aren’t needed. First launch seeds a sample pantry (toggle or reset it in Settings).

## Brand

Visual language is taken from [kiboxofficial.com](https://www.kiboxofficial.com):

| Token | Value |
| --- | --- |
| Ink | `#0f1416` |
| Mint | `#5B8A81` |
| Sage | `#8fa9a0` |
| Clay | `#c7b7a2` |
| Paper | `#ffffff` |
| Background | `#f7f8f9` |
| Line | `#e6eaee` |
| UI type | Inter |
| Headlines | Newsreader |
| Logo | `assets/brand/kibox-logo.png` |

Light and dark palettes both derive from those tokens. Motion is quiet: staggered fades, layout springs, press scale.

## Architecture

UI never talks to storage. Screens go through Zustand (`lib/store.ts`), which talks to repository interfaces.

```
app/            expo-router screens
components/     compact branded UI
domain/         pure logic (expiry, restock, confidence) — no React
data/           repository implementations + stubs
lib/            store, theme, notifications
```

### Repositories

Interfaces live in `data/repositories.ts`:

- `InventoryRepository`
- `StapleRepository`
- `SettingsRepository`

Today’s implementations:

- `LocalInventoryRepository` / `LocalStapleRepository` / `LocalSettingsRepository` (SQLite via `expo-sqlite`)

To add a backend later, implement `RemoteInventoryRepository` (and friends) against the same interfaces and swap them in `data/container.ts`. No screen changes required.

### Ingestion sources

`IngestionSource` produces candidate items. Implemented now:

| Source | File | Status |
| --- | --- | --- |
| Manual typeahead | `app/add.tsx` + `domain/groceryCatalog.ts` | Real |
| Barcode | `data/lookup/productLookup.ts` | Local table now |
| Photo | `data/ingestion/sources.ts` `PhotoRecognitionSource` | Stub vision |
| Receipt | `ReceiptIngestionSource` | Stub |
| Loyalty | `LoyaltyIngestionSource` | Stub |

`ProductLookup` wraps barcode lookup. `LocalProductLookup` is live; `OpenFoodFactsLookup` is behind `FEATURES.realProductLookup`.

Reorder is `data/reorder/handoff.ts` (`StubReorderHandoff`). Restock buttons are real; destinations are stubbed.

Feature flags: `data/featureFlags.ts`.

## Making stubs real

- **Open Food Facts** — in `OpenFoodFactsLookup.lookup`, call `https://world.openfoodfacts.org/api/v2/product/{barcode}.json`, map `product_name` / categories, keep the local table as fallback. Flip `FEATURES.realProductLookup`.
- **Vision** — send `photoUri` to an on-device or cloud model inside `PhotoRecognitionSource.ingest`. Return `CandidateItem[]`. Flip `FEATURES.realVisionRecognition`.
- **Receipts / loyalty** — replace sample arrays in those sources with OCR or store-account sync. Flip the matching flags.
- **Reorder** — put affiliate URLs in `StubReorderHandoff.open` (or a `RemoteReorderHandoff`). Flip `FEATURES.realReorderHandoff`.

Suggested items always require Confirm / Dismiss. Don’t skip that when wiring real models.

## Roadmap to deployment

1. Keep this local MVP until Quick Add feels faster than a notes app.
2. `eas build` for TestFlight / Play internal testing (no backend needed).
3. Add auth + a small API that implements the existing repository interfaces.
4. Swap `data/container.ts` to remote repos; SQLite can remain an offline cache.
5. Turn on real product lookup, then vision, then receipt/loyalty, then reorder links.

## Tests

`domain/*.test.ts` cover expiry status, running-low detection, and depletion confidence. They run in Node with `tsx` — no simulator required.
