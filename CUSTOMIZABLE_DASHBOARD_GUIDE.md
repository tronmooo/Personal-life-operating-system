# 🎨 Customizable Dashboard - Complete Guide

## ✅ What's Implemented

### 1. Drag-and-Drop Dashboard
- ✅ Full react-grid-layout integration
- ✅ Drag cards to reorder
- ✅ Resize cards by dragging corners
- ✅ Responsive grid system (12 columns)
- ✅ Smooth animations

### 2. Card Sizes
- ✅ **Small (3x2)**: Basic info cards
- ✅ **Medium (6x2)**: Standard cards with details
- ✅ **Large (6x4)**: Full cards with charts & extensive details

### 3. Hide/Show Domains
- ✅ Toggle visibility for any card
- ✅ Hide unused domains (Pets, Digital, etc.)
- ✅ Visual indicators (eye icons)
- ✅ Instant apply

### 4. Preset Layouts
- ✅ **Default**: All domains visible
- ✅ **Minimal**: Top 6 domains only
- ✅ **Financial**: Focus on money & assets
- ✅ **Health & Wellness**: Health-focused view
- ✅ **Mobile**: Optimized for mobile devices

### 5. Layout Management
- ✅ Save custom layouts
- ✅ Quick switch between layouts
- ✅ Multiple layouts per user
- ✅ One active layout at a time
- ✅ Persistent storage in Supabase

### 6. Edit Mode
- ✅ Toggle edit mode on/off
- ✅ Visual feedback (purple border, instructions)
- ✅ Save/Cancel/Reset options
- ✅ Real-time preview

---

## 🚀 How to Use

### Accessing the Customizable Dashboard

**Option 1: Floating Button**
- Look for the **purple "Customize Dashboard"** button at bottom-right
- Click to switch to customizable view
- Click again to return to standard view

**Option 2: Always On**
- Dashboard switcher is on the home page
- Toggle between views anytime

---

### Entering Edit Mode

1. **Click "Customize Dashboard"** button (top-right)
2. **Purple banner appears** with instructions
3. **All cards become editable**
4. **Start customizing!**

---

### Customization Options

#### 1. Drag Cards to Reorder
```
┌─────────┐     ┌─────────┐
│ Health  │ →   │ Finance │  (Drag to swap)
└─────────┘     └─────────┘
```

**How:**
- Click and hold on card header
- Drag to new position
- Release to drop
- Other cards auto-adjust

#### 2. Resize Cards
```
┌─────────┐     ┌──────────────┐
│ Health  │ →   │ Health       │  (Drag corner to resize)
└─────────┘     └──────────────┘
```

**How:**
- Hover over card corner
- See resize handle appear
- Drag to resize
- Snap to grid

#### 3. Hide/Show Cards
```
✅ Health     (Visible)
✅ Insurance  (Visible)
❌ Pets       (Hidden - click to show)
❌ Digital    (Hidden - click to show)
```

**How:**
- Look at top of edit banner
- See all domain cards
- Green = Visible, Gray = Hidden
- Click eye icon to toggle

#### 4. Switch Layouts
```
Current: Default Layout
┌────────────────┐
│ Change Layout  │ ← Click this
└────────────────┘

Choose from:
• Default
• Minimal
• Financial
• Health & Wellness
• Mobile
```

**How:**
- Click "Change Layout" button
- See all available layouts
- Click one to activate
- Dashboard updates instantly

---

## 📋 Preset Layouts Explained

### 1. Default
**Best for:** First-time users, seeing everything
- All 10 domains visible
- Mixed card sizes
- Auto-positioned grid

### 2. Minimal
**Best for:** Quick overview, mobile users
- Only 6 most important domains
- All medium-sized cards
- Clean, focused view

### 3. Financial
**Best for:** Tracking money, assets, investments
**Includes:**
- Large Finance card (prominent)
- Insurance, Vehicles, Home
- Collectibles, Career

### 4. Health & Wellness
**Best for:** Health tracking, fitness goals
**Includes:**
- Large Health card (prominent)
- Pets, Relationships
- Insurance (health-related)

