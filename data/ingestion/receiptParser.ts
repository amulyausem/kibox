import {
  extractedToCandidates,
  heuristicReceiptLines,
  parseModelJson,
} from '@/domain/receiptExtract';
import type { ItemSource } from '@/domain/types';
import { imageUriToBase64 } from '@/lib/imageBase64';

export function resolveVisionApiKey(): string | undefined {
  const candidates = [
    process.env.EXPO_PUBLIC_GEMINI_API_KEY,
    process.env.EXPO_PUBLIC_GOOGLE_AI_API_KEY,
    process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  ];
  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

export function visionProxyUrl(): string | undefined {
  return process.env.EXPO_PUBLIC_VISION_PROXY_URL?.trim() || undefined;
}

const RECEIPT_PROMPT = `This is a grocery receipt photo. Extract purchased food/household line items only.
Return JSON: {"items":[{"name":"Milk","quantity":1,"unit":"carton","price":"$3.49"}]}
Skip tax, total, card, store address. Use the product name a shopper would recognize.`;

const PHOTO_PROMPT = `This is a photo of groceries (counter, fridge, or bags). Identify visible food items.
Return JSON: {"items":[{"name":"Bananas","quantity":1,"unit":"bunch"}]}
Skip plates, packaging brands as names unless they identify the food. Prefer common grocery names.`;

const TEXT_PROMPT = `This is pasted grocery-receipt text. Extract purchased food/household line items only.
Return JSON: {"items":[{"name":"Milk","quantity":1,"unit":"carton","price":"$3.49"}]}
Skip tax, total, card, store address.`;

export async function parseReceiptPhoto(uri: string) {
  return parseVision(uri, RECEIPT_PROMPT, 'receipt-stub');
}

export async function parsePantryPhoto(uri: string) {
  return parseVision(uri, PHOTO_PROMPT, 'photo');
}

export async function parseReceiptText(text: string) {
  const apiKey = resolveVisionApiKey();
  if (apiKey) {
    const lines = apiKey.startsWith('sk-')
      ? await extractWithOpenAI({ prompt: TEXT_PROMPT, apiKey, text })
      : await extractWithGemini({ prompt: TEXT_PROMPT, apiKey, text });
    const items = extractedToCandidates(lines, 'receipt-stub');
    if (items.length) return items;
  }
  return extractedToCandidates(heuristicReceiptLines(text), 'receipt-stub');
}

async function parseVision(uri: string, prompt: string, source: ItemSource) {
  const proxy = visionProxyUrl();
  const { base64, mime } = await imageUriToBase64(uri);
  if (proxy) {
    const response = await fetch(proxy, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, mime, base64 }),
    });
    const json = (await response.json()) as { text?: string; error?: string };
    if (!response.ok) throw new Error(json.error ?? 'Vision proxy failed.');
    if (!json.text) throw new Error('No text returned from the vision proxy.');
    return extractedToCandidates(parseModelJson(json.text), source);
  }
  const apiKey = resolveVisionApiKey();
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY in .env. Restart Expo after adding it.');
  }
  const lines = apiKey.startsWith('sk-')
    ? await extractWithOpenAI({ prompt, apiKey, base64, mime })
    : await extractWithGemini({ prompt, apiKey, base64, mime });
  return extractedToCandidates(lines, source);
}

async function extractWithGemini(args: {
  prompt: string;
  apiKey: string;
  base64?: string;
  mime?: string;
  text?: string;
}) {
  const bodyParts: unknown[] = [{ text: args.prompt }];
  if (args.text) bodyParts.push({ text: args.text });
  if (args.base64 && args.mime) {
    bodyParts.push({ inlineData: { mimeType: args.mime, data: args.base64 } });
  }
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': args.apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: bodyParts }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      }),
    },
  );
  const json = (await response.json()) as {
    error?: { message?: string };
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  if (!response.ok) {
    throw new Error(json.error?.message ?? 'Gemini could not read that.');
  }
  const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
  if (!text) throw new Error('No text returned from the model.');
  return parseModelJson(text);
}

async function extractWithOpenAI(args: {
  prompt: string;
  apiKey: string;
  base64?: string;
  mime?: string;
  text?: string;
}) {
  const content: unknown[] = [{ type: 'text', text: `${args.prompt}${args.text ? `\n\n${args.text}` : ''}` }];
  if (args.base64 && args.mime) {
    content.push({
      type: 'image_url',
      image_url: { url: `data:${args.mime};base64,${args.base64}` },
    });
  }
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content }],
    }),
  });
  const json = (await response.json()) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  };
  if (!response.ok) {
    throw new Error(json.error?.message ?? 'OpenAI could not read that.');
  }
  const text = json.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('No text returned from the model.');
  return parseModelJson(text);
}
