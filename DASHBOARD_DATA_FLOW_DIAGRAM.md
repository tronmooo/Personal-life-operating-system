# Dashboard Data Flow & Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     LifeHub Dashboard System                      │
└─────────────────────────────────────────────────────────────────┘

                              User Interface
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
         ┌──────────▼──────────┐   │     ┌─────────▼─────────┐
         │  CustomizableCommand│   │     │ CustomizableDash  │
         │     Center          │   │     │    board          │
         │ (Grid Layout)       │   │     │ (Widget-based)    │
         └──────────┬──────────┘   │     └─────────┬─────────┘
                    │              │               │
                    └──────────────┼───────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │    useData() Hook           │
                    │   (From DataProvider)       │
                    └──────────────┬──────────────┘
                                   │
         ┌─────────────────────────▼─────────────────────────┐
         │         DataProvider Context                       │
         │                                                     │
         │  ┌──────────────────────────────────────────────┐ │
         │  │ State:                                       │ │
         │  │  - data: Record<Domain, DomainData[]>      │ │
         │  │  - tasks, habits, bills, documents, events │ │
         │  │  - isLoading, isLoaded                      │ │
         │  └──────────────────────────────────────────────┘ │
         │                       │                            │
         │  ┌────────────────────┼────────────────────────┐  │
         │  │ CRUD Methods:      │                        │  │
         │  │ - addData()        │ - Custom Events        │  │
         │  │ - updateData()     │ - IDB Cache Write      │  │
         │  │ - deleteData()     │ - Supabase Mutation    │  │
         │  └────────────────────┼────────────────────────┘  │
         │                       │                            │
         └───────────────────────┼────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
   ┌────▼──────┐      ┌─────────▼────────┐      ┌───────▼──────┐
   │ IDB Cache │      │ Supabase Backend │      │ Custom Events│
   │           │      │                  │      │              │
   │ idbGet()  │      │ domain_entries   │      │ (Not listened│
   │ idbSet()  │      │ table            │      │  by cards)   │
   │ idbDelete │      │                  │      │              │
   └────┬──────┘      └────────┬─────────┘      └──────────────┘
        │                      │
        │    Data loaded       │
        └──────────┬───────────┘
                   │
         ┌─────────▼─────────────────────────────────┐
         │   Domain Cards Receive: data object        │
         │                                             │
         │  ┌──────────────┐  ┌──────────────┐       │
         │  │ Financial    │  │ Health       │  ...  │
         │  │ Card         │  │ Card         │       │
         │  │              │  │              │       │
         │  │ Calculates:  │  │ Calculates:  │       │
         │  │ - Net Worth  │  │ - BMI        │       │
         │  │ - Assets     │  │ - Health     │       │
         │  │ - Liabilities│  │   Score      │       │
         │  │ - Income     │  │ - Vitals     │       │
         │  │ - Expenses   │  │ - Goals      │       │
         │  └──────────────┘  └──────────────┘       │
         │                                             │
         └─────────────────────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │   Rendered Dashboard    │
          │                         │
          │ Cards + Metrics Display │
          └─────────────────────────┘
```

---

## Data Flow Sequence Diagram

### Initial Load

```
1. App Mount
   └─> CustomizableCommandCenter
       └─> useData() from DataProvider

2. DataProvider Initialization
   ├─> Get current user (Supabase Auth)
   ├─> Load from IDB cache (instant UI)
   ├─> Load from Supabase (background)
   └─> Set isLoaded = true

3. Dashboard Renders
   ├─> Get all domain data from context
   ├─> Pass to DomainCard component router
   └─> Cards calculate metrics from data
```

### CRUD Operation

```
User Action (Add/Update/Delete)
       │
       ▼
addData/updateData/deleteData() from DataProvider
       │
       ├─> Validate input
       │
       ├─> Create/Update/Delete in Supabase
       │   (via use-domain-entries hook)
       │
       ├─> Update IDB Cache
       │
       ├─> Update local state
       │
       ├─> Dispatch custom event
       │   'data-updated'
       │   '{domain}-data-updated'
       │
       └─> Component re-renders with new state
           (Cards automatically recalculate metrics)
```

---

## Card Data Calculation Examples

### Financial Card Data Flow

```
DataProvider.data.financial[] 
    │
    ├─ Item: { category: 'asset', amount: 100000 }
    ├─ Item: { category: 'asset', amount: 50000 }
    ├─ Item: { category: 'liability', amount: 20000 }
    │
    ▼
FinancialCard receives data prop
    │
    ├─ Filter assets: [100000, 50000] = $150,000
    ├─ Filter liabilities: [20000] = $20,000
    ├─ Calculate net worth: 150000 - 20000 = $130,000
    │
    ├─ Get monthly income: data.monthlyIncome || 8500 ← DEFAULT
    ├─ Get monthly expenses: data.monthlyExpenses || 5200 ← DEFAULT
    │
    ├─ Calculate savings rate: (8500-5200)/8500*100 = 38.8%
    ├─ Calculate health score: 40 + 38 + 20 = 98 (composite)
    │
    └─ Render metrics to UI
```

### Insurance Card Data Flow (DIFFERENT PATTERN)

```
InsuranceCard mounts
    │
    ├─ useEffect triggers
    │
    ├─> Get current user
    │
    ├─> Query Supabase directly:
    │   FROM documents
    │   WHERE user_id = ?
    │   AND domain_id = 'insurance'
    │   AND category = 'Insurance'
    │
    ├─> Count documents: 5
    ├─> Sum premiums: $450/month
    ├─> Group by type: { health: $150, auto: $200, home: $100 }
    │
    ├─> Set hardcoded values:
    │   totalCoverage = 2500000 ← HARDCODED
    │   upcomingRenewals = 0 ← HARDCODED
    │
    └─> Render metrics to UI

