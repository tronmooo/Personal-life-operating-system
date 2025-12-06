# 🔌 AI CONCIERGE - API INTEGRATION GUIDE

## 📋 Overview

This guide will walk you through integrating real APIs to make your AI Concierge fully functional with actual phone calls, emails, calendar management, and payments.

---

## 🚀 INTEGRATION ROADMAP

### **Phase 1: Phone Calling** 📞
**Complexity:** ⭐⭐⭐⭐ (Moderate-High)  
**Cost:** $20-50/month  
**Setup Time:** 2-4 hours  
**Value:** ⭐⭐⭐⭐⭐ (Highest impact!)

### **Phase 2: Calendar** 📅
**Complexity:** ⭐⭐ (Easy)  
**Cost:** FREE  
**Setup Time:** 1-2 hours  
**Value:** ⭐⭐⭐⭐

### **Phase 3: Email** ✉️
**Complexity:** ⭐⭐ (Easy)  
**Cost:** FREE  
**Setup Time:** 1-2 hours  
**Value:** ⭐⭐⭐⭐

### **Phase 4: Payments** 💰
**Complexity:** ⭐⭐⭐ (Moderate)  
**Cost:** Transaction fees only  
**Setup Time:** 2-3 hours  
**Value:** ⭐⭐⭐

---

## 📞 PHASE 1: PHONE CALLING INTEGRATION

### **Services Needed:**

#### **1. Twilio (Voice Calls)**
- **Purpose:** Make and receive phone calls
- **Cost:** $1/month per phone number + $0.0085/min
- **Sign Up:** https://www.twilio.com/console

#### **2. Deepgram (Speech-to-Text)**
- **Purpose:** Convert speech to text in real-time
- **Cost:** $0.0043/min (first $200 FREE)
- **Sign Up:** https://console.deepgram.com/signup

#### **3. ElevenLabs (Text-to-Speech)**
- **Purpose:** Natural AI voice for phone calls
- **Cost:** $5/month for 30k characters
- **Sign Up:** https://elevenlabs.io/sign-up

---

### **Setup Steps:**

#### **Step 1: Twilio Setup**

```bash
# Install Twilio SDK
npm install twilio
```

```typescript
// lib/concierge/phone-service.ts
import twilio from 'twilio'

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

export async function makePhoneCall({
  to,
  from,
  objective,
  context
}: {
  to: string
  from: string
  objective: string
  context: any
}) {
  try {
    const call = await client.calls.create({
      url: `${process.env.NEXT_PUBLIC_URL}/api/voice/handle`,
      to: to,
      from: from,
      statusCallback: `${process.env.NEXT_PUBLIC_URL}/api/voice/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      record: true,
      recordingStatusCallback: `${process.env.NEXT_PUBLIC_URL}/api/voice/recording`
    })

    return {
      callSid: call.sid,
      status: call.status
    }
  } catch (error) {
    console.error('Phone call error:', error)
    throw error
  }
}
```

#### **Step 2: Create API Endpoint**

```typescript
// app/api/voice/handle/route.ts
import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'

export async function POST(req: NextRequest) {
  const VoiceResponse = twilio.twiml.VoiceResponse
  const response = new VoiceResponse()

  // Greet the person
  response.say({
    voice: 'Polly.Joanna'
  }, 'Hello, I am calling on behalf of John Smith to schedule an appointment.')

  // Gather user input
  const gather = response.gather({
    input: 'speech',
    action: '/api/voice/process-speech',
    method: 'POST',
    timeout: 3,
    speechTimeout: 'auto'
  })

  gather.say('Please tell me how I can help you.')

  return new NextResponse(response.toString(), {
    headers: {
      'Content-Type': 'text/xml'
    }
  })
}
```

#### **Step 3: Real-Time Conversation Handler**

```typescript
// app/api/voice/process-speech/route.ts
import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { Anthropic } from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const speechResult = formData.get('SpeechResult')?.toString() || ''
  
  // Use Claude to generate appropriate response
  const aiResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `You are making a phone call to schedule a doctor appointment. 
      The receptionist said: "${speechResult}"
      
      Respond naturally and professionally. Keep it brief.`
    }]
  })

  const responseText = aiResponse.content[0].type === 'text' 
    ? aiResponse.content[0].text 
    : 'I apologize, could you repeat that?'

  const VoiceResponse = twilio.twiml.VoiceResponse
  const response = new VoiceResponse()

  response.say({
    voice: 'Polly.Joanna'
  }, responseText)

  // Continue conversation
  response.redirect('/api/voice/handle')

  return new NextResponse(response.toString(), {
    headers: {
      'Content-Type': 'text/xml'
    }
  })
}
```

#### **Step 4: Environment Variables**

```bash
# .env.local
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

