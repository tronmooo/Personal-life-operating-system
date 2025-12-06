# 🧪 Domain Testing Guide

## Quick Start

### Option 1: Automated Test Script (Recommended)
```bash
# Make sure you have tsx installed
npm install -g tsx

# Run the test script
npm run test:domains

# Or directly:
tsx scripts/test-domains.ts
```

### Option 2: Manual Browser Testing

1. **Open your dashboard** at http://localhost:3000
2. **Follow this checklist** for each domain card:

## ✅ Testing Checklist by Domain

### 💰 Financial
- [ ] Click on Financial card
- [ ] See account list
- [ ] Click "Add Account"
- [ ] Fill in: Name, Type (checking/savings), Balance
- [ ] Save and verify it appears
- [ ] Click edit icon, change balance
- [ ] Save and verify update
- [ ] Click delete, confirm removal

### ❤️ Health
- [ ] Click on Health card
- [ ] See vitals/medications tabs
- [ ] Add a vital (weight, BP, etc.)
- [ ] Add a medication
- [ ] Edit existing entry
- [ ] Verify data persists after refresh

### 🏠 Home
- [ ] Click on Home card
- [ ] Should show properties count
- [ ] Click "Add Property"
- [ ] Fill in address, type, value
- [ ] Save and verify
- [ ] Test maintenance tasks tab
- [ ] Test documents tab

### 🚗 Vehicles
- [ ] Click on Vehicles card
- [ ] See vehicle list
- [ ] Add a vehicle (make, model, year, VIN)
- [ ] Verify mileage tracking works
- [ ] Test edit functionality
- [ ] Verify insurance integration

### 🐾 Pets
- [ ] Click on Pets card
- [ ] See pet profiles
- [ ] Add a pet (name, species, breed)
- [ ] Test all tabs: Profile, Vaccinations, Costs, Documents, AI Vet
- [ ] Add vaccination record
- [ ] Add cost entry
- [ ] Verify edit works

### 🛡️ Insurance
- [ ] Click on Insurance card
- [ ] See policies list
- [ ] Add a policy (provider, type, premium)
- [ ] Test policies and claims tabs
- [ ] Edit existing policy
- [ ] Verify coverage details

### ⚖️ Legal
- [ ] Click on Legal card
- [ ] See documents list
- [ ] Add legal document
- [ ] Fill in document type, dates
- [ ] Test document upload
- [ ] Verify expiration tracking

### 💻 Digital
- [ ] Click on Digital card
- [ ] See subscriptions
- [ ] Add subscription (service, cost, billing cycle)
- [ ] Test password manager feature
- [ ] Edit subscription
- [ ] Track expiring subscriptions

### 💪 Fitness
- [ ] Click on Fitness card
- [ ] See workout dashboard
- [ ] Click "Log Workout" button (verify it works!)
- [ ] Add activity (type, duration, calories)
- [ ] See activities list
- [ ] Edit workout entry
- [ ] View fitness stats

### 🍎 Nutrition
- [ ] Click on Nutrition card
- [ ] See meal tracker
- [ ] Add meal (verify toast doesn't error!)
- [ ] Fill in meal type, calories, macros
- [ ] Test water intake tracker
- [ ] Edit meal entry
- [ ] View nutrition summary

### 🧘 Mindfulness
- [ ] Click on Mindfulness card
- [ ] See meditation logs
- [ ] Add meditation session
- [ ] Track duration and type
- [ ] View mindfulness stats

### 👥 Relationships
- [ ] Click on Relationships card
- [ ] See contacts list
- [ ] Add contact (name, relationship, phone)
- [ ] Edit contact details
- [ ] Track birthdays/events

### 🔧 Appliances
- [ ] Click on Appliances card
- [ ] See appliances list
- [ ] Add appliance (verify no auth errors!)
- [ ] Fill in name, category, purchase price
- [ ] Edit appliance details (verify editable!)
- [ ] Track warranty expiration

### 🎨 Miscellaneous
- [ ] Click on Miscellaneous card
- [ ] See items list
- [ ] Add miscellaneous item
- [ ] Edit item details

## 🚨 Known Issues to Verify Fixed

### ✅ Previously Fixed Issues:
- [x] Toast errors when uploading meals ➜ FIXED
- [x] Authentication redirect on appliance add ➜ FIXED
- [x] "Log Your First Workout" button not working ➜ FIXED
- [x] Cannot edit appliance details ➜ FIXED
- [x] Cannot edit meal entries ➜ FIXED
- [x] Cannot edit fitness activities ➜ FIXED
- [x] Cannot edit vehicle details ➜ FIXED
- [x] Cannot edit insurance policies ➜ FIXED
- [x] Career/Education/Utilities domains showing (deleted) ➜ FIXED

## 🔍 What to Look For

### ✅ Good Signs:
- Cards load without errors
- Data displays correctly
- Add/Edit/Delete all work
- No console errors (F12)
- Data persists after refresh
- Toast notifications show success messages

### ❌ Bad Signs:
- "Please sign in" errors when logged in
- Toast errors or crashes
- Buttons that do nothing
- Cannot edit existing entries
- Data doesn't persist
- Console shows TypeScript errors
- Blank/empty cards

## 🐛 Reporting Issues

If you find a broken domain, note:
1. **Domain name**: Which card/domain
2. **Action**: What you were trying to do
3. **Error**: What happened (screenshot console)
4. **Browser**: Chrome/Safari/Firefox
5. **Data**: Did you have existing data?

Example:
```
Domain: Nutrition 🍎
Action: Tried to add a meal
Error: Toast error "Cannot read property 'title' of undefined"
Browser: Chrome
Data: Had 3 existing meals
```

## 📊 Test Results Template

Copy this and fill it out:

```
## Test Results - [Date]

### Working ✅
- [ ] Financial 💰
- [ ] Health ❤️
- [ ] Home 🏠
- [ ] Vehicles 🚗
- [ ] Pets 🐾
- [ ] Insurance 🛡️
- [ ] Legal ⚖️
- [ ] Digital 💻
- [ ] Fitness 💪
- [ ] Nutrition 🍎
- [ ] Mindfulness 🧘
- [ ] Relationships 👥
- [ ] Appliances 🔧
- [ ] Miscellaneous 🎨

### Broken ❌
(list any broken domains with details)

### Notes:
(any other observations)
```

## 🎯 Priority Test Order

If you're short on time, test in this order:
1. **Financial** - Most used
2. **Health** - Critical data
3. **Pets** - Recently had issues
4. **Nutrition** - Recently had toast errors
5. **Fitness** - Recently fixed "Log Workout" button
6. **Appliances** - Recently had auth issues
7. Rest of the domains

## 🚀 Quick Smoke Test (5 minutes)

For a rapid check, do this:
1. Refresh dashboard
2. Verify all cards show counts (not errors)
3. Click into 3 random domains
4. Try to add one entry in each
5. If those work, likely all work!

