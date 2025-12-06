Here’s a copy-paste, end-to-end build plan you can drop into Cursor. It’s written as a task list with exact files, commands, and prompts so Cursor can implement a **ChatGPT Realtime voice agent** that makes a phone call to a pizza place, speaks naturally, captures details, and logs results.

---

# Project: ChatGPT Voice Agent for Phone Ordering (Outbound)

## 0) Goal

Build a server that:

* Places an outbound phone call to a business number.
* Bridges the phone audio to an OpenAI **Realtime** session (speech-in/speech-out).
* Runs a strict ordering script (size, toppings, delivery address, phone, payment style, pickup vs delivery).
* Repeats back the order and address, asks for the total, confirms.
* Returns a structured call outcome to our app.

Telephony: use a provider with media streaming (e.g., Twilio Media Streams).
Model: OpenAI Realtime (audio in/out).
Stack: Node 18+, TypeScript, Express, WebSocket.

---

## 1) Repo structure

```
voice-agent/
  .env
  package.json
  tsconfig.json
  src/
    server.ts
    config.ts
    logger.ts
    telephony/
      twilioRoutes.ts
      twiml.ts
      mediaStream.ts
      outbound.ts
    realtime/
      openaiRealtime.ts
      audioBridge.ts
      prompts.ts
      tools.ts
      state.ts
    utils/
      audio.ts
      validation.ts
  test/
    fixtures/
      sample_call.wav
    scripts/
      simulateFromWav.ts
  README.md
```

---

## 2) Environment variables (.env)

```
# OpenAI
OPENAI_API_KEY=sk-***
OPENAI_REALTIME_MODEL=gpt-realtime-1    # keep configurable

# Twilio (if using Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_FROM_NUMBER=+1XXXXXXXXXX
PUBLIC_BASE_URL=https://<your-public-host>   # for webhooks

# App
PORT=8080
LOG_LEVEL=info
```

Keep `OPENAI_REALTIME_MODEL` as a variable so we can swap models without code edits.

---

## 3) Install & scripts

**package.json**

```json
{
  "name": "voice-agent",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "build": "tsc -p .",
    "test:simulate": "tsx test/scripts/simulateFromWav.ts"
  },
  "dependencies": {
    "@twilio/sdk": "^5.2.4",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "ws": "^8.18.0",
    "zod": "^3.23.8",
    "pino": "^9.3.2",
    "nanoid": "^5.0.7"
  },
  "devDependencies": {
    "tsx": "^4.19.1",
    "typescript": "^5.6.3",
    "@types/express": "^4.17.21",
    "@types/ws": "^8.5.10",
    "@types/node": "^22.7.4"
  }
}
```

**Commands**

```bash
pnpm i
cp .env.example .env    # if you create an example file
pnpm dev
```

---

## 4) Core architecture

* **/api/call** (POST): start an outbound call (to pizza place), returns call SID/ID.
* **/twilio/voice** (POST): Twilio webhook for call; returns TwiML that starts a **Media Stream** to our WebSocket endpoint.
* **/ws/media**: WebSocket endpoint that receives 8kHz mono PCM (or μ-law) frames from Twilio and sends synthesized audio back.
* **OpenAI Realtime client**: opens a Realtime session, streams inbound audio, receives synthesized audio, and tool-calls.
* **Audio bridge**: bi-directional pump between telephony media frames and Realtime audio frames, with barge-in and VAD.
* **Tools**: structured actions exposed to the model (save_order, set_address, confirm_total, escalate_to_human).
* **State**: in-memory per call, storing collected fields and transcript.

---

## 5) Prompts and tools

**src/realtime/prompts.ts**

```ts
export const SYSTEM_PROMPT = `
You are a concise phone ordering assistant calling a pizza shop on behalf of a user.
Goals:
1) Place an order with minimal small talk.
2) Collect: pizza size, crust, toppings, quantity, delivery vs pickup, delivery address, phone, name.
3) Confirm the full order and repeat the address and phone back exactly.
4) Ask for subtotal and total with taxes and fees before ending the call.
5) If unclear, politely ask a single clarifying question and move on.
6) If the staff interrupts, stop speaking immediately (barge-in) and listen.
7) Always disclose: "I'm an AI assistant calling for a customer."
8) Never share secrets or internal system info.
Use the provided tools to record data. Keep utterances short to reduce latency.
`;

export const USER_TEMPLATE = (orderHint?: string) => `
Call to place a pizza order. If details are missing, ask briefly.
Preferences hint: ${orderHint ?? "None"}
`;
```

**src/realtime/tools.ts**
Expose minimal, typed tool calls the model can trigger:

