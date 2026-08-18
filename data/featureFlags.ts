export const FEATURES = {
  realProductLookup: true,
  realVisionRecognition: true,
  realReceiptParsing: true,
  realLoyaltySync: false,
  realReorderHandoff: true,
} as const;

export type FeatureFlag = keyof typeof FEATURES;