### 5. Mobile
**Best for:** Phone/tablet users
- Vertical stack layout
- Full-width cards
- Easy scrolling

---

## 💾 Saving Your Layout

### Save Process

1. **Make Changes** (drag, resize, hide/show)
2. **Click "Save Layout"** (top-right)
3. **Layout saved to database**
4. **Edit mode exits automatically**
5. **Changes persist forever!**

### What Gets Saved

✅ Card positions (x, y coordinates)
✅ Card sizes (width, height)
✅ Visibility (hidden/shown)
✅ Grid settings (columns, row height)
✅ Layout name & description

---

## 🔄 Switching Layouts

### Quick Switch

```
1. Click "Change Layout" button
2. Modal appears with layout cards
3. Click desired layout
4. Instant switch (no page reload)
5. Modal closes automatically
```

### Active Layout

- ✅ Blue border = Currently active
- Only ONE layout can be active
- Active layout loads on page refresh
- Other layouts stored for quick switching

---

## 🛠️ Advanced Features

### Create New Custom Layout

1. Start with any preset
2. Enter edit mode
3. Customize as desired
4. **Future feature:** Save as new layout with custom name

### Reset to Default

- Click "Reset" button in edit mode
- Confirms with dialog
- Reverts to default positions
- Doesn't save unless you click "Save Layout"

### Delete Layout

**Future feature:** Delete custom layouts you no longer need
- Cannot delete default layouts
- Active layout cannot be deleted

---

## 📊 Layout Structure (Technical)

### Database Schema

```sql
dashboard_layouts:
  id: UUID
  user_id: UUID
  layout_name: VARCHAR(100)
  description: TEXT
  layout_config: JSONB
    {
      cards: [
        {
          id: "health",
          domain: "health",
          title: "Health",
          position: { x: 0, y: 0, w: 6, h: 2 },
          visible: true,
          size: "medium"
        },
        ...
      ],
      columns: 12,
      rowHeight: 100
    }
  is_active: BOOLEAN
  is_default: BOOLEAN
```

### Card Position Explained

```
position: { x: 0, y: 0, w: 6, h: 2 }

x = Column position (0-11)
y = Row position (0-∞)
w = Width in grid units (1-12)
h = Height in grid units (1-∞)
```

### Grid System

```
12 Columns Total
┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
│0 │1 │2 │3 │4 │5 │6 │7 │8 │9 │10│11│
└──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘

Small card:  w=3  (25% width)
Medium card: w=6  (50% width)
Large card:  w=6-12 (50-100% width)
```

---

## 🎨 Customization Examples

### Example 1: Financial Focus Dashboard

```
┌──────────────────────────┐
│   Finance (Large 6x4)    │  ← Main focus
│   Charts, Net Worth      │
├──────────────┬───────────┤
│  Insurance   │ Vehicles  │  ← Related domains
│  (Medium)    │ (Medium)  │
├──────────────┴───────────┤
│  Home        │ Career    │
│  (Medium)    │ (Small)   │
└──────────────┴───────────┘
```

### Example 2: Minimal Dashboard

```
┌──────────────┬───────────┐
│  Health      │ Insurance │
├──────────────┼───────────┤
│  Finance     │ Vehicles  │
├──────────────┼───────────┤
│  Home        │ Career    │
└──────────────┴───────────┘

(Only showing top 6 - rest hidden)
```

### Example 3: Mobile Layout

```
┌──────────────────────────┐
│  Health (Full Width)     │
├──────────────────────────┤
│  Insurance               │
├──────────────────────────┤
│  Finance                 │
├──────────────────────────┤
│  Vehicles                │
└──────────────────────────┘

(Vertical stack, easy scrolling)
```

---

## 🎯 Pro Tips

### 1. Start with a Preset
Don't start from scratch! Pick the closest preset and modify it.

### 2. Hide What You Don't Use
No pets? Hide that card. Cleaner dashboard = better focus.

