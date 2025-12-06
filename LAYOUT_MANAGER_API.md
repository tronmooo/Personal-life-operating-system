# Layout Manager API Reference

Complete API documentation for the Enhanced Layout Manager system.

---

## Table of Contents
1. [LayoutManager Class](#layoutmanager-class)
2. [Method Reference](#method-reference)
3. [Type Definitions](#type-definitions)
4. [Component APIs](#component-apis)
5. [Event System](#event-system)
6. [Error Handling](#error-handling)

---

## LayoutManager Class

Location: `lib/dashboard/layout-manager.ts`

### Constructor

```typescript
const layoutManager = new LayoutManager()
```

No parameters required. Automatically initializes Supabase client.

---

## Method Reference

### Core Methods

#### `generateDefaultLayout()`

Generates a default layout structure for new users.

```typescript
generateDefaultLayout(): DashboardLayout
```

**Returns:**
- `DashboardLayout` - Complete layout with default cards

**Example:**
```typescript
const defaultLayout = layoutManager.generateDefaultLayout()
console.log(defaultLayout.layout_name) // "Default"
console.log(defaultLayout.layout_config.cards.length) // 14 (all domain cards)
```

---

#### `generatePresetLayouts()`

Generates preset layout templates.

```typescript
generatePresetLayouts(): Omit<DashboardLayout, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]
```

**Returns:**
- Array of preset layouts (Full View, Minimal, Financial, Health & Wellness, Mobile)

**Example:**
```typescript
const presets = layoutManager.generatePresetLayouts()
presets.forEach(preset => {
  console.log(preset.layout_name, preset.description)
})
```

---

#### `loadActiveLayout()`

Loads the currently active layout for a user.

```typescript
async loadActiveLayout(userId: string): Promise<DashboardLayout | null>
```

**Parameters:**
- `userId` (string) - User ID to load layout for

**Returns:**
- `DashboardLayout` - Active layout
- `null` - If no active layout found

**Example:**
```typescript
const { data: { user } } = await supabase.auth.getUser()
const activeLayout = await layoutManager.loadActiveLayout(user.id)

if (activeLayout) {
  console.log('Active:', activeLayout.layout_name)
}
```

---

#### `loadAllLayouts()`

Loads all layouts for a user.

```typescript
async loadAllLayouts(userId: string): Promise<DashboardLayout[]>
```

**Parameters:**
- `userId` (string) - User ID

**Returns:**
- Array of `DashboardLayout` objects (sorted by created_at desc)

**Example:**
```typescript
const layouts = await layoutManager.loadAllLayouts(user.id)
console.log(`Found ${layouts.length} layouts`)
```

---

#### `getLayoutById()`

Retrieves a specific layout by ID.

```typescript
async getLayoutById(layoutId: string, userId: string): Promise<DashboardLayout | null>
```

**Parameters:**
- `layoutId` (string) - Layout ID to retrieve
- `userId` (string) - User ID (for ownership verification)

**Returns:**
- `DashboardLayout` - Found layout
- `null` - If not found or no access

**Example:**
```typescript
const layout = await layoutManager.getLayoutById('abc-123', user.id)
if (layout) {
  console.log('Found:', layout.layout_name)
}
```

---

#### `saveLayout()`

Saves a layout (create or update).

```typescript
async saveLayout(layout: DashboardLayout, userId: string): Promise<boolean>
```

**Parameters:**
- `layout` (DashboardLayout) - Layout to save
- `userId` (string) - User ID

**Returns:**
- `true` - Success
- `false` - Failure

**Example:**
```typescript
const layout = {
  layout_name: 'My Layout',
  description: 'Custom layout',
  layout_config: { cards: [...], columns: 12, rowHeight: 100 },
  is_active: false,
  is_default: false
}

const success = await layoutManager.saveLayout(layout, user.id)
if (success) {
  console.log('Layout saved!')
}
```

---

#### `setActiveLayout()`

Sets a layout as active (deactivates others automatically).

```typescript
async setActiveLayout(layoutId: string, userId: string): Promise<boolean>
```

**Parameters:**
- `layoutId` (string) - Layout ID to activate
- `userId` (string) - User ID

**Returns:**
- `true` - Success
- `false` - Failure

**Example:**
```typescript
const success = await layoutManager.setActiveLayout('abc-123', user.id)
if (success) {
  // Dispatch event to update UI
  window.dispatchEvent(new CustomEvent('dashboard-layout-changed', { 
    detail: { layoutId: 'abc-123' } 
  }))
}
```

---

#### `deleteLayout()`

Deletes any layout (basic method).

```typescript
async deleteLayout(layoutId: string): Promise<boolean>
```

**Parameters:**
- `layoutId` (string) - Layout ID to delete

**Returns:**
- `true` - Success
- `false` - Failure

**Note:** Use `deleteCustomLayout()` for safer deletion with validation.

---

#### `createDefaultLayoutForUser()`

Creates the default layout for a new user.

```typescript
async createDefaultLayoutForUser(userId: string): Promise<boolean>
```

**Parameters:**
- `userId` (string) - User ID

**Returns:**
- `true` - Success
- `false` - Failure

**Example:**
```typescript
// On user signup
const { data: { user } } = await supabase.auth.getUser()
await layoutManager.createDefaultLayoutForUser(user.id)
```

---

#### `createPresetLayoutsForUser()`

Creates all preset layouts for a user.

```typescript
async createPresetLayoutsForUser(userId: string): Promise<boolean>
```

**Parameters:**
- `userId` (string) - User ID

**Returns:**
- `true` - Success
- `false` - Failure

**Example:**
```typescript
// On user signup
await layoutManager.createPresetLayoutsForUser(user.id)
```

---

### Enhanced Methods (Phase 2)

#### `validateLayoutName()`

Validates a layout name for uniqueness and format.

```typescript
async validateLayoutName(
  name: string, 
  userId: string, 
  excludeLayoutId?: string
): Promise<{ valid: boolean; error?: string }>
```

**Parameters:**
- `name` (string) - Name to validate
- `userId` (string) - User ID
- `excludeLayoutId` (string, optional) - Layout ID to exclude (for rename)

**Returns:**
- `{ valid: true }` - Valid name
- `{ valid: false, error: string }` - Invalid with reason

**Validation Rules:**
- ❌ Empty name
- ❌ Length > 100 characters
- ❌ Duplicate name (case-insensitive)
- ✅ Unique, non-empty, reasonable length

**Example:**
```typescript
const result = await layoutManager.validateLayoutName('My Layout', user.id)

if (result.valid) {
  console.log('Name is valid!')
} else {
  console.error('Error:', result.error)
  // "A layout with this name already exists"
}
```

---

#### `createCustomLayout()`

Creates a new custom layout.

```typescript
async createCustomLayout(
  name: string, 
  description: string, 
  userId: string,
  baseLayoutId?: string
): Promise<{ 
  success: boolean
  layout?: DashboardLayout
  error?: string 
}>
```

**Parameters:**
- `name` (string) - Layout name (required)
- `description` (string) - Layout description (can be empty)
- `userId` (string) - User ID
- `baseLayoutId` (string, optional) - Layout ID to clone from

**Returns:**
```typescript
// Success
{ success: true, layout: DashboardLayout }

// Failure
{ success: false, error: "Error message" }
```

**Example:**
```typescript
// Create from scratch
const result = await layoutManager.createCustomLayout(
  'My Custom Layout',
  'For work tasks',
  user.id
)

// Create from template
const result = await layoutManager.createCustomLayout(
  'My Financial View',
  'Based on Financial preset',
  user.id,
  'financial-layout-id'  // Clone this layout
)

if (result.success) {
  console.log('Created:', result.layout?.id)
} else {
  alert(result.error)
}
```

**Possible Errors:**
- "Layout name cannot be empty"
- "Layout name must be less than 100 characters"
- "A layout with this name already exists"
- "Base layout not found"
- "Failed to create layout"

---

#### `duplicateLayout()`

Duplicates an existing layout.

```typescript
async duplicateLayout(
  layoutId: string, 
  newName: string, 
  userId: string
): Promise<{ 
  success: boolean
  layout?: DashboardLayout
  error?: string 
}>
```

**Parameters:**
- `layoutId` (string) - Source layout ID
- `newName` (string) - Name for the duplicate
- `userId` (string) - User ID

**Returns:**
```typescript
// Success
{ success: true, layout: DashboardLayout }

// Failure
{ success: false, error: "Error message" }
```

**Example:**
```typescript
const result = await layoutManager.duplicateLayout(
  'source-layout-id',
  'My Copy',
  user.id
)

if (result.success) {
  console.log('Duplicated as:', result.layout?.layout_name)
  // Description will be: "Copy of [Original Name]"
}
```

**Possible Errors:**
- "Layout name cannot be empty"
- "A layout with this name already exists"
- "Source layout not found"
- "Failed to duplicate layout"

---

#### `renameLayout()`

Renames an existing layout.

```typescript
async renameLayout(
  layoutId: string, 
  newName: string, 
  userId: string
): Promise<{ 
  success: boolean
  error?: string 
}>
```

**Parameters:**
- `layoutId` (string) - Layout ID to rename
- `newName` (string) - New name
- `userId` (string) - User ID

**Returns:**
```typescript
// Success
{ success: true }

// Failure
{ success: false, error: "Error message" }
```

**Example:**
```typescript
const result = await layoutManager.renameLayout(
  'layout-id',
  'Updated Name',
  user.id
)

if (result.success) {
  console.log('Renamed successfully!')
}
```

**Possible Errors:**
- "Layout not found"
- "Cannot rename default layouts"
- "Layout name cannot be empty"
- "A layout with this name already exists"
- "Failed to rename layout"

**Protection:**
- ❌ Cannot rename default layouts (`is_default: true`)
- ✅ Can rename custom layouts
- ✅ Can rename active layout

---

#### `deleteCustomLayout()`

Safely deletes a custom layout with validation.

```typescript
async deleteCustomLayout(
  layoutId: string, 
  userId: string
): Promise<{ 
  success: boolean
  error?: string 
}>
```

**Parameters:**
- `layoutId` (string) - Layout ID to delete
- `userId` (string) - User ID

**Returns:**
```typescript
// Success
{ success: true }

// Failure
{ success: false, error: "Error message" }
```

**Example:**
```typescript
const result = await layoutManager.deleteCustomLayout('layout-id', user.id)

if (result.success) {
  console.log('Layout deleted')
} else {
  alert(result.error)
  // "Cannot delete the active layout. Switch to another layout first."
}
```

**Possible Errors:**
- "Layout not found"
- "Cannot delete default layouts"
- "Cannot delete the active layout. Switch to another layout first."
- "Failed to delete layout"

**Protection:**
- ❌ Cannot delete default layouts
- ❌ Cannot delete active layout
- ✅ Must switch to another layout before deleting active
- ✅ User ownership verified

---

#### `generateLayoutThumbnail()`

Generates thumbnail data for preview rendering.

```typescript
generateLayoutThumbnail(layout: DashboardLayout): {
  cards: Array<{
    id: string
    x: number
    y: number
    w: number
    h: number
    color: string
    icon: string
  }>
  columns: number
  rowHeight: number
}
```

**Parameters:**
- `layout` (DashboardLayout) - Layout to generate thumbnail for

**Returns:**
- Thumbnail data structure with card positions and colors

**Example:**
```typescript
const thumbnail = layoutManager.generateLayoutThumbnail(layout)

console.log('Columns:', thumbnail.columns)  // 12
console.log('Cards:', thumbnail.cards.length)  // 10 visible cards

thumbnail.cards.forEach(card => {
  console.log(`${card.icon} at (${card.x}, ${card.y}) size ${card.w}x${card.h}`)
})
```

**Use Case:**
- Preview modal rendering
- Thumbnail generation
- Layout visualization
- Grid planning

---

## Type Definitions

### DashboardLayout

```typescript
interface DashboardLayout {
  id?: string
  user_id?: string
  layout_name: string
  description?: string | null
  layout_config: {
    cards: DashboardCard[]
    columns: number
    rowHeight: number
  }
  is_active: boolean
  is_default: boolean
  created_at?: string
  updated_at?: string
}
```

### DashboardCard

```typescript
interface DashboardCard {
  id: string
  title: string
  icon: string
  domain: string
  size: 'small' | 'medium' | 'large'
  color: string
  visible: boolean
  position: {
    x: number
    y: number
    w: number
    h: number
  }
}
```

### CardSize

```typescript
type CardSize = 'small' | 'medium' | 'large'

const DEFAULT_CARD_SIZES = {
  small: { w: 3, h: 2 },   // 3 columns, 2 rows
  medium: { w: 6, h: 2 },  // 6 columns, 2 rows
  large: { w: 6, h: 4 }    // 6 columns, 4 rows
}
```

---

## Component APIs

### LayoutTemplateSelector

Location: `components/settings/layout-template-selector.tsx`

#### Props

```typescript
interface LayoutTemplateSelectorProps {
  onLayoutChange?: () => void
}
```

**Props:**
- `onLayoutChange` (optional) - Callback when layout changes

#### Usage

```typescript
<LayoutTemplateSelector onLayoutChange={() => {
  console.log('Layout changed!')
}} />
```

---

### LayoutTemplateCard

Location: `components/settings/layout-template-card.tsx`

#### Props

```typescript
interface LayoutTemplateCardProps {
  layout: DashboardLayout
  isActive: boolean
  isPreviewed: boolean
  onClick: () => void
  onPreview: () => void
  onDuplicate?: (layoutId: string) => void
  onRename?: (layoutId: string) => void
  onDelete?: (layoutId: string) => void
}
```

#### Usage

```typescript
<LayoutTemplateCard
  layout={layout}
  isActive={layout.id === activeId}
  isPreviewed={layout.id === previewId}
  onClick={() => handleClick(layout.id)}
  onPreview={() => handlePreview(layout.id)}
  onDuplicate={handleDuplicate}
  onRename={handleRename}
  onDelete={handleDelete}
/>
```

---

### LayoutPreviewModal

Location: `components/settings/layout-preview-modal.tsx`

#### Props

```typescript
interface LayoutPreviewModalProps {
  open: boolean
  onClose: () => void
  layout: DashboardLayout | null
  onApply?: (layoutId: string) => void
  onEdit?: (layoutId: string) => void
}
```

#### Usage

```typescript
<LayoutPreviewModal
  open={!!previewLayout}
  onClose={() => setPreviewLayout(null)}
  layout={previewLayout}
  onApply={(layoutId) => {
    setActiveLayout(layoutId)
  }}
  onEdit={(layoutId) => {
    router.push(`/command-center?edit=${layoutId}`)
  }}
/>
```

---

## Event System

### Custom Events

#### `dashboard-layout-changed`

Fired when the active layout changes.

```typescript
// Dispatch
window.dispatchEvent(new CustomEvent('dashboard-layout-changed', { 
  detail: { layoutId: 'abc-123' } 
}))

// Listen
window.addEventListener('dashboard-layout-changed', (e: CustomEvent) => {
  console.log('New layout:', e.detail.layoutId)
  // Reload dashboard, update UI, etc.
})
```

#### `dashboard-view-mode-changed`

Fired when switching between standard/customizable views.

```typescript
// Dispatch
window.dispatchEvent(new CustomEvent('dashboard-view-mode-changed', { 
  detail: { mode: 'customizable' } 
}))

// Listen
window.addEventListener('dashboard-view-mode-changed', (e: CustomEvent) => {
  console.log('View mode:', e.detail.mode)
  // 'standard' or 'customizable'
})
```

---

## Error Handling

### Common Patterns

#### Try-Catch with User Feedback

```typescript
try {
  const result = await layoutManager.createCustomLayout(name, desc, userId)
  
  if (result.success) {
    toast.success('Layout created!')
  } else {
    toast.error(result.error)
  }
} catch (error) {
  console.error('Unexpected error:', error)
  toast.error('An unexpected error occurred')
}
```

#### Validation Before Action

```typescript
// Check if layout can be deleted
const layout = layouts.find(l => l.id === layoutId)

if (!layout) {
  alert('Layout not found')
  return
}

if (layout.is_default) {
  alert('Cannot delete default layouts')
  return
}

if (layout.is_active) {
  alert('Cannot delete active layout. Switch to another first.')
  return
}

// Proceed with deletion
const result = await layoutManager.deleteCustomLayout(layoutId, userId)
```

#### Confirmation Dialogs

```typescript
const confirmed = window.confirm(
  `Are you sure you want to delete "${layout.layout_name}"?`
)

if (!confirmed) return

const result = await layoutManager.deleteCustomLayout(layoutId, userId)
```

---

## Best Practices

### 1. Always Validate User

```typescript
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  alert('Please sign in')
  return
}

// Proceed with operations
```

### 2. Check Success Status

```typescript
const result = await layoutManager.createCustomLayout(...)

if (result.success) {
  // Handle success
  loadLayouts()
} else {
  // Show error
  setError(result.error)
}
```

### 3. Reload After Mutations

```typescript
await layoutManager.saveLayout(layout, userId)
await loadLayouts()  // Refresh UI
```

### 4. Use TypeScript Types

```typescript
// Good
const layout: DashboardLayout = { ... }

// Avoid
const layout: any = { ... }
```

### 5. Handle Async Properly

```typescript
// Good
const result = await layoutManager.createCustomLayout(...)

// Avoid (unhandled promise)
layoutManager.createCustomLayout(...)
```

---

## Quick Reference

### Create Layout
```typescript
layoutManager.createCustomLayout(name, desc, userId, baseId?)
```

### Duplicate Layout
```typescript
layoutManager.duplicateLayout(layoutId, newName, userId)
```

### Rename Layout
```typescript
layoutManager.renameLayout(layoutId, newName, userId)
```

### Delete Layout
```typescript
layoutManager.deleteCustomLayout(layoutId, userId)
```

### Get Layouts
```typescript
layoutManager.loadAllLayouts(userId)
layoutManager.loadActiveLayout(userId)
layoutManager.getLayoutById(layoutId, userId)
```

### Set Active
```typescript
layoutManager.setActiveLayout(layoutId, userId)
```

### Validate Name
```typescript
layoutManager.validateLayoutName(name, userId, excludeId?)
```

### Generate Thumbnail
```typescript
layoutManager.generateLayoutThumbnail(layout)
```

---

## Support

For issues or questions:
1. Check this API reference
2. Review PHASE_2_COMPLETE.md
3. Check implementation examples
4. Test with small examples first

---

## Changelog

### Phase 2 (Current)
- ✅ Added `validateLayoutName()`
- ✅ Added `createCustomLayout()`
- ✅ Added `duplicateLayout()`
- ✅ Added `renameLayout()`
- ✅ Added `deleteCustomLayout()`
- ✅ Added `generateLayoutThumbnail()`
- ✅ Added `getLayoutById()`

### Phase 1
- ✅ Core layout management
- ✅ Default/preset generation
- ✅ Load/save operations
- ✅ Active layout management

---

**Last Updated:** Phase 2 Complete
**Version:** 2.0
**Status:** Production Ready ✅




























