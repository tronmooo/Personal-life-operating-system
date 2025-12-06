# 🔗 Share Button Integration Guide

This guide shows exactly where to add share buttons to your existing LifeHub UI.

## 🎯 Quick Start (3 Steps)

### Step 1: Import the Component

Add this to the top of any page where you want sharing:

```tsx
import { QuickShareButton } from '@/components/share/quick-share-button'
```

### Step 2: Add the Button

Use one of these patterns based on your needs:

---

## 📍 Integration Points

### **1. Domain Detail Page Header** ⭐ RECOMMENDED

**File:** `app/domains/[domainId]/page.tsx`  
**Location:** Around line 300-400 in the header section

**What it does:** Lets users share ALL items from this domain

```tsx
// Find this section (the header with BackButton and title):
<div className="flex items-center justify-between mb-6">
  <BackButton />
  <div className="flex-1 text-center">
    <h1 className="text-3xl font-bold">{domain.name}</h1>
    <p className="text-muted-foreground">{domain.description}</p>
  </div>
  
  {/* ✨ ADD THIS BUTTON */}
  <div className="flex gap-2">
    {entries.length > 0 && (
      <QuickShareButton
        data={entries}
        domain={domainId}
        size="md"
        variant="default"
      />
    )}
    
    <Button onClick={() => setIsAddDialogOpen(true)}>
      <Plus className="h-4 w-4 mr-2" />
      Add {domain.name}
    </Button>
  </div>
</div>
```

---

### **2. Individual Item Cards**

**File:** `app/domains/[domainId]/page.tsx`  
**Location:** In the items list rendering section (around line 450-550)

**What it does:** Lets users share one specific item

```tsx
// Find where you map over entries:
{entries.map((item) => (
  <Card key={item.id} className="hover:shadow-lg transition-shadow">
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>{item.title}</CardTitle>
          <CardDescription>{item.description}</CardDescription>
        </div>
        
        {/* ✨ ADD THIS BUTTON */}
        <div className="flex gap-2">
          <QuickShareButton
            data={item}
            domain={domainId}
            size="sm"
            variant="ghost"
            quickActions={['link', 'download']}
          />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardHeader>
    {/* ... rest of card content ... */}
  </Card>
))}
```

---

### **3. Domains Overview Page**

**File:** `app/domains/page.tsx`  
**Location:** In the domain cards section (around line 1100-1200)

**What it does:** Lets users share all data from a domain from the overview

```tsx
// Find the domain cards section:
{filteredDomains.map((domainKey) => {
  const domainEntries = data[domainKey] || []
  const itemCount = domainEntries.length
  const kpis = getDomainKPIs(domainKey, data)
  
  return (
    <Card key={domainKey} className="hover:shadow-xl transition-all">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{DOMAIN_CONFIGS[domainKey]?.name}</CardTitle>
          
          {/* ✨ ADD THIS BUTTON */}
          {itemCount > 0 && (
            <QuickShareButton
              data={domainEntries}
              domain={domainKey as Domain}
              size="sm"
              variant="outline"
            />
          )}
        </div>
        <CardDescription>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </CardDescription>
      </CardHeader>
      
      {/* ... KPIs and other content ... */}
      
      <CardFooter>
        <div className="flex gap-2 w-full">
          <Link href={`/domains/${domainKey}`} className="flex-1">
            <Button className="w-full">View Details</Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
})}
```

---

### **4. Dashboard Cards** (Optional)

**Files:** `components/dashboard/domain-cards/*.tsx`

**What it does:** Add quick share to dashboard widgets

```tsx
// Example: In any dashboard card component
import { QuickShareButton } from '@/components/share/quick-share-button'

<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Recent Vehicles</CardTitle>
      
      {/* ✨ ADD THIS */}
      {vehicles.length > 0 && (
        <QuickShareButton
          data={vehicles}
          domain="vehicles"
          size="sm"
          variant="ghost"
          position="top-right"
        />
      )}
    </div>
  </CardHeader>
  {/* ... card content ... */}
</Card>
```

---

## 🎨 Button Customization

