# 🎯 HOW TO USE YOUR COMPLETE BACKEND

## 🎉 Your Backend is 100% Live!

Everything is deployed and ready to use! Here's how to use each feature.

---

## 📊 Quick Overview

**What You Have:**
- ✅ 6 Database Tables
- ✅ 8 Edge Functions (All ACTIVE)
- ✅ Complete Financial Integration (Plaid)
- ✅ AI Features (Chat, Insights, OCR)
- ✅ Health Sync Ready
- ✅ Task Automation

---

## 💰 FINANCIAL DOMAIN - Connect Your Bank!

### **Step 1: Get Plaid API Keys (Free Sandbox)**

1. Go to [https://dashboard.plaid.com/signup](https://dashboard.plaid.com/signup)
2. Create free account
3. Go to **Team Settings → Keys**
4. Copy your:
   - `client_id`
   - `sandbox secret` (for testing)
5. Save these!

### **Step 2: Add Keys to Edge Functions**

1. Go to Supabase Dashboard
2. Click **Edge Functions**
3. Click **plaid-link**
4. Click **Settings** tab
5. Add secrets:
   ```
   PLAID_CLIENT_ID=your_client_id_here
   PLAID_SECRET=your_sandbox_secret_here
   PLAID_ENV=sandbox
   ```
6. Save

7. Repeat for **plaid-sync** function

### **Step 3: Use in Your App**

#### **A. Create Financial Connection Component**

```typescript
// components/financial-connection.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function FinancialConnection() {
  const [loading, setLoading] = useState(false)
  
  const connectBank = async () => {
    setLoading(true)
    
    try {
      // 1. Get Plaid Link token
      const { data, error } = await supabase.functions.invoke('plaid-link')
      
      if (error) throw error
      
      const linkToken = data.link_token
      
      // 2. Load Plaid Link
      const handler = Plaid.create({
        token: linkToken,
        onSuccess: async (public_token) => {
          // 3. Exchange token and sync data
          const { data: syncData } = await supabase.functions.invoke('plaid-sync', {
            body: {
              publicToken: public_token,
              accountId: null
            }
          })
          
          console.log('Synced!', syncData)
          alert('Bank connected successfully!')
        },
        onExit: () => {
          setLoading(false)
        }
      })
      
      handler.open()
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }
  
  return (
    <Button onClick={connectBank} disabled={loading}>
      {loading ? 'Connecting...' : 'Connect Bank Account'}
    </Button>
  )
}
```

#### **B. Show Financial Data**

```typescript
// components/financial-dashboard.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function FinancialDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadAnalytics()
  }, [])
  
  const loadAnalytics = async () => {
    try {
      const { data } = await supabase.functions.invoke('financial-analytics')
      setAnalytics(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <h2>Financial Overview</h2>
      
      {/* Total Balance */}
      <div>
        <h3>Total Balance</h3>
        <p>${analytics?.summary?.total_balance?.toFixed(2)}</p>
      </div>
      
      {/* Income vs Expenses */}
      <div>
        <h3>This Month</h3>
        <p>Income: ${analytics?.summary?.total_income?.toFixed(2)}</p>
        <p>Expenses: ${analytics?.summary?.total_expenses?.toFixed(2)}</p>
        <p>Net: ${analytics?.summary?.net_cash_flow?.toFixed(2)}</p>
      </div>
      
      {/* Accounts */}
      <div>
        <h3>Accounts</h3>
        {analytics?.accounts?.map((account) => (
          <div key={account.name}>
            <p>{account.name}: ${account.balance}</p>
          </div>
        ))}
      </div>
      
      {/* Spending by Category */}
      <div>
        <h3>Spending by Category</h3>
        {analytics?.category_breakdown?.map((cat) => (
          <div key={cat.name}>
            <p>{cat.name}: ${cat.amount.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

#### **C. Use in Financial Domain Page**

```typescript
// app/domains/financial/page.tsx
import { FinancialConnection } from '@/components/financial-connection'
import { FinancialDashboard } from '@/components/financial-dashboard'

export default function FinancialPage() {
  return (
    <div>
      <h1>Financial Domain</h1>
      
      {/* Connection Button */}
      <FinancialConnection />
      
      {/* Dashboard */}
      <FinancialDashboard />
    </div>
  )
}
```

---

## 🤖 AI CHAT ASSISTANT

### **How to Use:**

```typescript
// components/ai-chat.tsx
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function AIChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  
  const sendMessage = async () => {
    const userMessage = { role: 'user', content: input }
    setMessages([...messages, userMessage])
    setInput('')
    
    // Call AI edge function
    const { data } = await supabase.functions.invoke('ai-chat', {
      body: {
        messages: [...messages, userMessage],
        context: { /* user data */ }
      }
    })
    
    const aiMessage = {
      role: 'assistant',
      content: data.choices[0].message.content
    }
    
    setMessages([...messages, userMessage, aiMessage])
  }
  
  return (
    <div>
      {/* Chat UI */}
      {messages.map((msg, i) => (
        <div key={i}>{msg.content}</div>
      ))}
      
      <input 
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
      />
    </div>
  )
}
```

---

## 💡 AI INSIGHTS

### **How to Use:**

```typescript
// Get insights for any domain
const { data } = await supabase.functions.invoke('ai-insights', {
  body: {
    domain: 'financial', // or 'health', 'career', etc.
    domainData: yourDomainData,
    logHistory: recentLogs
  }
})

