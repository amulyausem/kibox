/**
 * Feature flags make stubbed integrations obvious.
 * Flip a flag only after a real implementation exists behind the same interface.
 */
export const FEATURES = {
  realProductLookup: false,
  realVisionRecognition: false,
  realReceiptParsing: false,
  realLoyaltySync: false,
  realReorderHandoff: false,
} as const;

export type FeatureFlag = keyof typeof FEATURES;