### Size Options
```tsx
<QuickShareButton size="sm" />   // Small - for cards
<QuickShareButton size="md" />   // Medium - default
<QuickShareButton size="lg" />   // Large - for headers
```

### Variant Options
```tsx
<QuickShareButton variant="default" />  // Solid color
<QuickShareButton variant="outline" />  // Outlined
<QuickShareButton variant="ghost" />    // Transparent
```

### Quick Actions (what appears in dropdown)
```tsx
<QuickShareButton
  quickActions={['link', 'download', 'email', 'qr']}
/>
```

Options:
- `'link'` - Copy shareable link
- `'download'` - Quick export as JSON
- `'email'` - Send via email
- `'qr'` - Generate QR code
- `'social'` - Social media (coming soon)

---

## 📱 Full Modal Version

For advanced sharing options, use the full modal:

```tsx
import { useState } from 'react'
import { UniversalShareModal } from '@/components/share/universal-share-modal'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'

function MyComponent({ entries, domain }) {
  const [showShareModal, setShowShareModal] = useState(false)
  
  return (
    <>
      <Button onClick={() => setShowShareModal(true)}>
        <Share2 className="h-4 w-4 mr-2" />
        Share All
      </Button>
      
      <UniversalShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        domain={domain}
        entries={entries}
        defaultTab="link"
      />
    </>
  )
}
```

---

## ✅ Complete Example - Domain Detail Page

Here's a complete example showing all integration points:

```tsx
'use client'

import { useState } from 'react'
import { QuickShareButton } from '@/components/share/quick-share-button'
import { UniversalShareModal } from '@/components/share/universal-share-modal'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Edit, Trash2, Share2 } from 'lucide-react'

export default function DomainDetailPage({ params }) {
  const { entries, domainId } = useDomainData(params.domainId)
  const [showShareModal, setShowShareModal] = useState(false)
  
  return (
    <div className="container mx-auto p-6">
      {/* Header with Share All button */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Domain</h1>
        
        <div className="flex gap-2">
          {/* Quick Share for all items */}
          {entries.length > 0 && (
            <QuickShareButton
              data={entries}
              domain={domainId}
              size="md"
            />
          )}
          
          {/* OR Full modal for advanced options */}
          <Button onClick={() => setShowShareModal(true)}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Options
          </Button>
          
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>
      
      {/* Items list with individual share buttons */}
      <div className="grid gap-4">
        {entries.map((item) => (
          <Card key={item.id}>
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
              
              <div className="flex gap-2">
                {/* Share individual item */}
                <QuickShareButton
                  data={item}
                  domain={domainId}
                  size="sm"
                  variant="ghost"
                />
                
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Full share modal */}
      <UniversalShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        domain={domainId}
        entries={entries}
      />
    </div>
  )
}
```

---

## 🎯 What Users Will See

When they click the share button, users get:

1. **Quick Actions Dropdown:**
   - Copy shareable link
   - Quick export (JSON)
   - Send via email
   - Generate QR code
   - "All Options..." (opens full modal)

2. **Full Modal (5 tabs):**
   - **Link**: Generate secure links with password protection
   - **Export**: Choose format (JSON, CSV, Excel, PDF, Markdown, HTML)
   - **Email**: Compose and send email
   - **QR**: Generate QR code for mobile
   - **Advanced**: View analytics and settings

---

## 🚀 Quick Test

After adding the buttons:

1. Navigate to any domain (e.g., `/domains/vehicles`)
2. Click the **Share** button
3. Choose "Copy Share Link"
4. Open in incognito window
5. Verify your data displays!

---

## 💡 Pro Tips

1. **Start with QuickShareButton** - It's the easiest
2. **Add to headers first** - Most visible location
3. **Test with one item** - Verify it works before adding everywhere
4. **Use appropriate sizes** - `sm` for cards, `md` for headers
5. **Enable password protection** - For sensitive data

---

## 🆘 Need Help?

- Check `SHARING_SYSTEM.md` for full documentation
- Review `types/share.ts` for all prop types
- Test in development before deploying
- Start simple, add features as needed

---

**Ready to share!** 🎉