console.log(data.insights) // AI-generated recommendations
```

---

## 📄 DOCUMENT OCR

### **How to Use:**

```typescript
// After uploading image to storage
const { data: uploadData } = await supabase.storage
  .from('documents')
  .upload(`${userId}/document.jpg`, file)

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('documents')
  .getPublicUrl(uploadData.path)

// Process with OCR
const { data } = await supabase.functions.invoke('document-ocr', {
  body: {
    imageUrl: publicUrl,
    domainId: 'your-domain-id'
  }
})

console.log(data.text) // Extracted text
```

---

## 🎩 AI CONCIERGE

### **How to Use:**

```typescript
// components/concierge.tsx
const { data } = await supabase.functions.invoke('concierge-task', {
  body: {
    task: 'Schedule my dentist appointment for next week',
    taskType: 'appointment',
    context: { /* additional info */ }
  }
})

console.log(data.plan) // Execution plan
// {
//   task_type: 'appointment',
//   steps: ['Find dentist number', 'Call to schedule', 'Add to calendar'],
//   estimated_time: '10 minutes',
//   requires_approval: true
// }
```

---

## 🏃 HEALTH SYNC

### **How to Use:**

```typescript
// Sync health data from Fitbit, Apple Health, etc.
const { data } = await supabase.functions.invoke('health-sync', {
  body: {
    provider: 'fitbit', // or 'apple_health'
    data: {
      steps: 8500,
      heart_rate: 72,
      sleep_hours: 7.5,
      calories_burned: 2100,
      active_minutes: 45
    }
  }
})

// Data is now stored in health domain
```

---

## 🔗 EXTERNAL CONNECTIONS TABLE

### **Store API Tokens:**

```typescript
// Save Plaid access token
await supabase
  .from('external_connections')
  .insert({
    user_id: user.id,
    provider: 'plaid',
    connection_type: 'banking',
    access_token: plaid_access_token,
    metadata: {
      item_id: plaid_item_id,
      institution_name: 'Chase Bank'
    },
    status: 'active'
  })
```

### **Retrieve Tokens:**

```typescript
// Get Plaid connection
const { data } = await supabase
  .from('external_connections')
  .select('*')
  .eq('provider', 'plaid')
  .eq('connection_type', 'banking')
  .single()

const accessToken = data.access_token
```

---

## ⚙️ EDGE FUNCTION SECRETS

### **Required Secrets for Each Function:**

#### **All Functions:**
```
OPENAI_API_KEY=sk-your-key
SUPABASE_URL=https://jphpxqqilrjyypztkswc.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

#### **plaid-link & plaid-sync:**
```
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=sandbox
```

#### **health-sync (if using Fitbit):**
```
FITBIT_CLIENT_ID=your-fitbit-client-id
FITBIT_CLIENT_SECRET=your-fitbit-secret
```

### **How to Add Secrets:**

1. Supabase Dashboard → **Edge Functions**
2. Click function name
3. Click **Settings** tab
4. Add each secret
5. Click **Save**