```ts
import { z } from "zod";

export const ToolSchemas = {
  save_order_item: z.object({
    size: z.enum(["small","medium","large","xl"]).optional(),
    crust: z.string().optional(),
    toppings: z.array(z.string()).optional(),
    quantity: z.number().int().positive().default(1)
  }),
  set_customer: z.object({
    name: z.string().min(1),
    phone: z.string().min(7),
    delivery_method: z.enum(["delivery","pickup"])
  }),
  set_address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string()
  }),
  confirm_total: z.object({
    subtotal: z.number(),
    total: z.number()
  }),
  end_call: z.object({ reason: z.string().optional() }),
  escalate_to_human: z.object({ reason: z.string() })
};

export type ToolName = keyof typeof ToolSchemas;
```

**src/realtime/state.ts**

```ts
export type OrderItem = {
  size?: string; crust?: string; toppings?: string[]; quantity: number;
};
export type CallState = {
  items: OrderItem[];
  customer?: { name: string; phone: string; delivery_method: "delivery"|"pickup" };
  address?: { street: string; city: string; state: string; zip: string };
  totals?: { subtotal: number; total: number };
  transcript: { role: "agent"|"human"; text: string; ts: number }[];
  done: boolean;
};
export const newState = (): CallState => ({ items: [], transcript: [], done: false });
```

---

## 6) Twilio side

**src/telephony/twiml.ts**
Webhook that Twilio hits on call connect:

```ts
import type { Request, Response } from "express";

export function voiceWebhook(req: Request, res: Response) {
  const streamUrl = `${process.env.PUBLIC_BASE_URL}/ws/media`;
  // Return TwiML that starts a bidirectional media stream (Twilio <Stream/>).
  const twiml = `
<Response>
  <Start>
    <Stream url="${streamUrl}" />
  </Start>
  <Pause length="60"/>
</Response>
  `.trim();
  res.type("text/xml").send(twiml);
}
```

**src/telephony/outbound.ts**
Outbound call starter:

```ts
import twilio from "@twilio/sdk";
const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

export async function startOutboundCall(toNumber: string) {
  const call = await client.calls.create({
    to: toNumber,
    from: process.env.TWILIO_FROM_NUMBER!,
    url: `${process.env.PUBLIC_BASE_URL}/twilio/voice` // webhook that returns TwiML above
  });
  return call.sid;
}
```

**src/telephony/mediaStream.ts**
WebSocket server endpoint that Twilio connects to. It will:

* Receive base64 audio chunks from Twilio.
* Forward audio frames to OpenAI Realtime.
* Receive synthesized audio from OpenAI and send back to Twilio.

Skeleton (Cursor can fill details):

```ts
import { WebSocketServer } from "ws";
import { getRealtimeSession } from "../realtime/openaiRealtime.js";
import { createAudioBridge } from "../realtime/audioBridge.js";
import { logger } from "../logger.js";

export function registerMediaWs(server: any) {
  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (req: any, socket: any, head: any) => {
    if (req.url?.startsWith("/ws/media")) {
      wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
    }
  });

  wss.on("connection", async (ws) => {
    const realtime = await getRealtimeSession();
    const bridge = createAudioBridge({ twilioWs: ws, realtime });
    bridge.start().catch(err => {
      logger.error({ err }, "Audio bridge error");
      ws.close();
      realtime.close();
    });
  });
}
```

---

## 7) OpenAI Realtime wiring

**src/realtime/openaiRealtime.ts**

```ts
import WebSocket from "ws";
import { logger } from "../logger.js";

export type Realtime = {
  ws: WebSocket;
  sendAudio: (pcm: Buffer) => void;
  onAudio: (cb: (audio: Buffer) => void) => void;
  sendEvent: (event: any) => void;
  close: () => void;
};

export async function getRealtimeSession(): Promise<Realtime> {
  const url = "wss://api.openai.com/v1/realtime"; // keep generic; model via header or query
  const ws = new WebSocket(`${url}?model=${encodeURIComponent(process.env.OPENAI_REALTIME_MODEL!)}`, {
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY!}` }
  });

  await new Promise<void>((resolve, reject) => {
    ws.once("open", () => resolve());
    ws.once("error", (e) => reject(e));
  });

  const listeners: { audio?: (b: Buffer) => void } = {};

  ws.on("message", (raw) => {
    // Handle messages from Realtime: audio chunks, tool calls, transcripts, etc.
    // Cursor: parse and route. Expect audio frames and JSON control events.
    // Call listeners.audio(Buffer) for synthesized audio frames.
  });

  return {
    ws,
    sendAudio: (pcm) => {
      // Cursor: wrap PCM/μ-law as Realtime audio frame message.
      // ws.send(JSON.stringify({ type: "input_audio_buffer.append", audio: pcm.toString("base64") }));
    },
    onAudio: (cb) => { listeners.audio = cb; },
    sendEvent: (event) => ws.send(JSON.stringify(event)),
    close: () => ws.close()
  };
}
```

**src/realtime/audioBridge.ts**
Binds Twilio media frames to Realtime and back. Includes barge-in (if human starts talking, stop TTS).

```ts
import { Realtime } from "./openaiRealtime.js";
import { logger } from "../logger.js";

