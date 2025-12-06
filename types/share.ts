import { Domain } from './domains'

// ============================================================================
// CORE TYPES
// ============================================================================

export type ShareAccessType = 'public' | 'password' | 'email-only'
export type ShareFormat = 'json' | 'csv' | 'excel' | 'pdf' | 'image' | 'markdown' | 'html' | 'zip'
export type ShareChannel = 'link' | 'email' | 'social' | 'qr' | 'download'
export type ShareAction = 'view' | 'download' | 'export' | 'copy'
export type ShareTemplateStyle = 'professional' | 'minimal' | 'detailed' | 'compact'

// ============================================================================
// DATABASE MODELS
// ============================================================================

export interface SharedLink {
  id: string
  user_id: string
  
  // What's being shared
  domain: Domain
  entry_ids: string[]
  title?: string
  description?: string
  
  // Access Control
  share_token: string
  access_type: ShareAccessType
  password_hash?: string
  allowed_emails?: string[]
  
  // Expiration & Limits
  expires_at?: string
  max_views?: number
  view_count: number
  
  // Settings
  allow_download: boolean
  show_metadata: boolean
  watermark?: string
  
  // Metadata
  metadata: Record<string, any>
  
  // Timestamps
  created_at: string
  updated_at: string
  last_viewed_at?: string
}

export interface ShareAnalytics {
  id: string
  shared_link_id: string
  
  // Viewer Info
  viewer_email?: string
  viewer_ip?: string
  viewer_location?: {
    country?: string
    city?: string
    region?: string
    timezone?: string
  }
  device_info?: {
    browser?: string
    os?: string
    device_type?: 'desktop' | 'mobile' | 'tablet'
    screen_resolution?: string
  }
  
  // Activity
  action: ShareAction
  action_details?: Record<string, any>
  
  // Timestamp
  viewed_at: string
}

export interface ShareTemplate {
  id: string
  user_id: string
  
  // Template Info
  name: string
  description?: string
  domain: Domain
  
  // Template Config
  format: ShareFormat
  filters?: Record<string, any>
  fields?: string[]
  template_style: ShareTemplateStyle
  
  // Settings
  is_public: boolean
  use_count: number
  
  // Timestamps
  created_at: string
  updated_at: string
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateShareLinkRequest {
  domain: Domain
  entry_ids: string[]
  title?: string
  description?: string
  access_type?: ShareAccessType
  password?: string
  allowed_emails?: string[]
  expires_at?: string
  max_views?: number
  allow_download?: boolean
  show_metadata?: boolean
  watermark?: string
  metadata?: Record<string, any>
}

export interface CreateShareLinkResponse {
  success: boolean
  link: SharedLink
  share_url: string
  qr_code?: string
}

export interface GetSharedContentRequest {
  token: string
  password?: string
  viewer_email?: string
}

export interface GetSharedContentResponse {
  success: boolean
  link: SharedLink
  entries: any[]
  domain_config: any
  has_access: boolean
  requires_password?: boolean
  requires_email?: boolean
}

export interface ExportDataRequest {
  domain: Domain
  entry_ids: string[]
  format: ShareFormat
  template?: string
  options?: ExportOptions
}

export interface ExportDataResponse {
  success: boolean
  data?: string // Base64 or direct content
  filename: string
  mime_type: string
  download_url?: string
}

export interface SendEmailRequest {
  to: string | string[]
  subject: string
  message?: string
  share_link_id?: string
  attachments?: EmailAttachment[]
}

export interface SendEmailResponse {
  success: boolean
  message: string
  email_id?: string
}

export interface GenerateQRRequest {
  url: string
  size?: number
  format?: 'png' | 'svg'
  logo?: string
}

export interface GenerateQRResponse {
  success: boolean
  qr_code: string // Base64 or SVG string
  format: 'png' | 'svg'
}

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export interface ExportOptions {
  // General
  include_metadata?: boolean
  include_timestamps?: boolean
  sanitize_data?: boolean
  
  // PDF Options
  pdf?: {
    page_size?: 'A4' | 'Letter' | 'Legal'
    orientation?: 'portrait' | 'landscape'
    header?: string
    footer?: string
    watermark?: string
    include_charts?: boolean
  }
  
  // CSV/Excel Options
  csv?: {
    delimiter?: ',' | ';' | '\t'
    include_headers?: boolean
    quote_strings?: boolean
  }
  
  excel?: {
    sheet_name?: string
    auto_filter?: boolean
    freeze_header?: boolean
    column_widths?: Record<string, number>
    formatting?: boolean
  }
  
  // Image Options
  image?: {
    width?: number
    height?: number
    format?: 'png' | 'jpeg' | 'webp'
    quality?: number
    background_color?: string
  }
}

// ============================================================================
// UI COMPONENT TYPES
// ============================================================================

export interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  domain: Domain
  entries: any[]
  defaultTab?: ShareTab
}

export type ShareTab = 'link' | 'export' | 'email' | 'social' | 'qr' | 'advanced'

export interface QuickShareButtonProps {
  data: any | any[]
  domain: Domain
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  quickActions?: ShareChannel[]
}

