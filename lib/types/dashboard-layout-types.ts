/**
 * Dashboard Layout Types
 */

export type CardSize = 'small' | 'medium' | 'large'

export interface CardPosition {
  x: number
  y: number
  w: number // width in grid units
  h: number // height in grid units
}

export interface DashboardCard {
  id: string
  domain: string
  title: string
  position: CardPosition
  visible: boolean
  size: CardSize
  metrics?: string[] // Which metrics to display
  color?: string // Custom color
  icon?: string // Custom icon
}

export interface DashboardLayout {
  id?: string
  user_id?: string
  layout_name: string
  description?: string
  layout_config: {
    cards: DashboardCard[]
    columns: number // Grid columns (default: 12)
    rowHeight: number // Row height in pixels (default: 100)
  }
  is_active: boolean
  is_default: boolean
  created_at?: string
  updated_at?: string
}

// Default card configurations
export const DEFAULT_CARD_SIZES: Record<CardSize, { w: number; h: number }> = {
  small: { w: 3, h: 2 },   // 1x1 equivalent
  medium: { w: 6, h: 2 },  // 2x1 equivalent
  large: { w: 6, h: 4 },   // 2x2 equivalent
}

// Default domain cards
export const DEFAULT_DOMAIN_CARDS: Omit<DashboardCard, 'position'>[] = [
  { id: 'health', domain: 'health', title: 'Health', visible: true, size: 'medium', icon: '🏥', color: '#EF4444' },
  { id: 'insurance', domain: 'insurance', title: 'Insurance', visible: true, size: 'medium', icon: '🛡️', color: '#3B82F6' },
  { id: 'vehicles', domain: 'vehicles', title: 'Vehicles', visible: true, size: 'medium', icon: '🚗', color: '#10B981' },
  { id: 'home', domain: 'home', title: 'Home', visible: true, size: 'medium', icon: '🏠', color: '#F59E0B' },
  { id: 'financial', domain: 'financial', title: 'Finance', visible: true, size: 'large', icon: '💰', color: '#8B5CF6' },
  { id: 'pets', domain: 'pets', title: 'Pets', visible: true, size: 'small', icon: '🐾', color: '#EC4899' },
  { id: 'digital', domain: 'digital', title: 'Digital', visible: true, size: 'small', icon: '💻', color: '#6366F1' },
  { id: 'collectibles', domain: 'collectibles', title: 'Collectibles', visible: true, size: 'small', icon: '🎨', color: '#14B8A6' },
  { id: 'relationships', domain: 'relationships', title: 'Relationships', visible: true, size: 'medium', icon: '👥', color: '#F97316' },
  { id: 'career', domain: 'career', title: 'Career', visible: true, size: 'medium', icon: '💼', color: '#0EA5E9' },
]






























