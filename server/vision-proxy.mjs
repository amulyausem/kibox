#!/usr/bin/env node
/**
 * Local Kibox companion: vision proxy, household sync, Instacart list pages.
 * GEMINI_API_KEY=... INSTACART_API_KEY=... node server/vision-proxy.mjs
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT ?? 8787);
const GEMINI = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY;
const INSTACART = process.env.INSTACART_API_KEY ?? process.env.EXPO_PUBLIC_INSTACART_API_KEY;
const STORE = path.join(process.env.TMPDIR ?? '/tmp', 'kibox-households.json');

function loadHouseholds() {
  try {
    return JSON.parse(fs.readFileSync(STORE, 'utf8'));
  } catch {
    return {};
  }
}

function saveHouseholds(map) {
  fs.writeFileSync(STORE, JSON.stringify(map));
}

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function vision(body) {
  if (!GEMINI) throw new Error('GEMINI_API_KEY is not set on the proxy');
  const parts = [{ text: body.prompt ?? 'Extract grocery items as JSON {"items":[...]}' }];
  if (body.base64 && body.mime) {
    parts.push({ inlineData: { mimeType: body.mime, data: body.base64 } });
  }
  if (body.text) parts.push({ text: body.text });
  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      }),
    },
  );
  const json = await response.json();
  if (!response.ok) throw new Error(json.error?.message ?? 'Gemini failed');
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  return { text };
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`);
  try {
    if ((url.pathname === '/' || url.pathname === '/vision') && req.method === 'POST') {
      send(res, 200, await vision(await readJson(req)));
      return;
    }
    if (url.pathname === '/household' && req.method === 'POST') {
      const body = await readJson(req);
      const code = String(body.code ?? '').toUpperCase() || Math.random().toString(36).slice(2, 8).toUpperCase();
      const map = loadHouseholds();
      map[code] = map[code] ?? { deviceId: '', snapshot: null, updatedAt: new Date().toISOString() };
      saveHouseholds(map);
      send(res, 200, { code });
      return;
    }
    const house = url.pathname.match(/^\/household\/([^/]+)$/);
    if (house && req.method === 'GET') {
      const code = decodeURIComponent(house[1] ?? '').toUpperCase();
      const row = loadHouseholds()[code];
      if (!row) {
        send(res, 404, { error: 'Unknown household code' });
        return;
      }
      send(res, 200, row);
      return;
    }
    if (house && req.method === 'PUT') {
      const code = decodeURIComponent(house[1] ?? '').toUpperCase();
      const body = await readJson(req);
      const map = loadHouseholds();
      map[code] = {
        deviceId: body.deviceId,
        snapshot: body.snapshot,
        updatedAt: new Date().toISOString(),
      };
      saveHouseholds(map);
      send(res, 200, { ok: true });
      return;
    }
    if (url.pathname === '/instacart/list' && req.method === 'POST') {
      if (!INSTACART) {
        send(res, 501, { error: 'INSTACART_API_KEY is not set on the proxy' });
        return;
      }
      const body = await readJson(req);
      const response = await fetch('https://connect.instacart.com/idp/v1/products/products_link', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${INSTACART}`,
        },
        body: JSON.stringify(body),
      });
      const json = await response.json();
      if (!response.ok) {
        send(res, response.status, { error: json.error ?? json.message ?? 'Instacart failed' });
        return;
      }
      send(res, 200, { url: json.products_link_url });
      return;
    }
    send(res, 404, { error: 'Unknown route' });
  } catch (err) {
    send(res, 500, { error: err instanceof Error ? err.message : 'Server failed' });
  }
});

server.listen(PORT, () => {
  console.log(`Kibox companion on http://0.0.0.0:${PORT}`);
});
