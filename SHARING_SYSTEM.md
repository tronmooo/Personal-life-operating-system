# 🌐 Universal Data Sharing System

Complete documentation for LifeHub's Universal Data Sharing System - share any data from any domain through multiple channels.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Components](#components)
- [API Routes](#api-routes)
- [Usage Examples](#usage-examples)
- [Database Schema](#database-schema)
- [Security](#security)

---

## Overview

The Universal Data Sharing System allows users to share any data from the LifeHub app through multiple channels:
- 🔗 **Share Links** - Generate secure, shareable URLs
- 📄 **Exports** - Export in JSON, CSV, Excel, PDF, Markdown, HTML
- 📧 **Email** - Send data via email with attachments
- 📱 **QR Codes** - Generate QR codes for mobile sharing
- 🌍 **Social Media** - Share on Twitter, Facebook, LinkedIn, WhatsApp

---

## Features

### ✅ Core Features
- **Universal**: Works with ALL 13 domains (financial, health, vehicles, pets, etc.)
- **Multi-Format**: Export to 6+ formats (JSON, CSV, Excel, PDF, Markdown, HTML)
- **Access Control**: Public, password-protected, or email-restricted links
- **Expiration**: Set time-based or view-count expiration
- **Analytics**: Track views, downloads, and engagement
- **Beautiful UI**: Modern, responsive sharing interface
- **Mobile-Friendly**: QR codes and responsive design

### 🔒 Security Features
- Password protection with SHA-256 hashing
- Email verification for restricted content
- Automatic data sanitization (removes sensitive fields)
- Time-based expiration
- View count limits
- Watermarking for PDFs
- Row-level security (RLS) in database

---

## Quick Start

### 1. Add QuickShareButton to Any Component

```tsx
import { QuickShareButton } from '@/components/share/quick-share-button'

function MyComponent() {
  const myData = { id: '123', title: 'My Vehicle', ... }
  
  return (
    <QuickShareButton
      data={myData}
      domain="vehicles"
      size="md"
      variant="default"
    />
  )
}
```

### 2. Use the Full Modal

```tsx
import { useState } from 'react'
import { UniversalShareModal } from '@/components/share/universal-share-modal'

function MyComponent() {
  const [showShare, setShowShare] = useState(false)
  const entries = [/* your domain entries */]
  
  return (
    <>
      <Button onClick={() => setShowShare(true)}>
        Share Data
      </Button>
      
      <UniversalShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        domain="financial"
        entries={entries}
        defaultTab="link"
      />
    </>
  )
}
```

### 3. Use the Context API

```tsx
import { useShare } from '@/lib/contexts/share-context'

function MyComponent() {
  const { shareData, exportData, sendEmail } = useShare()
  
  const handleShare = async () => {
    const result = await shareData({
      domain: 'health',
      entry_ids: ['id1', 'id2'],
      title: 'My Health Records',
      access_type: 'public',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
    
    console.log('Share URL:', result.share_url)
  }
  
  return <Button onClick={handleShare}>Share</Button>
}
```

---

## Components

### QuickShareButton

Quick access to common sharing actions.

```tsx
<QuickShareButton
  data={item}              // Single item or array
  domain="vehicles"         // Domain type
  size="md"                 // 'sm' | 'md' | 'lg'
  variant="default"         // 'default' | 'outline' | 'ghost'
  position="top-right"      // Optional positioning
  quickActions={['link', 'download', 'email']}
/>
```

### UniversalShareModal

Full-featured sharing modal with tabs.

```tsx
<UniversalShareModal
  isOpen={true}
  onClose={() => {}}
  domain="financial"
  entries={[...]}
  defaultTab="link"         // 'link' | 'export' | 'email' | 'qr' | 'advanced'
/>
```

**Tabs:**
- **Link**: Generate shareable links with access control
- **Export**: Export in multiple formats
- **Email**: Send via email
- **QR**: Generate QR codes
- **Advanced**: Analytics and settings

---

## API Routes

### POST /api/share
Create a new shareable link.

**Request:**
```json
{
  "domain": "vehicles",
  "entry_ids": ["id1", "id2"],
  "title": "My Vehicles",
  "description": "Shared 2024-11-21",
  "access_type": "public",
  "password": "optional-password",
  "expires_at": "2024-12-01T00:00:00Z",
  "max_views": 10
}
```

**Response:**
```json
{
  "success": true,
  "link": { /* SharedLink object */ },
  "share_url": "https://lifehub.app/shared/abc123"
}
```

### POST /api/share/export
Export data in various formats.

**Request:**
```json
{
  "domain": "financial",
  "entry_ids": ["id1", "id2"],
  "format": "pdf",
  "options": {
    "include_metadata": true,
    "sanitize_data": true,
    "pdf": {
      "page_size": "A4",
      "orientation": "portrait",
      "watermark": "CONFIDENTIAL"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": "base64-encoded-file",
  "filename": "Financial-2024-11-21.pdf",
  "mime_type": "application/pdf"
}
```

### POST /api/share/email
Send share link via email.

**Request:**
```json
{
  "to": ["friend@example.com"],
  "subject": "Check out my data",
  "message": "Here's the data I wanted to share with you",
  "share_link_id": "link-id-here"
}
```

### POST /api/share/qr
Generate QR code for URL.

**Request:**
```json
{
  "url": "https://lifehub.app/shared/abc123",
  "size": 300,
  "format": "png"
}
```

**Response:**
```json
{
  "success": true,
  "qr_code": "data:image/png;base64,...",
  "format": "png"
}
```

### POST /api/share/view
Get shared content (public endpoint).

**Request:**
```json
{
  "token": "abc123",
  "password": "optional-if-protected",
  "viewer_email": "optional-if-email-only"
}
```

**Response:**
```json
{
  "success": true,
  "has_access": true,
  "link": { /* SharedLink object */ },
  "entries": [ /* Domain entries */ ],
  "domain_config": { /* Domain configuration */ }
}
```

---

## Usage Examples

### Example 1: Share Vehicle Maintenance Log

```tsx
import { useShare } from '@/lib/contexts/share-context'

function VehiclePage() {
  const { shareData } = useShare()
  const vehicles = useDomainCRUD('vehicles')
  
  const shareMaintenanceLog = async (vehicleId: string) => {
    const result = await shareData({
      domain: 'vehicles',
      entry_ids: [vehicleId],
      title: 'Vehicle Maintenance Log',
      access_type: 'password',
      password: 'mechanic2024',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    
    // Copy to clipboard
    await navigator.clipboard.writeText(result.share_url)
    toast('Share link copied!')
  }
  
  return (
    <Button onClick={() => shareMaintenanceLog(vehicleId)}>
      Share with Mechanic
    </Button>
  )
}
```

### Example 2: Export Financial Report

```tsx
import { useShare } from '@/lib/contexts/share-context'

function FinancialDashboard() {
  const { exportData } = useShare()
  const transactions = useDomainCRUD('financial')
  
  const exportAnnualReport = async () => {
    await exportData({
      domain: 'financial',
      entry_ids: transactions.items.map(t => t.id),
      format: 'pdf',
      options: {
        include_metadata: true,
        sanitize_data: true,
        pdf: {
          page_size: 'Letter',
          orientation: 'portrait',
          watermark: 'CONFIDENTIAL',
          header: 'Annual Financial Report 2024',
          footer: 'Generated by LifeHub'
        }
      }
    })
  }
  
  return <Button onClick={exportAnnualReport}>Export PDF</Button>
}
```

### Example 3: Email Health Records to Doctor

```tsx
import { useShare } from '@/lib/contexts/share-context'

function HealthRecords() {
  const { shareData, sendEmail } = useShare()
  const records = useDomainCRUD('health')
  
  const sendToDoctor = async () => {
    // Create share link
    const result = await shareData({
      domain: 'health',
      entry_ids: records.items.map(r => r.id),
      title: 'Medical Records',
      access_type: 'email-only',
      allowed_emails: ['doctor@clinic.com'],
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    })
    
    // Send email
    await sendEmail({
      to: 'doctor@clinic.com',
      subject: 'Medical Records for Appointment',
      message: 'Please review these records before our appointment.',
      share_link_id: result.link.id
    })
  }
  
  return <Button onClick={sendToDoctor}>Send to Doctor</Button>
}
```

### Example 4: Batch Export Multiple Domains

```tsx
import { useShare } from '@/lib/contexts/share-context'

function DataBackup() {
  const { exportData } = useShare()
  
  const exportFullBackup = async () => {
    const domains = ['financial', 'health', 'vehicles', 'pets']
    
    for (const domain of domains) {
      const { data: entries } = await supabase
        .from('domain_entries')
        .select('*')
        .eq('domain', domain)
      
      if (entries) {
        await exportData({
          domain: domain as any,
          entry_ids: entries.map(e => e.id),
          format: 'json'
        })
      }
    }
  }
  
  return <Button onClick={exportFullBackup}>Full Backup</Button>
}
```

---

## Database Schema

### shared_links
Stores shareable links with access control.

```sql
CREATE TABLE shared_links (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  domain text NOT NULL,
  entry_ids text[] NOT NULL,
  title text,
  description text,
  share_token text UNIQUE NOT NULL,
  access_type text NOT NULL,
  password_hash text,
  allowed_emails text[],
  expires_at timestamptz,
  max_views integer,
  view_count integer DEFAULT 0,
  allow_download boolean DEFAULT true,
  show_metadata boolean DEFAULT true,
  watermark text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_viewed_at timestamptz
);
```

### share_analytics
Tracks views and engagement.

```sql
CREATE TABLE share_analytics (
  id uuid PRIMARY KEY,
  shared_link_id uuid REFERENCES shared_links,
  viewer_email text,
  viewer_ip text,
  viewer_location jsonb,
  device_info jsonb,
  action text NOT NULL,
  action_details jsonb,
  viewed_at timestamptz DEFAULT now()
);
```

### share_templates
Pre-configured sharing templates.

```sql
CREATE TABLE share_templates (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  name text NOT NULL,
  description text,
  domain text NOT NULL,
  format text NOT NULL,
  filters jsonb,
  fields text[],
  template_style text,
  is_public boolean DEFAULT false,
  use_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## Security

### Access Control Levels

1. **Public** - Anyone with the link can access
2. **Password Protected** - Requires password (SHA-256 hashed)
3. **Email Only** - Only specific email addresses can access

### Data Sanitization

Automatically removes sensitive fields:
- `password`
- `ssn`
- `creditCard`
- `apiKey`
- `token`
- `secret`

Enable with `sanitize_data: true` in export options.

### Expiration

Two types:
- **Time-based**: Link expires after specified date
- **View-count**: Link expires after N views

### Row Level Security (RLS)

All tables have RLS policies:
- Users can only see their own shared links
- Public can view shared content with valid token
- Analytics only visible to link owners

---

## Best Practices

1. **Always use expiration** for sensitive data
2. **Use password protection** for confidential information
3. **Enable sanitization** when sharing externally
4. **Track analytics** to monitor access
5. **Revoke links** when no longer needed
6. **Use email-only** for professional sharing
7. **Add watermarks** to PDFs

---

## Coming Soon

- 🔄 Social media integration (Twitter, Facebook, LinkedIn)
- 📊 Advanced analytics dashboard
- 🎨 Custom share templates
- ⏰ Scheduled sharing
- 🤝 Collaborative sharing (multiple contributors)
- 📱 Native mobile apps with deep linking
- 🔔 Notification when link is viewed
- 💾 Batch export to ZIP

---

## Support

For issues or questions:
1. Check the [GitHub Issues](https://github.com/lifehub/issues)
2. Read the [FAQ](./FAQ.md)
3. Contact support@lifehub.app

---

**Built with ❤️ by the LifeHub Team**