export interface ShareLinkGeneratorProps {
  domain: Domain
  entries: any[]
  onLinkGenerated: (link: SharedLink, url: string) => void
}

export interface ExportFormatSelectorProps {
  domain: Domain
  entries: any[]
  onExport: (format: ShareFormat, options: ExportOptions) => void
}

export interface EmailComposerProps {
  domain: Domain
  entries: any[]
  shareLink?: SharedLink
  onSend: (request: SendEmailRequest) => void
}

export interface SocialShareButtonsProps {
  url: string
  title: string
  description?: string
  platforms?: ('twitter' | 'facebook' | 'linkedin' | 'whatsapp' | 'telegram')[]
}

export interface QRCodeDisplayProps {
  url: string
  size?: number
  downloadable?: boolean
  logo?: string
}

// ============================================================================
// SHARE CONTEXT TYPES
// ============================================================================

export interface ShareContextValue {
  // State
  activeShares: SharedLink[]
  recentShares: SharedLink[]
  templates: ShareTemplate[]
  loading: boolean
  
  // Methods
  shareData: (request: CreateShareLinkRequest) => Promise<CreateShareLinkResponse>
  exportData: (request: ExportDataRequest) => Promise<ExportDataResponse>
  sendEmail: (request: SendEmailRequest) => Promise<SendEmailResponse>
  generateQR: (url: string, options?: Omit<GenerateQRRequest, 'url'>) => Promise<GenerateQRResponse>
  
  // Link Management
  getSharedLinks: () => Promise<SharedLink[]>
  updateSharedLink: (id: string, updates: Partial<SharedLink>) => Promise<void>
  deleteSharedLink: (id: string) => Promise<void>
  
  // Analytics
  getShareAnalytics: (linkId: string) => Promise<ShareAnalytics[]>
  trackShareAction: (linkId: string, action: ShareAction, details?: any) => Promise<void>
  
  // Templates
  getTemplates: (domain?: Domain) => Promise<ShareTemplate[]>
  saveTemplate: (template: Omit<ShareTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<ShareTemplate>
  deleteTemplate: (id: string) => Promise<void>
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface EmailAttachment {
  filename: string
  content: string // Base64
  mime_type: string
}

export interface SharePreview {
  title: string
  description: string
  image_url?: string
  domain: Domain
  entry_count: number
  created_at: string
  expires_at?: string
}

export interface SocialMetaTags {
  og_title: string
  og_description: string
  og_image: string
  og_url: string
  twitter_card: 'summary' | 'summary_large_image'
  twitter_title: string
  twitter_description: string
  twitter_image: string
}

export interface ShareStats {
  total_shares: number
  total_views: number
  shares_by_domain: Record<Domain, number>
  views_by_domain: Record<Domain, number>
  most_shared_entries: Array<{
    domain: Domain
    entry_id: string
    title: string
    share_count: number
  }>
  recent_activity: ShareAnalytics[]
}

// ============================================================================
// EXPORT RESULT TYPES
// ============================================================================

export interface ExportResult {
  success: boolean
  format: ShareFormat
  filename: string
  data: string | Blob
  size_bytes: number
  created_at: string
}

export interface BatchExportResult {
  success: boolean
  exports: ExportResult[]
  zip_file?: {
    filename: string
    data: Blob
    size_bytes: number
  }
}

// ============================================================================
// AI SEND TYPES
// ============================================================================

export interface AISendRequest {
  action: 'send'
  recipient_name?: string
  recipient_type?: string
  document_type?: string
  domain?: Domain
  entry_ids?: string[]
  date_range?: {
    start: string
    end: string
  }
  format?: 'pdf' | 'csv' | 'json' | 'summary'
  send_method?: 'email' | 'sms' | 'both'
  custom_message?: string
  include_charts?: boolean
  generate_summary?: boolean
}

export interface AISendResponse {
  success: boolean
  message: string
  details?: {
    recipient: string
    method: 'email' | 'sms'
    content: string
    documents_sent: number
    send_result: any
  }
  error?: string
  suggestion?: 'add_contact' | 'update_contact' | 'specify_content'
  contact?: {
    id: string
    name: string
    email?: string
    phone?: string
  }
}

export interface Contact {
  id: string
  name: string
  email?: string
  phone?: string
  relationship?: string
  source: 'relationships' | 'contacts'
}

export interface ShareTarget {
  contact?: Contact
  email?: string
  phone?: string
  method: 'email' | 'sms' | 'both'
}

export interface DocumentToShare {
  id: string
  name: string
  type: 'document' | 'data_export' | 'chart' | 'summary' | 'generated_pdf'
  file_url?: string
  file_data?: string
  mime_type?: string
  domain?: Domain
  metadata?: Record<string, any>
}

// SMS Types
export interface SendSMSRequest {
  to: string | string[]
  message: string
  include_link?: boolean
  share_link_id?: string
  document_urls?: string[]
}

export interface SendSMSResponse {
  success: boolean
  message: string
  sms_ids?: string[]
  failed?: string[]
}

