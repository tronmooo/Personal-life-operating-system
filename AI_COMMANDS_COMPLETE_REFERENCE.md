# 🤖 LifeHub AI Assistant - Complete Command Reference

> **Generated:** December 27, 2025  
> **Total Commands:** 100+  
> **Domains:** 21  
> **Tools:** 75+

## Table of Contents
1. [Core AI Actions](#core-ai-actions)
2. [Voice Commands by Domain](#voice-commands-by-domain)
3. [Data Logging Commands](#data-logging-commands)
4. [Planning & Creation Commands](#planning--creation-commands)
5. [Query & Analysis Commands](#query--analysis-commands)
6. [Navigation Commands](#navigation-commands)
7. [Tool Commands](#tool-commands)
8. [Visualization Commands](#visualization-commands)
9. [Integration Commands](#integration-commands)
10. [AI Tools (29 Powered Tools)](#ai-tools-29-powered-tools)
11. [Calculators (50+ Tools)](#calculators-50-tools)
12. [Safe Code Calculations](#safe-code-calculations)

---

## Core AI Actions

These are the authorized actions the AI assistant can perform:

### CRUD / Data Management
| Action | Description | Example |
|--------|-------------|---------|
| `create_entry` | Create new domain entry | "Log weight 175 lbs" |
| `update` | Update existing entry | "Update my car's mileage to 50000" |
| `delete` | Delete entry (requires confirmation) | "Delete my last expense" |
| `bulk_update` | Update multiple entries | "Mark all tasks from last week as done" |
| `bulk_delete` | Delete multiple entries (requires confirmation) | "Delete all completed tasks" |
| `archive` | Archive old entries | "Archive entries older than 6 months" |
| `restore` | Restore archived entries | "Restore my archived health data" |
| `find_duplicates` | Find duplicate entries | "Find duplicate expenses" |

### Planning Objects
| Action | Description | Example |
|--------|-------------|---------|
| `create_task` | Create a new task | "Add task call dentist" |
| `create_habit` | Create a new habit | "Create habit exercise daily" |
| `create_bill` | Create a recurring bill | "Add bill Netflix $15.99 monthly" |
| `create_event` | Create an event | "Schedule meeting tomorrow at 3pm" |
| `complete_task` | Mark task as complete | "Mark buy groceries as done" |
| `complete_habit` | Log habit completion | "Did my meditation habit" |
| `create_journal` | Create journal entry | "Journal: Today was productive" |

### Analysis / Reporting
| Action | Description | Example |
|--------|-------------|---------|
| `analyze` | Analyze domain data | "Analyze my spending this month" |
| `predict` | Generate forecasts | "Predict my weight in 30 days" |
| `correlate` | Find correlations | "Correlate my sleep with my mood" |
| `generate_report` | Generate summary report | "Generate health report for this month" |
| `custom_chart` | Create visualizations | "Create pie chart of expenses" |

### Export
| Action | Description | Example |
|--------|-------------|---------|
| `export` | Export data (JSON/CSV) | "Export my health data as CSV" |

### Utility / Navigation
| Action | Description | Example |
|--------|-------------|---------|
| `navigate` | Navigate to pages | "Go to health page" |
| `open_tool` | Open specific tools | "Open BMI calculator" |
| `execute_code` | Run safe calculations | "Calculate compound interest" |

### Integrations
| Action | Description | Example |
|--------|-------------|---------|
| `add_to_google_calendar` | Add event to Google Calendar | "Add meeting to Google Calendar tomorrow at 2pm" |

---

## Voice Commands by Domain

### 📊 Health Domain

**Weight:**
```
"I weigh 175 pounds"
"weigh about 180"
"my weight is 170"
"weight 165 lbs"
"I weigh 75 kg"
```

**Height:**
```
"height is 6 feet 2 inches"
"I'm 5 foot 8"
"tall 5 feet 10 inches"
```

**Sleep:**
```
"slept 8 hours"
"sleep for 7.5 hours"
"slept for 6 hrs"
```

**Steps:**
```
"10000 steps"
"walked 8000 steps"
"took 5000 steps"
"did 12000 steps"
```

**Water:**
```
"16 ounces of water"
"drank 12 oz"
"log 20 ounces water"
"8 oz water"
```

**Blood Pressure:**
```
"blood pressure 120 over 80"
"blood pressure 130/85"
"BP 115 over 75"
```

**Heart Rate:**
```
"heart rate 72"
"pulse 85 bpm"
"heart rate is 68"
```

**Temperature:**
```
"temperature 98.6"
"temp is 99.2 degrees"
"temperature 100.1"
```

**Mood:**
```
"feeling great"
"feel happy"
"mood is stressed"
"feeling anxious"
"feel calm"
```
**Supported moods:** great, good, okay, fine, bad, terrible, happy, sad, stressed, anxious, calm, energetic, tired, angry

---

### 💪 Fitness Domain

**Workouts:**
```
"did 30 minute cardio workout"
"finished 45 min running session"
"completed a 60 minute yoga exercise"
"ran 5 miles in 40 minutes"
```

**Strength Training:**
```
"did 3 push-ups 15 reps"
"4 squats 20 reps"
"3 bench press 12 repetitions"
"bench press 3 sets of 10 reps"
```

**Calories Burned:**
```
"burned 300 calories"
"burned 500 cal"
```

---

### 🍎 Nutrition Domain

**Meals:**
```
"ate chicken salad 450 calories"
"had lunch 600 cal"
"log breakfast burrito 500 calories"
"consumed dinner 800 calories"
"ate a cheese burrito" (AI estimates calories!)
```

**Protein:**
```
"ate 50 grams protein"
"had 30g of protein"
"consumed 45 grams protein"
```

**Water (also logged to nutrition):**
```
"drank 16 ounces water"
"had 8 glasses of water"
```

---

### 💰 Financial Domain

**Expenses:**
```
"spent 50 dollars on groceries"
"paid $25 for coffee"
"bought $100 on clothes"
"expense $15 for lunch"
"spent 30 bucks on gas"
```

**Income:**
```
"earned 500 dollars"
"received $1000 for freelance work"
"got paid $2000"
"income $150"
```

---

### 🚗 Vehicles Domain

**Gas Fill-ups:**
```
"filled up for 45 dollars"
"got gas for $50"
"filled gas $60"
```

**Mileage:**
```
"mileage 35000"
"odometer at 42,500 miles"
"mileage is 50000"
```

**Maintenance:**
```
"oil change $120 today"
"tire rotation $60"
"car service next Tuesday"
"brake replacement $400"
```

---

### 🐕 Pets Domain

**Feeding:**
```
"fed the dog"
"fed cat"
"fed pet breakfast"
```

**Walking:**
```
"walked the dog 30 minutes"
"walked pet for 20 min"
"walked dog 45 minutes"
```

**Expenses:**
```
"rex had vet appointment $150"
"spent $40 on dog food"
"grooming $80"
```

---

### 🏠 Home/Property Domain

**Rent/Mortgage:**
```
"paid rent $1500"
"mortgage payment $2000"
```

**Utilities:**
```
"electric bill $150"
"water bill $80"
"gas bill $60"
```

**Repairs:**
```
"fixed the sink $200"
"plumber $300"
"HVAC repair $500"
```

**Taxes:**
```
"property tax $5000"
"HOA fee $200"
```

---

### 🧘 Mindfulness Domain

**Meditation:**
```
"meditated 20 minutes"
"meditate for 15 min"
"meditated 30 minutes"
```

**Journal:**
```
"journal: Today was a great day"
"write in my journal about the meeting"
"dear diary, I felt accomplished today"
"add journal entry about my progress"
```

**Notes:**
```
"make a note about the meeting"
"add note that project deadline is next week"
"note: remember to follow up with John"
"remember that the password is..."
```

---

### 💼 Career Domain

**Interviews:**
```
"interview at Amazon tomorrow"
"interview with Google next week"
"job interview at 2pm"
```

**Meetings:**
```
"meeting with John at 3pm"
"team meeting tomorrow"
"appointment with HR"
```

**Applications:**
```
"applied to Microsoft"
"job application at Tesla"
```

---

### ✅ Tasks Domain

**Create Tasks:**
```
"add task call dentist"
"create a task buy groceries"
"add task finish report"
"remind me to pay bills"
"todo: send email to client"
```

**Complete Tasks:**
```
"mark buy groceries as done"
"complete task call dentist"
"finished the project report"
"done with buy groceries"
"check off send email"
```

---

### 🎯 Goals Domain

**Create Goals:**
```
"set goal to read 50 books this year"
"goal to lose 20 pounds"
"add goal save $10000"
```

**Progress:**
```
"goal weight loss 50%"
"progress marathon training 75%"
"goal save money is 30%"
```

---

### ✨ Habits Domain

**Create Habits:**
```
"add habit exercise daily"
"create habit drink water"
"new habit read 30 minutes"
"track meditation daily"
```

**Complete Habits:**
```
"completed my morning habit"
"did reading habit"
"did my exercise habit today"
"logged meditation habit"
```

---

### 📚 Education Domain
```
"completed course module 5"
"studied for 2 hours"
"finished certification exam"
"started learning Python"
```

### ✈️ Travel Domain
```
"booked flight to NYC"
"hotel reservation in Paris"
"trip to Europe next month"
"rental car $200"
```

### 📄 Insurance Domain
```
"paid insurance $150"
"insurance premium due"
"renewed car insurance"
```

### ⚖️ Legal Domain
```
"signed contract"
"document expires Dec 31"
"legal deadline next week"
```

### 🔧 Appliances Domain
```
"repaired dishwasher"
"refrigerator warranty expires December"
"washer maintenance $100"
```

### 📱 Digital Life Domain
```
"renewed Netflix subscription"
"new password for Amazon"
"cancelled Spotify"
```

### 👥 Relationships Domain
```
"met with friend John"
"call mom on Sunday"
"anniversary next week"
```

### 🎨 Hobbies Domain
```
"worked on painting 2 hours"
"practiced guitar 30 min"
"finished book chapter 5"
```

---

## Planning & Creation Commands

### Tasks
```
"add task [description]"
"create task [description]"
"remind me to [action]"
"todo: [description]"
```
**Extracts:** title, description, priority (low/medium/high), due_date

### Habits
```
"add habit [name]"
"create habit [name] daily/weekly"
"new habit [name]"
"track [habit name]"
```
**Extracts:** name, icon (emoji), frequency (daily/weekly/monthly)

### Bills
```
"add bill [name] $[amount]"
"create bill [name] due [date]"
"new bill [name] monthly"
```
**Extracts:** name, amount, dueDate, recurring, category

### Events
```
"schedule [event] on [date]"
"add event [title]"
"meeting on [date] at [time]"
```
**Extracts:** title, date, time, location, description

### Journal
```
"journal: [content]"
"write in my journal [content]"
"add journal entry [content]"
"create journal entry [content]"
"dear diary [content]"
```
**Extracts:** title, content, mood

### Notes
```
"make a note [content]"
"add note [content]"
"note: [content]"
"remember that [content]"
```
**Extracts:** title (first sentence), content (full text)

---

## Query & Analysis Commands

### Financial Queries
```
"What's my net worth?"
"How much did I spend this month?"
"Show my expenses from last week"
"What's my total spending this week?"
"Compare my spending vs income"
"What are my biggest expense categories?"
```

### Health Queries
```
"What's my current weight?"
"Show my weight trend this month"
"How many steps did I walk this week?"
"What's my average sleep?"
"Show my blood pressure history"
```

### General Queries
```
"Show my appointments"
"What's my schedule?"
"List my tasks"
"Show my habits"
"How many workouts this week?"
"What did I log yesterday?"
```

### Document Retrieval
```
"Can I get my auto insurance"
"Pull up my car insurance"
"Show me my ID"
"Get my vehicle registration"
"Find my health insurance card"
"Retrieve my license and insurance"
"Where's my passport"
"Do I have any insurance documents"
```

### Aggregate Queries
```
"How many workouts did I do this week?"
"Total steps this month"
"Average calories per day"
"Sum of expenses this year"
```

### Trend Analysis
```
"Show my weight trend"
"How has my spending changed"
"Sleep pattern this month"
"Workout frequency over time"
```

---

## Navigation Commands

```
"go to [page/domain]"
"open [page/domain]"
"show me [page/domain]"
"take me to [page/domain]"
```

### Available Destinations

| Destination | Path |
|-------------|------|
| dashboard / home / command_center | `/` |
| health | `/domains/health` |
| fitness | `/domains/fitness` |
| nutrition | `/domains/nutrition` |
| financial / finance | `/domains/financial` |
| vehicles | `/domains/vehicles` |
| pets | `/domains/pets` |
| insurance | `/domains/insurance` |
| travel | `/domains/travel` |
| education | `/domains/education` |
| career | `/domains/career` |
| relationships | `/domains/relationships` |
| mindfulness | `/domains/mindfulness` |
| property | `/domains/property` |
| legal | `/domains/legal` |
| appliances | `/domains/appliances` |
| digital | `/domains/digital-life` |
| hobbies | `/domains/hobbies` |
| goals | `/domains/goals` |
| tools | `/tools` |
| calculators / ai_tools | `/ai-tools-calculators` |
| ai | `/ai` |
| ai_chat | `/ai-chat` |
| ai_assistant | `/ai-assistant` |
| settings | `/settings` |
| calendar | `/calendar` |
| documents | `/documents` |
| notifications | `/notifications` |
| activity | `/activity` |
| domains / all_domains | `/domains` |

---

## Tool Commands

```
"open [tool name]"
"use [tool name] calculator"
"start [tool name]"
```

### Available Tools

| Tool | Command Keywords |
|------|------------------|
| BMI Calculator | `bmi`, `bmi_calculator` |
| Calorie Calculator | `calorie`, `calorie_calculator` |
| Mortgage Calculator | `mortgage`, `mortgage_calculator` |
| Compound Interest | `compound_interest` |
| Retirement Calculator | `retirement`, `retirement_calculator` |
| Loan Calculator | `loan` |
| Tip Calculator | `tip` |
| Net Worth Calculator | `net_worth` |
| Budget Calculator | `budget` |
| Receipt Scanner | `receipt_scanner` |
| Expense Tracker | `expense_tracker` |
| Invoice Generator | `invoice` |
| Document Scanner | `document_scanner` |
| Contract Reviewer | `contract_reviewer` |
| Smart Scheduler | `scheduler` |
| Meal Planner | `meal_planner` |
| Email Assistant | `email_assistant` |
| Translator | `translator` |
| Currency Converter | `currency` |
| Unit Converter | `unit` |
| Timezone Converter | `timezone` |
| Password Generator | `password` |
| QR Code Generator | `qr` |
| Pomodoro Timer | `pomodoro` |

---

## Visualization Commands

```
"create a chart of [data]"
"show me a [chart type] of [domain]"
"visualize my [domain] data"
"graph my [metric] over [time period]"
"plot [metric] for [domain]"
```

### Chart Types
- `line` - Line chart for trends
- `bar` - Bar chart for comparisons
- `pie` - Pie chart for distributions
- `area` - Area chart for cumulative data
- `multi_line` - Multiple line series
- `scatter` - Scatter plot for correlations
- `heatmap` - Heat map for patterns
- `radar` - Radar chart for multi-metric
- `stacked_bar` - Stacked bar chart
- `combo` - Combined chart types

### Examples
```
"Create a pie chart of my expenses"
"Show me a line chart of my weight this year"
"Visualize my health data over the past year"
"Graph my spending by category"
"Compare my income vs expenses in a bar chart"
"Plot my workout duration this month"
"Create a scatter plot of sleep vs mood"
```

### Date Ranges
- `today`
- `yesterday`
- `this_week`
- `last_week`
- `this_month`
- `last_month`
- `this_year`
- `last_year`
- `all`

---

## Integration Commands

### Google Calendar

**Trigger Phrases:**
```
"add to google calendar [event]"
"add to my calendar [event]"
"put [event] on my google calendar"
"schedule on google calendar [event]"
"create google calendar event [event]"
"add [event] to calendar"
"put [event] on calendar"
"calendar event: [event]"
"gcal: [event]"
```

**Examples:**
```
"Add meeting with John tomorrow at 3pm to Google Calendar"
"Put dentist appointment Dec 20 at 10am on my calendar"
"gcal: team standup Monday at 9:30am for 30 minutes"
"Add birthday party to calendar on Saturday all day"
"Schedule interview at Google next Tuesday 2pm"
```

**Extracts:**
- title/summary
- date (supports: "tomorrow", "next Tuesday", "Dec 15", etc.)
- time (supports: "3pm", "15:00", "2:30pm", etc.)
- duration (minutes, default 60)
- location
- description
- allDay (boolean)

---

## AI Tools (29 Powered Tools)

### Tax & Financial (7 tools)
1. **AI Tax Prep Assistant** - Smart tax preparation help
2. **Smart Expense Tracker** - Automatic expense categorization
3. **Receipt Scanner Pro** - OCR receipt processing
4. **AI Invoice Generator** - Create professional invoices
5. **Smart Budget Creator** - AI-optimized budgets
6. **Bill Pay Automation** - Automated bill management
7. **Financial Report Generator** - Comprehensive financial reports

### Document Processing (5 tools)
1. **Smart Form Filler** - Auto-fill forms with your data
2. **Document Summarizer** - AI document summaries
3. **AI Data Entry Assistant** - Smart data extraction
4. **Contract Reviewer** - AI contract analysis
5. **Smart Document Organizer** - Auto-categorize documents

### Scheduling & Planning (5 tools)
1. **Smart Scheduler** - AI-powered scheduling
2. **Calendar Optimizer** - Optimize your calendar
3. **AI Travel Planner** - Smart trip planning
4. **AI Meal Planner** - Personalized meal plans
5. **Task Prioritizer AI** - Smart task prioritization

### Communication (4 tools)
1. **AI Email Assistant** - Draft and improve emails
2. **Customer Service Chatbot** - Handle inquiries
3. **Meeting Notes AI** - Automatic meeting summaries
4. **AI Translator Pro** - Multi-language translation

### Research & Analysis (4 tools)
1. **Service Comparator** - Compare services/prices
2. **Price Tracker AI** - Track price changes
3. **Eligibility Checker** - Check benefit eligibility
4. **Deadline Tracker Pro** - Never miss deadlines

### Administrative (4 tools)
1. **Smart Checklist Generator** - Auto-generate checklists
2. **Renewal Reminder System** - Track renewals
3. **Application Status Tracker** - Track applications
4. **Document Template Generator** - Create templates

---

## Calculators (50+ Tools)

### 🏥 Health & Fitness (15)
| Calculator | Description |
|------------|-------------|
| BMI Calculator | Calculate Body Mass Index |
| Body Fat Calculator | Estimate body fat percentage |
| Calorie Calculator | Daily calorie needs |
| Macro Calculator | Macronutrient targets |
| Water Intake Calculator | Daily water recommendations |
| Heart Rate Zones | Optimal heart rate zones |
| Sleep Calculator | Optimal sleep/wake times |
| Protein Intake Calculator | Daily protein needs |
| Meal Planner | Plan weekly meals |
| Workout Planner | Create workout routines |
| VO2 Max Calculator | Aerobic capacity |
| Running Pace Calculator | Pace and splits |
| Body Age Calculator | Biological age estimate |
| Ideal Weight Calculator | Ideal weight range |
| Pregnancy Calculator | Due date calculator |

### 💰 Financial (15)
| Calculator | Description |
|------------|-------------|
| Net Worth Calculator | Calculate net worth |
| Budget Optimizer | AI budget planning |
| Mortgage Calculator | Mortgage payments |
| Loan Amortization | Loan payment schedule |
| Compound Interest | Interest growth |
| Retirement Calculator | Retirement planning |
| Debt Payoff | Debt payoff plan |
| Savings Goal | Savings targets |
| Emergency Fund | Emergency fund needs |
| ROI Calculator | Return on investment |
| Tax Estimator | Tax estimates |
| Budget Planner | Monthly budgets |
| Home Affordability | How much house |
| Auto Loan Calculator | Auto loan payments |
| Investment Calculator | Investment returns |

### 💼 Business (5)
| Calculator | Description |
|------------|-------------|
| Markup Calculator | Markup and margin |
| Hourly Rate Calculator | Billing rate |
| Project Cost Estimator | Project costs |
| Paycheck Calculator | Take-home pay |
| Break-Even Analysis | Break-even point |

### 🏠 Property (5)
| Calculator | Description |
|------------|-------------|
| Paint Calculator | Paint needed |
| Tile Calculator | Tiles needed |
| Roofing Calculator | Roofing materials |
| Energy Cost Calculator | Energy costs |
| Renovation Cost Estimator | Renovation costs |

### 🔧 Utility (10)
| Calculator | Description |
|------------|-------------|
| Tip Calculator | Calculate tips |
| Unit Converter | Convert units |
| Currency Converter | Convert currencies |
| Time Zone Converter | Time zone conversion |
| Pomodoro Timer | Focus timer |
| Age Calculator | Calculate exact age |
| Date Difference | Days between dates |
| Password Generator | Secure passwords |
| QR Code Generator | Create QR codes |
| Color Picker | Pick/convert colors |

---

## Safe Code Calculations

The AI can execute these pre-defined safe calculations:

### `compound_interest`
```
Inputs: principal, rate, years, compoundingFrequency
Output: finalAmount, interestEarned
```

### `monthly_payment`
```
Inputs: principal, annualRate, months
Output: monthlyPayment, totalPayment, totalInterest
```

### `savings_goal`
```
Inputs: targetAmount, monthlyContribution, annualRate
Output: monthsToGoal, timeToGoal, totalContributed
```

### `bmi`
```
Inputs: weight, height, unit (imperial/metric)
Output: bmi, category
```

### `calorie_deficit`
```
Inputs: currentWeight, targetWeight, weeksToGoal
Output: dailyCalorieDeficit, poundsPerWeek, recommendation
```

---

## Multiple Commands in One Message

You can combine multiple commands in a single message:

```
"I weigh 175 pounds, walked 10000 steps, drank 32 oz water, 
slept 8 hours, and feeling great"
```

The AI detects and saves ALL commands:
- ✅ Weight: 175 lbs → Health domain
- ✅ Steps: 10000 → Health domain
- ✅ Water: 32 oz → Nutrition domain
- ✅ Sleep: 8 hours → Health domain
- ✅ Mood: great → Health domain

---

## Tips for Best Results

### 1. Natural Language
Speak naturally - the AI understands variations:
- "I weigh about 180 pounds" ✅
- "my weight is around 175" ✅
- "weigh 170" ✅

### 2. Case Insensitive
Commands work regardless of case:
- "Weigh 175 Pounds" = "weigh 175 pounds" ✅

### 3. Units Optional
Most units are assumed if not specified:
- "weigh 175" assumes pounds (lbs)
- "water 16" assumes ounces (oz)
- But you can specify: "weigh 75 kg" or "drank 500 ml"

### 4. Confirmations Required
Destructive actions require confirmation:
- Delete operations
- Bulk delete/update
- Archive operations

### 5. Questions vs Commands
Questions start with how/what/when/why and retrieve data.
Commands/statements log data:
- "how much did I spend?" → Query (retrieves data)
- "spent $50 on groceries" → Command (logs data)

### 6. Voice or Text
All commands work with both typed and spoken input.

---

## How to Use

### Option 1: Type Commands
1. Open AI Assistant (🧠 Brain icon)
2. Type any command above
3. Press Send
4. AI saves it and confirms!

### Option 2: Voice Commands
1. Open AI Assistant (🧠 Brain icon)
2. Click Microphone button (🎤)
3. Speak any command above
4. AI transcribes, detects, saves, and confirms!

### Option 3: Ask Questions
1. Open AI Assistant
2. Ask any question about your data
3. AI analyzes and provides insights

---

## Summary

| Category | Count |
|----------|-------|
| Core AI Actions | 20 |
| Supported Domains | 21 |
| Voice Command Types | 100+ |
| AI-Powered Tools | 29 |
| Calculators | 50+ |
| Chart Types | 10 |
| Navigation Destinations | 25+ |
| Safe Calculations | 5 |

**Everything works through natural language - just tell the AI what you want to do!** 🚀

---

*Last updated: December 27, 2025*
*Source: lib/ai/command-catalog.ts, app/api/ai-assistant/*