---

## 📋 TESTING CHECKLIST

### **1. Test Database:**
- [ ] Sign up user
- [ ] Add domain data
- [ ] Check Table Editor - see data

### **2. Test AI Chat:**
- [ ] Call `ai-chat` function
- [ ] Get response from GPT-4

### **3. Test Financial:**
- [ ] Add Plaid keys to edge function
- [ ] Call `plaid-link` - get link token
- [ ] Connect bank (sandbox)
- [ ] Call `plaid-sync` - see transactions
- [ ] Call `financial-analytics` - see summary

### **4. Test OCR:**
- [ ] Upload image to storage
- [ ] Call `document-ocr`
- [ ] See extracted text

### **5. Test Insights:**
- [ ] Add some domain data
- [ ] Call `ai-insights`
- [ ] Get recommendations

---

## 🚀 DEPLOYMENT CHECKLIST

### **Before Production:**

1. **Environment Variables:**
   - [ ] All edge function secrets added
   - [ ] OpenAI key added
   - [ ] Plaid production keys (when ready)

2. **Storage:**
   - [ ] Create `documents` bucket
   - [ ] Set appropriate permissions

3. **Testing:**
   - [ ] Test all edge functions
   - [ ] Test financial flow end-to-end
   - [ ] Test AI features
   - [ ] Test document upload & OCR

4. **Plaid Migration:**
   - [ ] Test in sandbox thoroughly
   - [ ] Request Plaid production access
   - [ ] Update `PLAID_ENV` to `production`
   - [ ] Update secret to production key

---

## 💡 TIPS & TRICKS

### **Caching:**
- Financial data is cached in `domains` table
- Use `last_synced` to trigger refresh
- Default: sync every 24 hours

### **Error Handling:**
- All edge functions return `{ error: message }` on failure
- Check `error` field before using data

### **Rate Limits:**
- OpenAI: ~10,000 requests/day on tier 1
- Plaid Sandbox: Unlimited
- Plaid Production: Based on plan

### **Cost Optimization:**
- Cache AI responses
- Batch financial syncs (daily not hourly)
- Use transaction webhooks (advanced)

---

## 🎯 QUICK WINS

### **Week 1:**
1. ✅ Connect ONE bank account
2. ✅ See transactions in app
3. ✅ Test AI chat
4. ✅ Upload one document with OCR

### **Week 2:**
1. ✅ Add multiple accounts
2. ✅ Set up auto-sync
3. ✅ View spending analytics
4. ✅ Get AI financial insights

### **Week 3:**
1. ✅ Integrate health data
2. ✅ Use concierge features
3. ✅ Build custom dashboards
4. ✅ Invite family members

---

## 🆘 TROUBLESHOOTING

### **"Edge function not responding"**
- Check edge function secrets are set
- Verify API keys are valid
- Check function logs in Supabase

### **"Plaid connection failed"**
- Verify `PLAID_CLIENT_ID` and `PLAID_SECRET`
- Check `PLAID_ENV` is set to `sandbox`
- Make sure secrets are added to BOTH functions

### **"AI features not working"**
- Verify `OPENAI_API_KEY` is set
- Check you have OpenAI credits
- Verify key has correct permissions

### **"No data showing"**
- Check RLS policies (should be auto-created)
- Verify user is authenticated
- Check browser console for errors

---

## 📞 RESOURCES

### **Documentation:**
- Plaid: [https://plaid.com/docs](https://plaid.com/docs)
- OpenAI: [https://platform.openai.com/docs](https://platform.openai.com/docs)
- Supabase: [https://supabase.com/docs](https://supabase.com/docs)

### **Your Project:**
- Supabase Dashboard: [https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc](https://supabase.com/dashboard/project/jphpxqqilrjyypztkswc)
- Edge Functions: 8 deployed and active
- Tables: 6 with RLS

---

## 🎉 YOU'RE READY!

Your backend is **complete** and **ready to use**!

**Next steps:**
1. Add Plaid API keys
2. Create storage bucket
3. Test financial connection
4. Build UI components
5. Launch! 🚀

**Your financial domain will work with REAL bank data as soon as you add Plaid keys!**
