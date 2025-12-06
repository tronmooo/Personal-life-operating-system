# OpenAI Realtime API Testing Guide

## Overview

This guide covers testing scenarios for the OpenAI Realtime API voice agent integration with Twilio. The system uses native speech-to-speech processing with agent handoff capabilities.

---

## Prerequisites

### Environment Setup

Ensure these environment variables are configured:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Running the Server

For WebSocket support, use the custom server:

```bash
# If you haven't already, rename server.example.js to server.js
cp server.example.js server.js

# Start server
node server.js
```

---

## Test Scenarios

### 1. Single Business Quote Call

**Objective:** Test basic quote extraction from a single business

**Steps:**
1. Open AI Concierge
2. Request: "Call Mike's Auto Shop and get a quote for an oil change"
3. Verify call is initiated with Realtime API
4. Check live transcript appears in monitor
5. Confirm quote is extracted automatically
6. Verify quote is saved to database

**Expected Results:**
- Call connects within 2 seconds
- Transcript shows in real-time
- Quote is extracted via `extract_quote` tool
- Call history saved with quote data

**Test Command:**
```javascript
POST /api/voice/initiate-call
{
  "phoneNumber": "+15551234567",
  "businessName": "Mike's Auto Shop",
  "userRequest": "Get quote for oil change",
  "category": "automotive",
  "userName": "Test User"
}
```

---

### 2. Multi-Business Price Comparison (3-5 Calls)

**Objective:** Test concurrent calls and quotes validator agent

**Steps:**
1. Request: "Call 3 pizza places and compare prices for large pepperoni"
2. Verify 3 concurrent calls are initiated
3. Check that each call has independent Realtime session
4. Observe quotes being extracted from each call
5. Verify handoff to quotes_validator agent
6. Confirm best quote is recommended

**Expected Results:**
- 3 calls initiated simultaneously
- Each call has independent transcript
- All quotes extracted successfully
- Agent handoff to quotes_validator occurs
- Comparison results provided

---

### 3. Order Placement with Confirmation

**Objective:** Test order placer agent and order confirmation

**Steps:**
1. Create order via `/api/orders/place-order`
2. Set `orderMethod: 'phone'`
3. Verify call is initiated to restaurant
4. Check agent handoff to order_placer
5. Confirm order details are communicated
6. Verify confirmation number is captured
7. Check order status is updated

**Expected Results:**
- Order created in database
- Call initiated with order details
- Agent handoff to order_placer
- Order confirmation received
- Order status updated to 'confirmed'

**Test Payload:**
```javascript
POST /api/orders/place-order
{
  "businessName": "Pizza Palace",
  "businessPhone": "+15559876543",
  "items": [
    { "name": "Large Pepperoni Pizza", "quantity": 1, "price": 15.99 }
  ],
  "orderType": "delivery",
  "orderMethod": "phone",
  "deliveryAddress": "123 Main St"
}
```

---

### 4. Appointment Scheduling

**Objective:** Test appointment scheduler agent

**Steps:**
1. Request: "Schedule a haircut at Joe's Barbershop for tomorrow at 2pm"
2. Verify call connects
3. Check agent handoff to appointment_scheduler
4. Confirm appointment details are communicated
5. Verify confirmation number is captured
6. Check appointment is saved

**Expected Results:**
- Call initiated successfully
- Handoff to appointment_scheduler
- Date and time confirmed
- Confirmation number extracted
- Appointment saved to database

---

### 5. Agent Handoff Validation

**Objective:** Test seamless transitions between specialized agents

**Scenario A: Main → Quotes Validator**
1. Start with main concierge
2. Request quotes from multiple businesses
3. Verify handoff when comparing quotes
4. Check context is preserved
5. Confirm return to main concierge

**Scenario B: Main → Order Placer**
1. Start with main concierge
2. Request to place an order
3. Verify handoff to order placer
4. Check order details are communicated
5. Confirm successful order placement

**Expected Results:**
- Handoffs occur at appropriate times
- Context is preserved across handoffs
- Transcript shows agent transitions
- Handoff history is recorded

**Monitoring Handoffs:**
```javascript
GET /api/voice/status?callSid=CAxxxx
// Response includes handoffHistory array
```

---

### 6. WebSocket Connection Stability

**Objective:** Test WebSocket audio streaming reliability