DEEPGRAM_API_KEY=your_deepgram_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here

ANTHROPIC_API_KEY=your_claude_key_here
```

---

## 📅 PHASE 2: CALENDAR INTEGRATION

### **Google Calendar Setup**

#### **Step 1: Enable Google Calendar API**
1. Go to: https://console.cloud.google.com/
2. Create new project: "LifeHub Concierge"
3. Enable Google Calendar API
4. Create OAuth 2.0 credentials
5. Download credentials JSON

#### **Step 2: Install Dependencies**

```bash
npm install googleapis @google-cloud/local-auth
```

#### **Step 3: Implementation**

```typescript
// lib/concierge/calendar-service.ts
import { google } from 'googleapis'

export async function checkCalendarAvailability(
  date: Date,
  duration: number // minutes
): Promise<boolean> {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/calendar']
  })

  const calendar = google.calendar({ version: 'v3', auth })

  const timeMin = date.toISOString()
  const timeMax = new Date(date.getTime() + duration * 60000).toISOString()

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: true
  })

  return response.data.items?.length === 0 // true if available
}

export async function addCalendarEvent({
  title,
  description,
  startTime,
  endTime,
  location
}: {
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
}) {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/calendar']
  })

  const calendar = google.calendar({ version: 'v3', auth })

  const event = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: title,
      description,
      location,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/New_York'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/New_York'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 } // 1 hour before
        ]
      }
    }
  })

  return event.data
}
```

---

## ✉️ PHASE 3: EMAIL INTEGRATION

### **Gmail API Setup**

#### **Step 1: Enable Gmail API**
1. Same Google Cloud Console as calendar
2. Enable Gmail API
3. Use same OAuth credentials

#### **Step 2: Implementation**

```typescript
// lib/concierge/email-service.ts
import { google } from 'googleapis'
import nodemailer from 'nodemailer'

export async function sendEmail({
  to,
  subject,
  body,
  html
}: {
  to: string
  subject: string
  body: string
  html?: string
}) {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/gmail.send']
  })

  const gmail = google.gmail({ version: 'v1', auth })

  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    body
  ].join('\n')

  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage
    }
  })

  return response.data
}

export async function draftEmail({
  to,
  subject,
  context
}: {
  to: string
  subject: string
  context: any
}): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Draft a professional email with the following:
      
      To: ${to}
      Subject: ${subject}
      Context: ${JSON.stringify(context)}
      
      Make it polite, professional, and concise.`
    }]
  })

  return response.content[0].type === 'text' 
    ? response.content[0].text 
    : ''
}
```

---

## 💰 PHASE 4: PAYMENT INTEGRATION

### **Plaid + Stripe Setup**

#### **Step 1: Plaid (Bank Connection)**

```bash
npm install plaid
```

```typescript
// lib/concierge/payment-service.ts
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

const plaidConfig = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET
    }
  }
})

const plaidClient = new PlaidApi(plaidConfig)

export async function getBankAccounts(accessToken: string) {
  const response = await plaidClient.accountsGet({
    access_token: accessToken
  })
  
  return response.data.accounts
}

export async function getAccountBalance(accessToken: string) {
  const response = await plaidClient.accountsBalanceGet({
    access_token: accessToken
  })
  
  return response.data.accounts[0].balances.current
}
```

#### **Step 2: Payment Processing**

