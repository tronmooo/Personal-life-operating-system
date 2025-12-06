# LifeHub - Personal Life Operating System

A sophisticated, comprehensive life management dashboard that serves as a centralized hub for tracking and managing all aspects of personal life through data-driven insights and AI guidance.

## 🌟 Features

### 7-Tab Navigation System
- **Dashboard**: Overview of all life domains with quick stats and recent activity
- **Domains**: 21+ comprehensive life domains for detailed tracking
- **Tools**: 57 calculators and tools across 7 categories (21 implemented - 37%)
- **Analytics**: Advanced data visualization with interactive charts
- **Insights**: AI-powered recommendations and smart analysis
- **Goals**: Track and achieve life goals with milestone tracking
- **Activity**: Real-time timeline of all your activities

### 21+ Life Domains
Comprehensive coverage across:
- **Core Life Areas**: Financial, Health, Career, Insurance
- **Assets & Property**: Home, Vehicles, Appliances, Collectibles
- **Personal & Relationships**: Pets, Relationships, Education, Travel
- **Planning & Organization**: Planning, Schedule, Legal Documents
- **Lifestyle & Wellness**: Utilities, Digital Life, Mindfulness, Outdoor, Nutrition

### 12 Specialized AI Advisors
- RoboAdvisor (Financial)
- Dr. Health AI (Medical)
- CareerGPT (Professional)
- NutriCoach AI (Nutrition)
- FitBot Pro (Fitness)
- HomeBot (Home Management)
- AutoTech AI (Vehicles)
- LifeGuru AI (Life Coaching)
- LegalBot (Legal)
- TravelGPT (Travel)
- TechGuru AI (Digital Life)
- InsureBot (Insurance)

### 57 Comprehensive Tools (25 Implemented - 44%)
Calculators across 7 categories:
- **Financial** (11/12 implemented): Compound Interest, Mortgage, Loan Amortization, Retirement, Budget Planner, Debt Payoff, Emergency Fund, Net Worth, Savings Goal, ROI, Tax Estimator
- **Health & Fitness** (7/10 implemented): BMI, Calorie, Macro, Body Fat %, Water Intake, Sleep Calculator, Heart Rate Zones
- **Home & Auto** (2/8 implemented): Home Affordability, Auto Loan Calculator
- **Career & Education** (0/6)
- **Travel & Lifestyle** (3/8 implemented): Tip, Currency, Time Zone Converter
- **Productivity** (1/7 implemented): Pomodoro Timer
- **Planning & Organization** (0/6)
- **Utilities** (1 implemented): Unit Converter

### Smart Features
- ⌘K Command Palette for quick navigation
- ⌘/ Digital Life Assistant for context-aware help
- 🔔 **Notification Center** - Smart reminders and alerts
- 📅 **Reminder System** - Recurring reminders with priority levels
- 🤖 **OCR Document Management** - AI-powered text extraction, auto-creates reminders
- 📁 **Universal Document Upload** - Documents tab in EVERY domain - upload passports, IDs, insurance, wills, etc.
- 📊 **3-Tab Domain Interface** - Items, Documents, Analytics in every domain
- 🏦 **Enhanced Domains** - 6 domains with 22 sub-categories
- 📈 **Real-Time Analytics** - Live data visualization from ALL your domains
- 🧠 **AI Insights Engine** - Intelligent analysis with financial scoring, health alerts, life balance tracking
- 🎯 **Goal Tracking** - Milestone-based goal achievement system
- 📋 **Activity Feed** - Real-time timeline across all life domains
- 💾 **Data Export** - Backup and export your data in JSON/CSV formats
- Universal data entry across all domains
- Dark/light mode support
- Responsive design for all devices
- Local storage persistence
- Browser notifications support

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lifehub
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.local.example .env.local
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI + Radix UI
- **State Management**: React Context
- **Icons**: Lucide React

### Backend (Coming Soon)
- **BaaS**: Supabase
- **Database**: PostgreSQL
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage
- **AI**: OpenAI GPT-4 / Anthropic Claude

## 📁 Project Structure

```
lifehub/
├── app/                    # Next.js app router pages
│   ├── domains/           # Domain pages and detail views
│   ├── tools/             # Tools and calculators
│   ├── analytics/         # Analytics dashboard
│   ├── ai-insights/       # AI advisors interface
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Homepage (Dashboard)
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── navigation/       # Navigation components
│   ├── dashboard/        # Dashboard components
│   └── ai/               # AI-related components
├── lib/                   # Utility functions and providers
│   └── providers/        # Context providers
├── types/                 # TypeScript type definitions
└── public/               # Static assets
```

## 🎯 Usage

### Adding Data
1. Navigate to any domain from the Dashboard or Domains page
2. Click "Add New" to create a new entry
3. Fill in the required fields
4. Data is automatically saved to local storage

### Using Command Palette
- Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux)
- Search for pages, domains, or tools
- Press Enter to navigate

### Digital Life Assistant
- Press `⌘/` (Mac) or `Ctrl+/` (Windows/Linux)
- Ask questions or request help
- Get context-aware assistance

## 🔮 Roadmap

### Phase 1: Foundation ✅
- [x] Project setup and configuration
- [x] Core layout and navigation
- [x] UI component library
- [x] Command Palette and Assistant
- [x] Dashboard implementation
- [x] Domain system (21 domains)

### Phase 2: Enhancement (COMPLETE ✅ - 100%)
- [x] Implement 12/57 tools (21% complete)
- [x] Notification and reminder system
- [x] Document upload system
- [x] Enhanced domain sub-categories (6 domains, 22 sub-categories)
- [ ] Advanced analytics and visualizations (Phase 3)
- [ ] AI advisor integration (Phase 3)
- [ ] Supabase backend setup (optional, Phase 3)
- [ ] User authentication (optional, Phase 3)
- [ ] Data synchronization (optional, Phase 3)

### Phase 3: Advanced Features
- [ ] External integrations (Plaid, Google Calendar, etc.)
- [ ] Collaboration and sharing
- [ ] Mobile app (PWA)
- [ ] Advanced AI insights
- [ ] Export/import functionality

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, open an issue in the GitHub repository or use the Digital Life Assistant (⌘/).

---

Built with ❤️ using Next.js and TypeScript