### 3. Size by Importance
Make your most important domains **Large**
Use **Small** for less-used domains

### 4. Group Related Domains
```
Financial Corner:
┌─────────┬─────────┐
│ Finance │ Career  │
├─────────┼─────────┤
│Insurance│Vehicles │
└─────────┴─────────┘
```

### 5. Use Minimal for Quick Checks
Switch to "Minimal" when you just need a quick overview.

### 6. Mobile Layout for Phone
If you use LifeHub on your phone, switch to "Mobile" layout.

---

## 🐛 Troubleshooting

### Cards Not Dragging
✅ Make sure you're in **Edit Mode**
✅ Click "Customize Dashboard" first
✅ Look for purple banner

### Changes Not Saving
✅ Click "Save Layout" button
✅ Wait for success message
✅ Check your internet connection

### Layout Looks Wrong After Switch
✅ Try refreshing page
✅ Revert to "Default" layout
✅ Re-customize from there

### Can't Resize Card
✅ Make sure in Edit Mode
✅ Drag from **corner** not center
✅ Some cards have minimum sizes

### Hidden Card Won't Show
✅ Check visibility toggles at top
✅ Card with eye-slash icon = hidden
✅ Click to toggle visibility

---

## 🔮 Future Enhancements (Optional)

### Coming Soon
- [ ] Save multiple custom layouts with names
- [ ] Share layouts with other users
- [ ] Import/export layouts as JSON
- [ ] Card color customization
- [ ] Custom card titles
- [ ] Metric selection (choose which data to show)
- [ ] Section grouping ("My Week", "Financial", etc.)
- [ ] Keyboard shortcuts for quick actions
- [ ] Undo/Redo in edit mode
- [ ] Layout templates marketplace

---

## 📱 Responsive Behavior

### Desktop (>1200px)
- Full 12-column grid
- All sizes work perfectly
- Drag & drop smooth

### Tablet (768-1200px)
- 6-10 columns
- Cards auto-adjust
- Still draggable

### Mobile (<768px)
- 4-6 columns
- Cards stack vertically
- Use "Mobile" preset for best experience

---

## 🎬 Quick Start Guide

### First Time User

1. **Visit homepage** - See standard dashboard
2. **Click purple button** (bottom-right) - "Customize Dashboard"
3. **Explore layouts** - Click "Change Layout", try different presets
4. **Pick favorite** - Select the one you like most
5. **Customize it** - Click "Customize Dashboard" (top-right)
6. **Make changes** - Drag, resize, hide cards
7. **Save** - Click "Save Layout"
8. **Done!** - Your dashboard is personalized

---

## 📂 Files Reference

**Components:**
- `components/dashboard/customizable-command-center.tsx` - Main component
- `components/dashboard/dashboard-switcher.tsx` - View toggle
- `lib/dashboard/layout-manager.ts` - Layout logic
- `lib/types/dashboard-layout-types.ts` - TypeScript types

**API:**
- `app/api/layouts/route.ts` - CRUD operations

**Database:**
- `supabase/migrations/20250117_dashboard_layouts.sql` - Schema

**Library:**
- `react-grid-layout` - Drag & drop
- `react-resizable` - Resize functionality

---

## ✅ Testing Checklist

- [ ] Dashboard loads with default layout
- [ ] Can switch to customizable view
- [ ] Edit mode toggle works
- [ ] Can drag cards
- [ ] Can resize cards
- [ ] Hide/show cards works
- [ ] Save layout persists changes
- [ ] Layout selector shows all layouts
- [ ] Can switch between layouts
- [ ] Changes persist after refresh
- [ ] Reset button works
- [ ] Cancel exits without saving
- [ ] Mobile responsive

---

## 🎉 You're Ready!

Your dashboard is now fully customizable! Create layouts that work for **your** workflow.

**Remember:**
- 🎨 Customize anytime
- 💾 Save your changes
- 🔄 Switch layouts easily
- 📱 Responsive on all devices

**Enjoy your personalized LifeHub experience!** 🚀






