```typescript
export async function payBill({
  amount,
  payee,
  accountId,
  requiresApproval = true
}: {
  amount: number
  payee: string
  accountId: string
  requiresApproval?: boolean
}) {
  // ALWAYS require approval for payments
  if (requiresApproval) {
    throw new Error('Payment requires explicit user approval')
  }

  // Implement actual payment logic here
  // Using Stripe, PayPal, or direct bank transfer

  return {
    success: true,
    transactionId: `TXN-${Date.now()}`,
    amount,
    payee,
    timestamp: new Date()
  }
}
```

---

## 🔐 SECURITY BEST PRACTICES

### **1. API Key Management**

```typescript
// Never commit API keys to git
// Use .env.local for local development
// Use environment variables in production

// .gitignore
.env.local
.env.production
credentials.json
```

### **2. User Permissions**

```typescript
// Always ask before sensitive actions
const REQUIRES_APPROVAL = {
  payment: true,
  cancelAppointment: true,
  deleteData: true,
  sharePersonalInfo: true
}

function requiresUserApproval(action: string): boolean {
  return REQUIRES_APPROVAL[action] === true
}
```

### **3. Rate Limiting**

```typescript
// Prevent API abuse
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // 10 requests per window
})

export default limiter
```

---

## 💵 COST BREAKDOWN

### **Monthly Costs (Moderate Usage)**

| Service | Cost | Usage |
|---------|------|-------|
| **Twilio Phone** | $1-20 | Base + per-minute |
| **Deepgram STT** | $0-10 | First $200 FREE |
| **ElevenLabs TTS** | $5-15 | 30k-100k chars |
| **Google Calendar** | FREE | Unlimited |
| **Gmail API** | FREE | Generous limits |
| **Plaid** | FREE | Up to 100 users |
| **Claude API** | $10-30 | Token usage |
| **Hosting** | $20 | Vercel Pro |
| **TOTAL** | **$36-95/mo** | Active usage |

### **Per-Task Costs**

| Task Type | Avg Cost |
|-----------|----------|
| **Phone Call (5 min)** | $0.05-0.15 |
| **Email Send** | FREE |
| **Calendar Update** | FREE |
| **Payment** | $0 (+ tx fees) |
| **AI Processing** | $0.01-0.05 |

---

## 🚀 DEPLOYMENT CHECKLIST

### **Before Going Live:**

- [ ] All API keys stored securely
- [ ] Environment variables configured
- [ ] User approval system working
- [ ] Error handling implemented
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Test all integrations
- [ ] User documentation complete
- [ ] Privacy policy updated
- [ ] Terms of service reviewed

---

## 🧪 TESTING

### **Test Each Integration:**

```typescript
// Phone call test
await makePhoneCall({
  to: YOUR_PHONE_NUMBER,
  from: TWILIO_NUMBER,
  objective: 'Test call',
  context: {}
})

// Calendar test
await addCalendarEvent({
  title: 'Test Event',
  startTime: new Date(),
  endTime: new Date(Date.now() + 3600000)
})

// Email test
await sendEmail({
  to: YOUR_EMAIL,
  subject: 'Test Email',
  body: 'This is a test'
})
```

---

## 📚 ADDITIONAL RESOURCES

### **Documentation:**
- Twilio: https://www.twilio.com/docs
- Deepgram: https://developers.deepgram.com/
- Google Calendar API: https://developers.google.com/calendar
- Gmail API: https://developers.google.com/gmail/api
- Plaid: https://plaid.com/docs/
- ElevenLabs: https://docs.elevenlabs.io/

### **Support:**
- Twilio Support: https://support.twilio.com/
- Google Cloud Console: https://console.cloud.google.com/
- Plaid Dashboard: https://dashboard.plaid.com/

---

## 🎊 READY TO GO LIVE!

Once you've completed these integrations, your AI Concierge will be fully operational with:

✅ Real phone calling capability  
✅ Live calendar integration  
✅ Email sending/receiving  
✅ Secure payment processing  
✅ End-to-end automation  

**Your AI Concierge will be able to genuinely handle real-world tasks!** 🎩✨