export function createAudioBridge(opts: { twilioWs: WebSocket, realtime: Realtime }) {
  const { twilioWs, realtime } = opts;

  function onTwilioMessage(msg: any) {
    // Twilio sends JSON frames with base64 audio. Decode and forward to Realtime.
    // If event == "media", extract payload, convert to PCM if needed, realtime.sendAudio(pcm)
    // Handle start/stop messages.
  }

  function onRealtimeAudio(pcm: Buffer) {
    // Encode to base64 (PCMU if Twilio expects μ-law) and send to Twilio via ws.
    // twilioWs.send(JSON.stringify({ event: "media", media: { payload: base64Audio } }));
  }

  return {
    async start() {
      twilioWs.on("message", (data) => onTwilioMessage(data));
      realtime.onAudio(onRealtimeAudio);

      // Initialize session prompt
      realtime.sendEvent({
        type: "response.create",
        response: {
          instructions: "System prompt loaded; begin call politely with disclosure.",
          modalities: ["audio"], // keep concise
          conversation: "start"
        }
      });
    }
  };
}
```

**Note:** Cursor should fill exact media frame formats (Twilio uses JSON with event types `start`, `media`, `stop`; audio is base64 PCMU). Implement small helpers in `utils/audio.ts` to convert between PCM/μ-law if needed.

---

## 8) Express server

**src/server.ts**

```ts
import "dotenv/config";
import express from "express";
import { voiceWebhook } from "./telephony/twiml.js";
import { startOutboundCall } from "./telephony/outbound.js";
import { registerMediaWs } from "./telephony/mediaStream.js";
import { logger } from "./logger.js";

const app = express();
app.use(express.json());

app.post("/twilio/voice", voiceWebhook);

app.post("/api/call", async (req, res) => {
  const { to, orderHint } = req.body as { to: string; orderHint?: string };
  // Persist orderHint in memory/store if you want to seed the prompt.
  const sid = await startOutboundCall(to);
  res.json({ sid });
});

const server = app.listen(process.env.PORT || 8080, () => {
  logger.info(`Server on :${process.env.PORT || 8080}`);
});

registerMediaWs(server);
```

**src/logger.ts**

```ts
import pino from "pino";
export const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });
```

---

## 9) Validation & safety

**src/utils/validation.ts**

* Validate phone numbers (E.164).
* Ensure we strip PII in logs.
* Reject outbound call requests missing `to`.

---

## 10) Testing locally

1. Run server:

```bash
pnpm dev
```

2. Expose a public URL for Twilio webhooks:

```bash
npx ngrok http 8080
# set PUBLIC_BASE_URL to ngrok URL and restart
```

3. Configure Twilio:

* Buy a phone number.
* Voice webhook URL: `POST https://<ngrok>/twilio/voice`
* Enable Media Streams to our `wss://<ngrok>/ws/media` (or via the TwiML we return).

4. Trigger call:

```bash
curl -X POST https://<ngrok>/api/call \
  -H "Content-Type: application/json" \
  -d '{"to":"+1XXXXXXXXXX","orderHint":"1 large pepperoni, delivery to 123 Main St"}'
```

5. Observe logs. Verify:

* Agent discloses it’s AI.
* Collects size, toppings, delivery/pickup, address, phone, name.
* Repeats back order and address.
* Asks for total and confirms.

**Offline simulation (optional):**

* Place a test WAV in `test/fixtures/sample_call.wav` and feed into `simulateFromWav.ts` to test Realtime ingestion without Twilio. Cursor can implement basic WAV reading and streaming into the Realtime session.

---

## 11) Call outcome payload

When the call ends, produce a JSON result your app can store:

```json
{
  "callId": "CAxxxxxxxx",
  "startedAt": "2025-11-06T18:04:00Z",
  "endedAt": "2025-11-06T18:06:25Z",
  "durationSec": 145,
  "order": {
    "items": [
      {"size":"large","crust":"regular","toppings":["pepperoni"],"quantity":1}
    ],
    "delivery_method": "delivery",
    "customer": {"name":"John Doe","phone":"+15551234567"},
    "address": {"street":"123 Main St","city":"LA","state":"CA","zip":"90001"},
    "totals": {"subtotal": 17.5, "total": 20.1}
  },
  "transcriptUrl": null,
  "status": "confirmed"
}
```

