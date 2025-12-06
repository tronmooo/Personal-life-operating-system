# 🎙️ OpenAI Realtime API Voice Agent Guide

**Complete Guide to Speech-to-Speech Voice Agents with Agent Handoff**

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Agent System](#agent-system)
4. [Implementation](#implementation)
5. [WebSocket Streaming](#websocket-streaming)
6. [Agent Handoff](#agent-handoff)
7. [Function Calling](#function-calling)
8. [UI Components](#ui-components)
9. [Testing](#testing)
10. [Production Deployment](#production-deployment)
11. [Troubleshooting](#troubleshooting)

---

## Overview

### What is the Realtime API?

OpenAI's Realtime API (`gpt-4o-realtime-preview`) provides native speech-to-speech capabilities:
- Direct audio input and output
- No transcription delays
- Emotion and tone detection
- Natural interruptions and turn-taking
- ~300-500ms latency (vs 1-2s for chained)

### Why Use Realtime API?

**Benefits over Chained Architecture:**
- **3-4x faster** response times
- **Better conversation flow** with natural interruptions
- **Emotion awareness** - detects tone, urgency, sentiment
- **Lower costs** - single model call vs 3 (Whisper + GPT + TTS)
- **Improved UX** - feels like talking to a human

---

## Architecture

### System Components

```
┌──────────────────────────────────────────────────────┐
│                  LifeHub Application                  │
│                                                        │
│  ┌────────────────────────────────────────────────┐  │
│  │          AI Concierge Interface                │  │
│  │  - User initiates calls                        │  │
│  │  - Real-time transcript display                │  │
│  │  - Agent status monitoring                     │  │
│  └────────────────────────────────────────────────┘  │
│                         ↓                              │
│  ┌────────────────────────────────────────────────┐  │
│  │     Voice API Routes                           │  │
│  │  - /api/voice/initiate-call                    │  │
│  │  - /api/voice/twiml                            │  │
│  │  - /api/voice/stream (WebSocket)               │  │
│  │  - /api/voice/status                           │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│                   Twilio Voice                        │
│  - Makes actual phone calls                           │
│  - Manages call state                                 │
│  - Streams audio via Media Streams                    │
└──────────────────────────────────────────────────────┘
           ↓                            ↑
    (outbound audio)            (inbound audio)
           ↓                            ↑
┌──────────────────────────────────────────────────────┐
│            WebSocket Audio Handler                    │
│  - Receives audio from Twilio                         │
│  - Forwards to OpenAI Realtime API                    │
│  - Returns AI responses to Twilio                     │
│  - Manages agent coordinator                          │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│          OpenAI Realtime API                          │
│  Model: gpt-4o-realtime-preview                       │
│  - Native speech-to-speech                            │
│  - Emotion detection                                  │
│  - Function calling                                   │
│  - < 500ms latency                                    │
└──────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────┐
│            Agent Coordinator                          │
│  - Main Concierge (general conversation)              │
│  - Quotes Validator (price comparison)                │
│  - Order Placer (restaurant orders)                   │
│  - Appointment Scheduler (bookings)                   │
└──────────────────────────────────────────────────────┘
```

---

## Agent System

### Agent Types

#### 1. Main Concierge
**Role:** General conversation and task routing

**Capabilities:**
- Initiates calls to businesses
- Explains purpose of call
- Extracts quotes and offers
- Hands off to specialized agents

**Tools:**
- `extract_quote`
- `schedule_appointment`
- `record_special_offer`
- `transfer_to_quotes_validator`
- `transfer_to_order_placer`
- `transfer_to_appointment_scheduler`

#### 2. Quotes Validator
**Role:** Compare and validate multiple quotes

**Capabilities:**
- Analyzes quotes from multiple sources
- Compares prices and services
- Identifies best value
- Makes recommendations

**Tools:**
- `validate_quote`
- `compare_quotes`

#### 3. Order Placer
**Role:** Place orders with businesses

**Capabilities:**
- Communicates order details
- Confirms items and customizations
- Gets confirmation numbers
- Verifies delivery information

**Tools:**
- `place_order`

#### 4. Appointment Scheduler
**Role:** Schedule appointments and reservations

**Capabilities:**
- Requests available times
- Confirms date and time
- Gets confirmation numbers
- Asks about preparation needed

**Tools:**
- `schedule_appointment`

---

## Implementation

### File Structure

```
lib/services/
  ├── realtime-voice-agent.ts      # Agent tools and configuration
  ├── agent-coordinator.ts          # Agent handoff management
  ├── websocket-audio-handler.ts    # WebSocket streaming handler
  └── twilio-voice-service.ts       # Twilio integration

app/api/voice/
  ├── initiate-call/route.ts        # Start calls
  ├── twiml/route.ts                # TwiML generation
  ├── stream/route.ts               # WebSocket endpoint
  └── status/route.ts               # Call status updates

components/voice/
  └── realtime-call-monitor.tsx     # UI component
```

### Creating Agents

```typescript
import { createAgentCoordinator } from '@/lib/services/agent-coordinator'
import { CallContext } from '@/lib/services/realtime-voice-agent'

const context: CallContext = {
  userId: 'user_123',
  businessName: 'Mike\'s Auto Shop',
  businessPhone: '+15551234567',
  userRequest: 'Get quote for oil change',
  category: 'automotive',
  userData: {
    name: 'John Doe',
    vehicles: [{ make: 'Toyota', model: 'Camry', year: 2020 }]
  }
}

const coordinator = createAgentCoordinator(context)

// Get current agent configuration
const currentAgent = coordinator.getCurrentAgent()

// Initiate handoff
coordinator.handoff('quotes_validator', 'Comparing multiple quotes', {
  quotes: [...]
})
```

---

## WebSocket Streaming

### Setup Requirements

**Custom Server Needed:**
Next.js doesn't support WebSockets natively. Use the provided custom server:

```bash
# Copy example server
cp server.example.js server.js

# Start server
node server.js
```

### WebSocket Flow

```
1. Twilio initiates call
2. TwiML returns <Stream> directive
3. WebSocket connection established to /api/voice/stream
4. Audio flows bidirectionally:
   - Business audio → WebSocket → Realtime API
   - AI responses → WebSocket → Twilio → Business
5. Function calls extracted automatically
6. Agent handoffs managed seamlessly
```

### Audio Format Conversion

**Twilio Format:**
- Codec: μ-law PCM
- Sample Rate: 8kHz
- Channels: Mono

**OpenAI Realtime Format:**
- Codec: PCM16
- Sample Rate: 24kHz
- Channels: Mono

**Conversion handled by:** `websocket-audio-handler.ts`

---

## Agent Handoff

### How Handoffs Work

1. **Main agent** recognizes need for specialized task
2. **Tool call** triggers handoff: `transfer_to_<agent_type>`
3. **Context preserved** across transition
4. **Specialized agent** handles specific task
5. **Return to main** when task complete

### Handoff Example

```typescript
// In main concierge instructions:
"If the user requests quotes from multiple businesses, 
transfer to the quotes_validator agent to compare and 
recommend the best option."

// Tool definition:
tool({
  name: 'transfer_to_quotes_validator',
  description: 'Transfer to agent that compares quotes',
  parameters: z.object({
    reason: z.string(),
    context: z.record(z.any()).optional()
  }),
  execute: async ({ reason, context }) => {
    coordinator.handoff('quotes_validator', reason, context)
    return { success: true, newAgent: 'quotes_validator' }
  }
})
```

### Monitoring Handoffs

```typescript
// Get handoff history
const handoffs = coordinator.getHandoffHistory()

// Example output:
[
  {
    fromAgent: 'main_concierge',
    toAgent: 'quotes_validator',
    reason: 'Comparing quotes from 3 businesses',
    context: { quoteCount: 3 },
    timestamp: '2025-11-15T10:30:00Z'
  }
]
```

---

## Function Calling

### Available Functions

#### extract_quote
```typescript
{
  name: 'extract_quote',
  parameters: {
    price: 49.99,              // Required
    currency: 'USD',            // Optional
    details: 'Full synthetic',  // Optional
    availability: 'Tomorrow'    // Optional
  }
}
```

#### schedule_appointment
```typescript
{
  name: 'schedule_appointment',
  parameters: {
    date: '2025-11-16',              // Required
    time: '2:00 PM',                 // Required
    confirmationNumber: 'APT-12345', // Optional
    notes: 'Bring vehicle'           // Optional
  }
}
```

#### place_order
```typescript
{
  name: 'place_order',
  parameters: {
    items: [
      {
        name: 'Large Pepperoni Pizza',
        quantity: 1,
        customizations: ['Extra cheese']
      }
    ],
    totalPrice: 15.99,
    confirmationNumber: 'ORD-67890',
    estimatedTime: '30-45 minutes'
  }
}
```

---

## UI Components

### Realtime Call Monitor

Display live call status with transcripts and agent tracking:

```tsx
import { RealtimeCallMonitor } from '@/components/voice/realtime-call-monitor'

<RealtimeCallMonitor
  callSid="CAxxxxxxxxxxxx"
  onEndCall={() => {
    console.log('Call ended')
    router.push('/call-history')
  }}
/>
```

**Features:**
- Live transcript with speaker identification
- Current agent indicator
- Agent handoff history
- Extracted quotes/appointments
- Audio level visualization
- Call duration timer
- End call button

---

## Testing

### Test Scenarios

See `REALTIME_API_TESTING_GUIDE.md` for comprehensive testing instructions.

**Quick Tests:**

1. **Single Call:**
```bash
curl -X POST http://localhost:3000/api/voice/initiate-call \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+15551234567",
    "businessName": "Test Business",
    "userRequest": "Get quote for service",
    "category": "general"
  }'
```

2. **Monitor Status:**
```bash
curl http://localhost:3000/api/voice/status?callSid=CAxxxx
```

3. **Check WebSocket:**
```bash
curl http://localhost:3000/api/voice/stream
```

---

## Production Deployment

### Prerequisites

- Custom Node.js server with WebSocket support
- Production Twilio account
- OpenAI API access to `gpt-4o-realtime-preview`

### Deployment Steps

1. **Update Environment:**
```bash
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

2. **Configure Twilio Webhooks:**
- Voice URL: `https://yourdomain.com/api/voice/twiml`
- Status Callback: `https://yourdomain.com/api/voice/status`

3. **Deploy Custom Server:**
```bash
# Build Next.js
npm run build

# Start production server
NODE_ENV=production node server.js
```

4. **Enable WebSocket in Infrastructure:**
- AWS: Use Application Load Balancer with WebSocket support
- Vercel: Not recommended (no WebSocket support)
- Custom VPS: Direct deployment works

---

## Troubleshooting

### WebSocket Connection Issues

**Problem:** WebSocket not connecting

**Solutions:**
- Ensure using `node server.js` not `npm run dev`
- Check firewall allows WebSocket connections
- Verify WSS protocol for HTTPS domains

### High Latency

**Problem:** Response time > 1 second

**Solutions:**
- Check network latency to OpenAI
- Verify audio format conversion is optimized
- Monitor Twilio Media Streams performance
- Consider regional Twilio numbers closer to OpenAI servers

### Agent Handoff Failures

**Problem:** Handoffs not occurring

**Solutions:**
- Verify tool definitions include handoff tools
- Check agent instructions mention when to transfer
- Review function call logs
- Ensure coordinator is properly initialized

### Audio Quality Issues

**Problem:** Choppy or unclear audio

**Solutions:**
- Verify audio format conversion
- Check WebSocket connection stability
- Monitor packet loss
- Test with different Twilio regions

---

## Cost Optimization

### Realtime API Pricing

- Input audio: ~$0.06/minute
- Output audio: ~$0.24/minute
- Average 2-minute call: ~$0.60

### Optimization Strategies

1. **Silence Detection:** Pause processing during silence
2. **Call Duration Limits:** Set max duration (2-3 minutes)
3. **Efficient Prompts:** Keep system prompts concise
4. **Agent Handoffs:** Use specialized agents only when needed

---

## Best Practices

1. **Prompt Engineering:**
   - Be specific about when to use functions
   - Include conversation exit strategies
   - Set clear success criteria

2. **Error Handling:**
   - Implement fallback for WebSocket failures
   - Handle voicemail gracefully
   - Retry failed function calls

3. **User Experience:**
   - Show real-time transcripts
   - Indicate agent changes visually
   - Provide manual call end option

4. **Monitoring:**
   - Track success rates by agent type
   - Monitor average call duration
   - Log function call success rates
   - Review handoff patterns

---

## Resources

- **OpenAI Realtime API Docs:** https://platform.openai.com/docs/guides/realtime
- **Agents SDK:** https://github.com/openai/openai-agents-js
- **Twilio Media Streams:** https://www.twilio.com/docs/voice/media-streams
- **Testing Guide:** `REALTIME_API_TESTING_GUIDE.md`
- **Setup Guide:** `OPENAI_VOICE_AGENT_SETUP.md`

---

**🎉 You're now ready to build powerful speech-to-speech voice agents!**