NOTE: Insurance card DOES NOT use DataProvider!
      This is inconsistent with other cards.
```

---

## Real-Time Synchronization Status

### What IS Real-Time

```
┌──────────────────────────────────────────┐
│      Auth State Changes                   │
│  (Login/Logout/Session Change)            │
│                                            │
│  SupabaseSyncProvider listens to:         │
│  - supabase.auth.onAuthStateChange()      │
│                                            │
│  Triggers: Data reload, user context      │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│     Custom Events (DataProvider)           │
│                                            │
│  Dispatches on mutation:                  │
│  - window.dispatchEvent('data-updated')   │
│  - window.dispatchEvent('{domain}-...')   │
│                                            │
│  BUT: Dashboard cards DON'T listen!       │
└──────────────────────────────────────────┘
```

### What is NOT Real-Time

```
┌──────────────────────────────────────────┐
│  ✗ Supabase Realtime Channels             │
│    No subscription to domain_entries      │
│                                            │
│  ✗ Polling / Interval Sync                │
│    No background refresh mechanism        │
│                                            │
│  ✗ Multi-session Sync                     │
│    Other users' changes not reflected     │
│                                            │
│  ✗ Cards listening to events              │
│    Custom events dispatched but ignored   │
│                                            │
│  ✗ Real-time insurance updates            │
│    Insurance card loads once on mount     │
└──────────────────────────────────────────┘
```

---

## Data Consistency Issues Map

```
┌─────────────────────────────────────────────────────┐
│              Data Source Inconsistency               │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Most Cards                   Insurance Card         │
│ ═════════════════════════════════════════════════   │
│ ✓ Use DataProvider    →  ✗ Direct Supabase query    │
│ ✓ Use IDB Cache       →  ✗ No local cache           │
│ ✓ Receive via props   →  ✗ Self-loads in useEffect  │
│ ✓ Automatic refresh   →  ✗ Only loads once          │
│                                                      │
├─────────────────────────────────────────────────────┤
│                 Hardcoded Values Problem             │
├─────────────────────────────────────────────────────┤
│                                                      │
│ Financial Card                                       │
│ └─ monthlyIncome: 8500 (if missing)                 │
│ └─ monthlyExpenses: 5200 (if missing)               │
│ └─ Monthly change: simulated %                      │
│                                                      │
│ Health Card                                          │
│ └─ heartRate: 72 (default vital)                    │
│ └─ weight: 165, height: 70                          │
│ └─ steps: 7500, calories: 1800                      │
│                                                      │
│ Vehicle Card                                         │
│ └─ Shows "2020 Toyota Camry" if no vehicles         │
│                                                      │
│ Insurance Card                                       │
│ └─ totalCoverage: always $2,500,000                 │
│ └─ upcomingRenewals: always 0                       │
│                                                      │
│ Relationships Card                                   │
│ └─ totalContacts: always 247                        │
│ └─ familyCount: 12, friendsCount: 45                │
│ └─ All hardcoded, no real data                      │
│                                                      │
│ Legal Card                                           │
│ └─ totalDocuments: 18 (default)                     │
│ └─ activeMatters: 2, upcomingDeadlines: 3           │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Layout Management Architecture

```
User Edit Mode Enabled
        │
        ▼
CustomizableCommandCenter
├─ isDraggable = true
├─ isResizable = true
│
├─ User drags card to new position
│  └─ handleLayoutChange() fired
│     └─ Updates card.position in state
│
├─ User toggles card visibility
│  └─ toggleCardVisibility()
│     └─ Updates card.visible in state
│
└─ User clicks "Save Layout"
   └─ saveLayout()
      ├─> LayoutManager.saveLayout()
      │   └─> Supabase: INSERT/UPDATE dashboard_layouts
      │
      ├─> Update currentLayout state
      ├─> setIsEditMode(false)
      └─> Render dashboard with new layout
```

### Layout Persistence

```
Dashboard Layouts Table (Supabase)
┌──────────────────────────────────┐
│ id (UUID)                         │
│ user_id (FK)                      │
│ layout_name: string               │
│ description: string               │
│ layout_config: JSON               │
│   {                               │
│     cards: [                      │
│       {                           │
│         id: string,               │
│         domain: string,           │
│         title: string,            │
│         size: 'small'|'medium'... │
│         visible: boolean,         │
│         position: {               │
│           x, y, w, h (grid units) │
│         }                         │
│       }                           │
│     ],                            │
│     columns: 12,                  │
│     rowHeight: 100                │
│   }                               │
│ is_active: boolean                │
│ is_default: boolean               │
│ created_at                        │
│ updated_at                        │
└──────────────────────────────────┘
```

---

## Recommended Data Flow Improvements

### Current State (Problematic)

```
CRUD Operation
    ↓
DataProvider (some cards use)  +  Direct Supabase (Insurance card)
    ↓                               ↓
IDB Cache                      No cache
    ↓                               ↓
State update                   Only on mount
    ↓
Custom events                  (Not listened)
    ↓
Cards re-render (via state)    Only if prop changed
```

### Ideal State (Recommended)

```
CRUD Operation
    ↓
Unified DataProvider (ALL cards use)
    ↓
┌─────────────────────┬─────────────────┐
│                     │                 │
Supabase Realtime  →  State Update  ←  IDB Cache
(Channel Subscribe)     (Context)      (Offline)
│                     │                 │
└─────────────────────┼─────────────────┘
    ↓                 ↓                 ↓
All cards listen to global context updates
    ↓
Cards automatically re-render with fresh data
```