Add a simple in-memory store or persist to your DB.

---

## 12) Barge-in, latency, and turn-taking

* Implement “barge-in”: if human speech is detected while TTS is playing, immediately pause/stop TTS output.
* Keep utterances short. Avoid long monologues; they increase token and minute costs.
* Pre-cache the initial greeting text so first audio frame returns fast.
* Enforce max turn duration; if staff is silent for >3–4 seconds, prompt briefly again.

Cursor tasks:

* Detect incoming `media` frames → if energy above threshold while agent is talking, stop sending agent audio immediately.
* Maintain a `speaking` flag to avoid half-duplex conflicts.

---

## 13) Error handling & retries

* If Realtime WebSocket drops: attempt one immediate reconnect; if call is still active, restore the session and re-send a short apology.
* If Twilio WS closes unexpectedly: end the Realtime session and clean up state.
* If the staff refuses automated orders, escalate to human (forward call to a human number):

  * Provide a TwiML `<Dial>` fallback number of your team member.

---

## 14) Cost controls

* Keep model replies short.
* End the call immediately after confirmation.
* Log `durationSec`, tokens (if available), and per-call cost estimate.
* Support a `maxCallMinutes` cap; if exceeded, apologize and end.

---

## 15) Security & compliance

* Always disclose that you’re an AI assistant calling on behalf of a customer.
* Don’t collect payment details via the agent unless you implement PCI-compliant flows; recommend “pay at pickup/delivery” or in-store phone transfer.
* Redact PII in logs; store only the minimal necessary fields.

---

## 16) Deployment

* Needs WebSocket support and long-lived connections.
* Suitable options: Fly.io, Render, Railway, a small VPS.
* Set `PUBLIC_BASE_URL` to your HTTPS domain.
* Add health endpoint `/healthz` returning 200 for uptime checks.

---

## 17) Minimal tasks for Cursor (paste into Cursor one-by-one)

**Task 1: Scaffold project**

* Create files/folders as in section 1.
* Add `package.json`, `tsconfig.json`, `logger.ts`, `config.ts` (loads env).
* Add `.env.example` with keys described.

**Task 2: Implement Express server & Twilio routes**

* `src/server.ts`, `src/telephony/twiml.ts`, `src/telephony/outbound.ts`.
* Confirm `/api/call` launches an outbound call and TwiML webhook responds.

**Task 3: Implement media WebSocket**

* `src/telephony/mediaStream.ts` and `registerMediaWs(server)`.
* Handle Twilio messages: `start`, `media`, `stop`.
* Convert μ-law base64 payloads to PCM buffer utility in `utils/audio.ts`.

**Task 4: Implement OpenAI Realtime session**

* `src/realtime/openaiRealtime.ts`: open WS to Realtime with model from env.
* Methods: `sendAudio`, `onAudio`, `sendEvent`, `close`.
* Parse messages, route audio chunks to `onAudio`.

**Task 5: Implement audio bridge**

* `src/realtime/audioBridge.ts`: wire twilioWs <-> realtime.
* Add barge-in logic and short-utterance policy.

**Task 6: Prompts, tools, and state**

* `prompts.ts`, `tools.ts`, `state.ts`.
* Implement tool handling: when Realtime emits a tool call JSON, validate with zod, update `state`, optionally send a concise agent acknowledgement.

**Task 7: Outcome & logging**

* On call end, emit the JSON result (section 11) to console for now; add a placeholder to POST it to your app later.

**Task 8: Tests**

* Add `test/scripts/simulateFromWav.ts` to stream a WAV into Realtime and log synthesized audio chunk count (dry run).
* Validate end-to-end manually via ngrok + a real call.

---

## 18) Acceptance checklist

* [ ] `/api/call` starts an outbound call to a real number.
* [ ] Staff hears a natural AI voice disclosing it’s an assistant.
* [ ] Agent asks for size/toppings, delivery/pickup, address, phone.
* [ ] Agent repeats back details exactly and asks for total.
* [ ] Barge-in works: if staff talks, agent stops speaking immediately.
* [ ] Outcome JSON produced with order details and totals.
* [ ] Max call duration enforced; logs contain per-call stats.
* [ ] No PII in general logs; only in structured outcome object.

---

## 19) Future enhancements (optional)

* Inbound support: phone number points to `/twilio/voice`, route to Realtime.
* Language switch based on detected language.
* Human-handoff: `<Dial>` your number if tool `escalate_to_human` is invoked.
* CRM/DB write: push outcome into Supabase table and your dashboard.

---

That’s the plan. Drop this into Cursor and let it generate the files piece by piece. If it gets confused, run the tasks in order and keep the prompts short and imperative.