**Steps:**
1. Initiate a call
2. Monitor WebSocket connection status
3. Simulate network fluctuations (if testing)
4. Verify audio continues streaming
5. Check reconnection if disconnected
6. Confirm call completes successfully

**Expected Results:**
- WebSocket connects immediately
- Audio streams bidirectionally
- Connection remains stable
- Reconnection handled gracefully
- No audio dropouts

**Monitor WebSocket:**
```bash
# Check active sessions
GET /api/voice/stream

# Response shows active WebSocket sessions
{
  "activeSessions": 2,
  "sessions": [
    {
      "callSid": "CAxxxx",
      "businessName": "Mike's Auto",
      "duration": 45,
      "currentAgent": "main_concierge"
    }
  ]
}
```

---

## Performance Testing

### Latency Measurements

**Target Metrics:**
- Call initiation: < 2 seconds
- First response: < 500ms (Realtime API)
- Audio roundtrip: < 300ms
- Agent handoff: < 1 second

**Measurement Tools:**
```javascript
// In browser console
const start = Date.now()
fetch('/api/voice/initiate-call', {/*...*/})
  .then(() => console.log(`Initiated in ${Date.now() - start}ms`))
```

---

### Load Testing

**Concurrent Calls:**
Test system with multiple simultaneous calls:
- 5 concurrent calls
- 10 concurrent calls
- 20 concurrent calls

**Monitor:**
- WebSocket connection count
- Memory usage
- Response times
- Error rates

---

## Error Scenarios

### 1. Business Doesn't Answer

**Test:** Call a number that doesn't answer

**Expected:**
- Call rings for 60 seconds (Twilio timeout)
- Status updates to 'no-answer'
- Call history saved with status
- User notified of no answer

---

### 2. Voicemail Detection

**Test:** Call a number that goes to voicemail

**Expected:**
- Voicemail detected by Twilio
- AI leaves brief message if configured
- Call ends gracefully
- Status saved as 'voicemail'

---

### 3. WebSocket Disconnection

**Test:** Simulate WebSocket failure mid-call

**Expected:**
- System attempts reconnection
- Call continues via Twilio
- Transcript gap noted
- Graceful recovery or fallback

---

### 4. Invalid Phone Number

**Test:** Try to call invalid number

**Expected:**
- Twilio validation fails
- Error returned immediately
- User notified of invalid number
- No call initiated

---

## Monitoring & Debugging

### Real-Time Monitoring

Use the Realtime Call Monitor component:

```tsx
import { RealtimeCallMonitor } from '@/components/voice/realtime-call-monitor'

<RealtimeCallMonitor 
  callSid="CAxxxx" 
  onEndCall={() => console.log('Call ended')}
/>
```

### Logging

Enable debug logging:

```bash
DEBUG=true LOG_LEVEL=verbose node server.js
```

### Call History

Query call history from database:

```sql
SELECT * FROM call_history 
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

---

## Success Criteria

✅ **All scenarios pass**  
✅ **Latency within targets**  
✅ **No dropped calls**  
✅ **Agent handoffs smooth**  
✅ **Quotes extracted accurately**  
✅ **Orders placed successfully**  
✅ **Appointments scheduled correctly**  
✅ **Error handling graceful**  
✅ **WebSocket stable**  
✅ **Documentation complete**

---

## Troubleshooting

### Common Issues

**Issue: WebSocket not connecting**
- **Solution:** Ensure custom server is running (not `next dev`)
- Check: `node server.js` instead of `npm run dev`

**Issue: No audio in call**
- **Solution:** Verify TwiML includes `<Stream>` element
- Check: WebSocket URL is accessible

**Issue: Agent handoffs not working**
- **Solution:** Verify agent coordinator is initialized
- Check: Tool calls are being made correctly

**Issue: High latency**
- **Solution:** Check network connection to OpenAI
- Verify: Region settings for Twilio and OpenAI

---

## Next Steps After Testing

1. **Production Deployment**
   - Deploy custom server with WebSocket support
   - Configure production Twilio webhooks
   - Set up monitoring and alerting

2. **Optimization**
   - Fine-tune agent prompts
   - Optimize audio processing
   - Implement caching where applicable

3. **Scale Testing**
   - Test with higher concurrent loads
   - Monitor costs under production load
   - Implement rate limiting if needed

---

**Happy Testing! 🎉**






