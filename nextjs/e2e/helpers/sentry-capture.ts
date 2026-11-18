import { createServer, type Server } from 'node:http';
import { gunzipSync } from 'node:zlib';

/**
 * A stand-in for Sentry's ingest API. The e2e web server points
 * NEXT_PUBLIC_SENTRY_DSN here (playwright.config.ts), so test errors never reach
 * the real Sentry project and the tests can inspect exactly what would be sent.
 *
 *   POST /api/<project>/envelope/  stores the envelope (what the SDKs send)
 *   GET  /events                    returns every stored event item as JSON
 *   DELETE /events                  clears them
 */
export const SENTRY_CAPTURE_PORT = 9997;
export const SENTRY_CAPTURE_DSN = `http://e2epublickey@127.0.0.1:${SENTRY_CAPTURE_PORT}/1`;
export const SENTRY_CAPTURE_ENVIRONMENT = 'e2e';

export type CapturedEvent = {
  type: string;
  event_id?: string;
  environment?: string;
  message?: string | { formatted?: string; message?: string };
  level?: string;
  user?: Record<string, unknown>;
  tags?: Record<string, string>;
  request?: { url?: string; query_string?: unknown; cookies?: unknown; data?: unknown };
  exception?: { values?: { type?: string; value?: string }[] };
  breadcrumbs?: { category?: string; data?: Record<string, unknown> }[] | { values?: unknown[] };
  [key: string]: unknown;
};

export function startSentryCapture(): Promise<Server> {
  const events: CapturedEvent[] = [];
  const server = createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/events') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(events));
    }
    if (req.method === 'DELETE' && req.url === '/events') {
      events.length = 0;
      return res.writeHead(204).end();
    }
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      let body = Buffer.concat(chunks);
      if (req.headers['content-encoding'] === 'gzip') body = gunzipSync(body);
      // Envelope: a header line, then (item header, item payload) line pairs
      const lines = body.toString('utf8').split('\n').filter(Boolean);
      for (let i = 1; i + 1 < lines.length; i += 2) {
        try {
          const header = JSON.parse(lines[i]);
          if (header.type === 'event' || header.type === 'transaction') {
            events.push({ type: header.type, ...JSON.parse(lines[i + 1]) });
          }
        } catch {
          /* attachments and other non-JSON items */
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{}');
    });
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(SENTRY_CAPTURE_PORT, '127.0.0.1', () => resolve(server));
  });
}

const CAPTURE_URL = `http://127.0.0.1:${SENTRY_CAPTURE_PORT}/events`;

export async function clearSentryEvents() {
  await fetch(CAPTURE_URL, { method: 'DELETE' });
}

/** Polls until an error event matching `match` arrives, and returns it. */
export async function waitForSentryEvent(
  match: (e: CapturedEvent) => boolean,
  timeoutMs = 20_000
): Promise<CapturedEvent> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const events: CapturedEvent[] = await (await fetch(CAPTURE_URL)).json();
    const found = events.find((e) => e.type === 'event' && match(e));
    if (found) return found;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error('Timed out waiting for a matching Sentry event');
}

export async function sentryEvents(): Promise<CapturedEvent[]> {
  const events: CapturedEvent[] = await (await fetch(CAPTURE_URL)).json();
  return events.filter((e) => e.type === 'event');
}

export const eventText = (e: CapturedEvent) =>
  [
    typeof e.message === 'string' ? e.message : (e.message?.formatted ?? e.message?.message),
    ...(e.exception?.values ?? []).map((v) => `${v.type}: ${v.value}`)
  ]
    .filter(Boolean)
    .join(' | ');
