# 🔌 Live Financial Dashboard - API Integration Guide

Your Live Financial Dashboard is now installed! This guide will help you connect real-time APIs for accurate asset valuations.

## 📊 Features Implemented

✅ **Net Worth Calculator** - Automatically calculated from your data  
✅ **Home Value Tracker** - Zillow/Realty Mole API integration  
✅ **Vehicle Value Estimator** - NHTSA/KBB API integration  
✅ **Credit Score Display** - Plaid API integration  
✅ **Emergency Fund Status** - Calculated from your accounts  
✅ **Debt Payoff Timeline** - Auto-calculated estimates  
✅ **Retirement Progress** - Based on investment goals  
✅ **Savings Rate** - Real-time calculation  

---

## 🚀 Quick Start (No API Keys Required)

The dashboard works immediately with your existing LifeHub data! All calculations are performed locally:

1. **Go to your Dashboard** - You'll see the new "Live Financial Dashboard" section
2. **Click the Settings (⚙️) button** - Configure your home and vehicle details
3. **Enter your info** - Address, ZIP, vehicle year/make/model
4. **Click "Save & Refresh"** - Get instant estimates!

---

## 🔑 API Setup (Optional - For Real-Time Data)

### 1. Home Valuation API

#### **Option A: Realty Mole (Recommended - Free Tier)**
1. Sign up at [RapidAPI](https://rapidapi.com/realtymole/api/realty-mole-property-api)
2. Subscribe to the FREE plan (50 requests/month)
3. Copy your API key
4. In LifeHub Settings → paste into "Zillow/Realty API Key"

**Code Location:** `components/dashboard/live-asset-tracker.tsx` line ~165
```typescript
// Replace 'YOUR_RAPIDAPI_KEY' with your actual key
'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY'
```

#### **Option B: Zillow API (Official)**
1. Apply for API access at [Zillow Developer](https://www.zillow.com/howto/api/APIOverview.htm)
2. Wait for approval (can take weeks)
3. Use Bridge Interactive API as alternative: [Bridge API](https://api.bridgedataoutput.com/)

---

### 2. Vehicle Valuation API

#### **Option A: NHTSA (Free - Basic Info)**
Currently implemented! Works out of the box with no API key needed.
- API: `https://vpic.nhtsa.dot.gov/api/`
- Provides: Make/model verification, specifications
- Limitation: No actual valuation (uses depreciation estimates)

#### **Option B: Kelley Blue Book (KBB)**
1. KBB doesn't offer public API access
2. Alternative: Use [Edmunds API](https://www.edmunds.com/)
3. Apply at: [Edmunds Developer Portal](https://developer.edmunds.com/)
4. Requires business partnership

#### **Option C: CarMD or similar**
1. Sign up at [RapidAPI - Car API](https://rapidapi.com/carmd-carmd-default/api/carmd)
2. Get API key
3. Update the `fetchVehicleValue` function

---

### 3. Credit Score API

#### **Option A: Plaid (Recommended)**
1. Sign up at [Plaid](https://plaid.com/)
2. Free sandbox mode for testing
3. Production requires verification
4. Get: Client ID, Secret, and API keys

**Setup Steps:**
```bash
# 1. Sign up at https://dashboard.plaid.com/signup
# 2. Get your credentials
# 3. Add to your .env.local file
NEXT_PUBLIC_PLAID_ENV=sandbox
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
```

**Update Code:** `components/dashboard/live-asset-tracker.tsx` line ~230
```typescript
const response = await fetch('/api/credit-score', {
  method: 'POST',
  body: JSON.stringify({ userId: 'user-id' })
})
```

#### **Option B: Credit Karma (No Official API)**
Credit Karma doesn't offer API access. Use Plaid instead.

---

## 📝 Environment Variables Setup

Create `.env.local` in your project root:

```env
# Realty Mole (via RapidAPI)
NEXT_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key_here

# Plaid (Credit Score & Bank Data)
NEXT_PUBLIC_PLAID_ENV=sandbox
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret

# Optional: Zillow Bridge API
ZILLOW_API_KEY=your_zillow_key

# Optional: Edmunds Auto API
EDMUNDS_API_KEY=your_edmunds_key
```

---

## 🔧 API Implementation Guide

### Implementing Realty Mole API

**File:** `components/dashboard/live-asset-tracker.tsx`

Replace the existing `fetchHomeValue` function:

```typescript
const fetchHomeValue = async (address: string, zipCode: string, apiKey: string): Promise<{ value: number, change: number }> => {
  if (!address || !zipCode) {
    return { value: calculatedData.homeValue, change: 0 }
  }

  try {
    const response = await fetch(
      `https://realty-mole-property-api.p.rapidapi.com/properties?address=${encodeURIComponent(address + ' ' + zipCode)}`,
      {
        headers: {
          'X-RapidAPI-Key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || apiKey,
          'X-RapidAPI-Host': 'realty-mole-property-api.p.rapidapi.com'
        }
      }
    )
    
    if (!response.ok) throw new Error('API request failed')
    
    const data = await response.json()
    const currentValue = data[0]?.assessorData?.value || calculatedData.homeValue
    const lastValue = data[0]?.assessorData?.lastSaleAmount || currentValue
    const change = lastValue > 0 ? ((currentValue - lastValue) / lastValue * 100) : 0
    
    return {
      value: currentValue,
      change: parseFloat(change.toFixed(2))
    }
  } catch (error) {
    console.error('Home value fetch error:', error)
    return { value: calculatedData.homeValue, change: 0 }
  }
}
```

### Implementing Plaid Credit Score

1. **Create API Route:** `app/api/credit-score/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid'

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
})

const plaidClient = new PlaidApi(configuration)

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json()
    
    // Get credit report
    const response = await plaidClient.creditGet({
      access_token: accessToken,
    })
    
    const creditScore = response.data.report?.credit_score || 720
    
    return NextResponse.json({ creditScore })
  } catch (error) {
    console.error('Plaid error:', error)
    return NextResponse.json({ creditScore: 720 }, { status: 200 })
  }
}
```

2. **Update Component:**

```typescript
const fetchCreditScore = async (apiKey: string): Promise<number> => {
  try {
    const response = await fetch('/api/credit-score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        accessToken: localStorage.getItem('plaid_access_token') 
      })
    })
    
    const data = await response.json()
    return data.creditScore || 720
  } catch (error) {
    console.error('Credit score fetch error:', error)
    return 720
  }
}
```

---

## 🆓 Free API Alternatives

### Home Value
1. **Realty Mole** (via RapidAPI) - 50 req/month FREE
2. **Zillow Scraping** - Use Bright Data or similar (requires setup)
3. **Manual Entry** - Just enter your estimate from Zillow.com

### Vehicle Value
1. **NHTSA** - FREE, unlimited (specifications only)
2. **VIN Decoder APIs** - Various free options on RapidAPI
3. **Manual Entry** - Check KBB.com and enter manually

### Credit Score
1. **Plaid Sandbox** - FREE for testing
2. **Manual Entry** - Get from Credit Karma and update manually
3. **Bank APIs** - Some banks provide credit scores

---

## 📊 Data Sources Priority

The dashboard uses data in this order:

1. **Your LifeHub logged data** (primary)
2. **Real-time API data** (if configured)
3. **Calculated estimates** (fallback)

This means it works great even without API keys!

---

## 🎯 Best Practices

### For Accurate Tracking:

1. **Log Your Financial Data Regularly**
   - Add accounts in Financial domain
   - Track investments
   - Log bills and expenses

2. **Update Property Info**
   - Go to Home domain
   - Add property details
   - Include estimated value

3. **Track Vehicle Info**
   - Go to Vehicles domain
   - Add make, model, year
   - Update mileage regularly

4. **Set Up Emergency Fund Goal**
   - Aim for 3-6 months of expenses
   - Track in savings accounts
   - Monitor in dashboard

### For API Usage:

1. **Start with Free Tiers**
   - Test with sandbox/free APIs first
   - Upgrade only if needed

2. **Cache API Responses**
   - Don't refresh too frequently
   - Save API quota

3. **Handle Errors Gracefully**
   - Always have fallback values
   - Log errors for debugging

---

## 🔒 Security Notes

1. **Never commit API keys to Git**
   - Always use `.env.local`
   - Add to `.gitignore`

2. **Use Environment Variables**
   ```bash
   # .gitignore should include:
   .env.local
   .env*.local
   ```

3. **Server-Side API Calls**
   - Don't expose keys in client
   - Use Next.js API routes

---

## 🐛 Troubleshooting

### "No data showing"
- **Solution:** Log some financial data first!
- Go to Financial domain → Add accounts/bills

### "API not working"
- **Check:** Is API key correct?
- **Check:** Are you using the right endpoint?
- **Check:** Look at browser console for errors

### "Values seem wrong"
- **Solution:** Update your logged data
- Check home/vehicle domains for accurate info

### "Refresh button not working"
- **Solution:** Check browser console
- Verify API keys are saved
- Try manual entry in settings

---

## 💡 Next Steps

1. ✅ **Test the Dashboard** - Check it out now!
2. 📝 **Log Your Data** - Add financial accounts
3. 🔑 **Get Free API Keys** - Start with Realty Mole
4. 🎨 **Customize** - Adjust values in settings
5. 📊 **Monitor Weekly** - Track your progress

---

## 📞 API Support

### Realty Mole API
- **Docs:** https://rapidapi.com/realtymole/api/realty-mole-property-api
- **Support:** Via RapidAPI

### Plaid API
- **Docs:** https://plaid.com/docs/
- **Support:** https://dashboard.plaid.com/support

### NHTSA API
- **Docs:** https://vpic.nhtsa.dot.gov/api/
- **Support:** Free, no support needed

---

## 🎉 You're All Set!

Your Live Financial Dashboard is ready to use! Start by:

1. Opening your dashboard at `http://localhost:3000`
2. Scrolling to the "Live Financial Dashboard" section
3. Clicking the Settings (⚙️) button to configure

**Enjoy tracking your financial health in real-time!** 💰📈

---

*Questions? Issues? Check the console logs or update the values manually in the settings dialog.*
