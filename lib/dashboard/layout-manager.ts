/**
 * Dashboard Layout Manager
 * Handles creating, loading, saving, and managing dashboard layouts
 */

import { createClientComponentClient } from '@/lib/supabase/browser-client'
import { 
  DashboardLayout, 
  DashboardCard, 
  DEFAULT_DOMAIN_CARDS, 
  DEFAULT_CARD_SIZES 
} from '@/lib/types/dashboard-layout-types'

export class LayoutManager {
  private supabase = createClientComponentClient()

  /**
   * Generate default layout for a new user
   */
  generateDefaultLayout(): DashboardLayout {
    // Auto-position cards in a grid without gaps
    const cards: DashboardCard[] = []
    let currentX = 0
    let currentY = 0
    let rowHeight = 0

    DEFAULT_DOMAIN_CARDS.forEach((card) => {
      const size = DEFAULT_CARD_SIZES[card.size]

      // Check if card fits in current row
      if (currentX + size.w > 12) {
        // Move to next row
        currentX = 0
        currentY += rowHeight
        rowHeight = 0
      }

      cards.push({
        ...card,
        position: {
          x: currentX,
          y: currentY,
          w: size.w,
          h: size.h,
        },
      })

      currentX += size.w
      rowHeight = Math.max(rowHeight, size.h)
    })

    return {
      layout_name: 'Default',
      description: 'Default dashboard layout',
      layout_config: {
        cards,
        columns: 12,
        rowHeight: 100,
      },
      is_active: true,
      is_default: true,
    }
  }

  /**
   * Generate preset layouts
   */
  generatePresetLayouts(): Omit<DashboardLayout, 'id' | 'user_id' | 'created_at' | 'updated_at'>[] {
    return [
      // Full View - All cards
      {
        layout_name: 'Full View',
        description: 'See all your domains at once',
        layout_config: {
          cards: (() => {
            const cards: DashboardCard[] = []
            let currentX = 0
            let currentY = 0
            let rowHeight = 0

            DEFAULT_DOMAIN_CARDS.forEach((card) => {
              const size = DEFAULT_CARD_SIZES[card.size]
              if (currentX + size.w > 12) {
                currentX = 0
                currentY += rowHeight
                rowHeight = 0
              }
              cards.push({ ...card, position: { x: currentX, y: currentY, w: size.w, h: size.h } })
              currentX += size.w
              rowHeight = Math.max(rowHeight, size.h)
            })
            return cards
          })(),
          columns: 12,
          rowHeight: 100,
        },
        is_active: false,
        is_default: false,
      },

      // Minimal View - Top 6 domains
      {
        layout_name: 'Minimal',
        description: 'Focus on what matters most',
        layout_config: {
          cards: DEFAULT_DOMAIN_CARDS.slice(0, 6).map((card, index) => {
            const size = DEFAULT_CARD_SIZES['medium']
            const col = (index % 2) * 6
            const row = Math.floor(index / 2) * size.h
            return { 
              ...card, 
              size: 'medium',
              position: { x: col, y: row, w: size.w, h: size.h } 
            }
          }),
          columns: 12,
          rowHeight: 120,
        },
        is_active: false,
        is_default: false,
      },

      // Financial Focus
      {
        layout_name: 'Financial',
        description: 'Focus on money and assets',
        layout_config: {
          cards: [
            { ...DEFAULT_DOMAIN_CARDS.find(c => c.id === 'financial')!, size: 'large', position: { x: 0, y: 0, w: 6, h: 4 } },
            { ...DEFAULT_DOMAIN_CARDS.find(c => c.id === 'insurance')!, size: 'medium', position: { x: 6, y: 0, w: 6, h: 2 } },
            { ...DEFAULT_DOMAIN_CARDS.find(c => c.id === 'vehicles')!, size: 'medium', position: { x: 6, y: 2, w: 6, h: 2 } },
            { ...DEFAULT_DOMAIN_CARDS.find(c => c.id === 'home')!, size: 'medium', position: { x: 0, y: 4, w: 6, h: 2 } },
            { ...DEFAULT_DOMAIN_CARDS.find(c => c.id === 'collectibles')!, size: 'small', position: { x: 6, y: 4, w: 3, h: 2 } },
            { ...DEFAULT_DOMAIN_CARDS.find(c => c.id === 'career')!, size: 'small', position: { x: 9, y: 4, w: 3, h: 2 } },
          ],
          columns: 12,
          rowHeight: 100,
        },
        is_active: false,
        is_default: false,
      },

      // Health & Wellness
      {
        layout_name: 'Health & Wellness',
        description: 'Focus on health and fitness',
        layout_config: {
          cards: [
            { ...DEFAULT_DOMAIN_CARDS.find(c => c.id === 'health')!, size: 'large', position: { x: 0, y: 0, w: 6, h: 4 } },
            { ...DEFAULT_DOMAIN_CARDS.find(c => c.id === 'pets')!, size: 'medium', position: { x: 6, y: 0, w: 6, h: 2 } },
            { ...DEFAULT_DOMAIN_CARDS.find(c => c.id === 'relationships')!, size: 'medium', position: { x: 6, y: 2, w: 6, h: 2 } },
            { ...DEFAULT_DOMAIN_CARDS.find(c => c.id === 'insurance')!, size: 'medium', position: { x: 0, y: 4, w: 6, h: 2 } },
          ],
          columns: 12,
          rowHeight: 100,
        },
        is_active: false,
        is_default: false,
      },

      // Mobile - Compact view
      {
        layout_name: 'Mobile',
        description: 'Optimized for mobile devices',
        layout_config: {
          cards: DEFAULT_DOMAIN_CARDS.slice(0, 8).map((card, index) => ({
            ...card,
            size: 'medium',
            position: { x: 0, y: index * 2, w: 12, h: 2 },
          })),
          columns: 12,
          rowHeight: 80,
        },
        is_active: false,
        is_default: false,
      },
    ]
  }

  /**
   * Load active layout for user
   */
  async loadActiveLayout(userId: string): Promise<DashboardLayout | null> {
    try {
      const { data, error } = await this.supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (error) {
        console.warn('No active layout found, will create default')
        return null
      }

      return data as DashboardLayout
    } catch (error) {
      console.error('Error loading active layout:', error)
      return null
    }
  }

  /**
   * Load all layouts for user
   */
  async loadAllLayouts(userId: string): Promise<DashboardLayout[]> {
    try {
      const { data, error } = await this.supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as DashboardLayout[]
    } catch (error) {
      console.error('Error loading layouts:', error)
      return []
    }
  }

  /**
   * Save layout
   */
  async saveLayout(layout: DashboardLayout, userId: string): Promise<boolean> {
    try {
      const layoutData = {
        user_id: userId,
        layout_name: layout.layout_name,
        description: layout.description,
        layout_config: layout.layout_config,
        is_active: layout.is_active,
        is_default: layout.is_default,
      }

      if (layout.id) {
        // Update existing
        const { error } = await this.supabase
          .from('dashboard_layouts')
          .update(layoutData)
          .eq('id', layout.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await this.supabase
          .from('dashboard_layouts')
          .insert(layoutData)

        if (error) throw error
      }

      console.log('✅ Layout saved successfully')
      return true
    } catch (error) {
      console.error('❌ Error saving layout:', error)
      return false
    }
  }

  /**
   * Set active layout
   */
  async setActiveLayout(layoutId: string, userId: string): Promise<boolean> {
    try {
      // Update the selected layout to active (trigger will handle deactivating others)
      const { error } = await this.supabase
        .from('dashboard_layouts')
        .update({ is_active: true })
        .eq('id', layoutId)
        .eq('user_id', userId)

      if (error) throw error

      console.log('✅ Active layout changed')
      return true
    } catch (error) {
      console.error('❌ Error setting active layout:', error)
      return false
    }
  }

  /**
   * Delete layout
   */
  async deleteLayout(layoutId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('dashboard_layouts')
        .delete()
        .eq('id', layoutId)

      if (error) throw error

      console.log('✅ Layout deleted')
      return true
    } catch (error) {
      console.error('❌ Error deleting layout:', error)
      return false
    }
  }

  /**
   * Create default layout for new user
   */
  async createDefaultLayoutForUser(userId: string): Promise<boolean> {
    try {
      const defaultLayout = this.generateDefaultLayout()
      return await this.saveLayout(defaultLayout, userId)
    } catch (error) {
      console.error('Error creating default layout:', error)
      return false
    }
  }

  /**
   * Create preset layouts for user
   */
  async createPresetLayoutsForUser(userId: string): Promise<boolean> {
    try {
      const presets = this.generatePresetLayouts()
      
      for (const preset of presets) {
        await this.saveLayout(preset as DashboardLayout, userId)
      }

      console.log('✅ Preset layouts created')
      return true
    } catch (error) {
      console.error('Error creating preset layouts:', error)
      return false
    }
  }

  /**
   * Validate layout name (no duplicates for user)
   */
  async validateLayoutName(name: string, userId: string, excludeLayoutId?: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check for empty name
      if (!name || name.trim().length === 0) {
        return { valid: false, error: 'Layout name cannot be empty' }
      }

      // Check for length
      if (name.length > 100) {
        return { valid: false, error: 'Layout name must be less than 100 characters' }
      }

      // Check for duplicate names
      let query = this.supabase
        .from('dashboard_layouts')
        .select('id, layout_name')
        .eq('user_id', userId)
        .ilike('layout_name', name.trim())

      // Exclude current layout if renaming
      if (excludeLayoutId) {
        query = query.neq('id', excludeLayoutId)
      }

      const { data, error } = await query

      if (error) throw error

      if (data && data.length > 0) {
        return { valid: false, error: 'A layout with this name already exists' }
      }

      return { valid: true }
    } catch (error) {
      console.error('Error validating layout name:', error)
      return { valid: false, error: 'Failed to validate layout name' }
    }
  }

  /**
   * Create custom layout
   * @param name - Name for the new layout
   * @param description - Optional description
   * @param baseLayoutId - Optional layout ID to use as template
   * @param userId - User ID
   */
  async createCustomLayout(
    name: string, 
    description: string, 
    userId: string,
    baseLayoutId?: string
  ): Promise<{ success: boolean; layout?: DashboardLayout; error?: string }> {
    try {
      // Validate name
      const validation = await this.validateLayoutName(name, userId)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      let newLayout: DashboardLayout

      if (baseLayoutId) {
        // Create from existing layout
        const { data, error } = await this.supabase
          .from('dashboard_layouts')
          .select('*')
          .eq('id', baseLayoutId)
          .eq('user_id', userId)
          .single()

        if (error || !data) {
          return { success: false, error: 'Base layout not found' }
        }

        // Clone the layout
        newLayout = {
          layout_name: name,
          description: description || data.description,
          layout_config: { ...data.layout_config },
          is_active: false,
          is_default: false,
        }
      } else {
        // Create blank layout with default settings
        const defaultLayout = this.generateDefaultLayout()
        newLayout = {
          layout_name: name,
          description: description || 'Custom layout',
          layout_config: { ...defaultLayout.layout_config },
          is_active: false,
          is_default: false,
        }
      }

      // Save the new layout
      const { data, error } = await this.supabase
        .from('dashboard_layouts')
        .insert({
          user_id: userId,
          layout_name: newLayout.layout_name,
          description: newLayout.description,
          layout_config: newLayout.layout_config,
          is_active: newLayout.is_active,
          is_default: newLayout.is_default,
        })
        .select()
        .single()

      if (error) throw error

      console.log('✅ Custom layout created:', name)
      return { success: true, layout: data as DashboardLayout }
    } catch (error) {
      console.error('❌ Error creating custom layout:', error)
      return { success: false, error: 'Failed to create layout' }
    }
  }

  /**
   * Duplicate existing layout
   * @param layoutId - Layout to duplicate
   * @param newName - Name for the duplicated layout
   * @param userId - User ID
   */
  async duplicateLayout(
    layoutId: string, 
    newName: string, 
    userId: string
  ): Promise<{ success: boolean; layout?: DashboardLayout; error?: string }> {
    try {
      // Validate new name
      const validation = await this.validateLayoutName(newName, userId)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Load the source layout
      const { data: sourceLayout, error: loadError } = await this.supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('id', layoutId)
        .eq('user_id', userId)
        .single()

      if (loadError || !sourceLayout) {
        return { success: false, error: 'Source layout not found' }
      }

      // Create duplicate
      const { data: newLayout, error: createError } = await this.supabase
        .from('dashboard_layouts')
        .insert({
          user_id: userId,
          layout_name: newName,
          description: `Copy of ${sourceLayout.layout_name}`,
          layout_config: sourceLayout.layout_config,
          is_active: false,
          is_default: false,
        })
        .select()
        .single()

      if (createError) throw createError

      console.log('✅ Layout duplicated:', newName)
      return { success: true, layout: newLayout as DashboardLayout }
    } catch (error) {
      console.error('❌ Error duplicating layout:', error)
      return { success: false, error: 'Failed to duplicate layout' }
    }
  }

  /**
   * Rename layout
   * @param layoutId - Layout to rename
   * @param newName - New name for the layout
   * @param userId - User ID
   */
  async renameLayout(
    layoutId: string, 
    newName: string, 
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if layout exists and belongs to user
      const { data: layout, error: loadError } = await this.supabase
        .from('dashboard_layouts')
        .select('is_default')
        .eq('id', layoutId)
        .eq('user_id', userId)
        .single()

      if (loadError || !layout) {
        return { success: false, error: 'Layout not found' }
      }

      // Prevent renaming default layouts
      if (layout.is_default) {
        return { success: false, error: 'Cannot rename default layouts' }
      }

      // Validate new name
      const validation = await this.validateLayoutName(newName, userId, layoutId)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      // Update the name
      const { error: updateError } = await this.supabase
        .from('dashboard_layouts')
        .update({ layout_name: newName })
        .eq('id', layoutId)
        .eq('user_id', userId)

      if (updateError) throw updateError

      console.log('✅ Layout renamed:', newName)
      return { success: true }
    } catch (error) {
      console.error('❌ Error renaming layout:', error)
      return { success: false, error: 'Failed to rename layout' }
    }
  }

  /**
   * Delete custom layout (cannot delete default or active layouts)
   * @param layoutId - Layout to delete
   * @param userId - User ID
   */
  async deleteCustomLayout(
    layoutId: string, 
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if layout exists and get its properties
      const { data: layout, error: loadError } = await this.supabase
        .from('dashboard_layouts')
        .select('is_default, is_active, layout_name')
        .eq('id', layoutId)
        .eq('user_id', userId)
        .single()

      if (loadError || !layout) {
        return { success: false, error: 'Layout not found' }
      }

      // Prevent deleting default layouts
      if (layout.is_default) {
        return { success: false, error: 'Cannot delete default layouts' }
      }

      // Prevent deleting active layout
      if (layout.is_active) {
        return { success: false, error: 'Cannot delete the active layout. Switch to another layout first.' }
      }

      // Delete the layout
      const { error: deleteError } = await this.supabase
        .from('dashboard_layouts')
        .delete()
        .eq('id', layoutId)
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      console.log('✅ Layout deleted:', layout.layout_name)
      return { success: true }
    } catch (error) {
      console.error('❌ Error deleting layout:', error)
      return { success: false, error: 'Failed to delete layout' }
    }
  }

  /**
   * Generate layout thumbnail data (simple representation)
   * This creates a data structure that can be used to render a thumbnail
   */
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
  } {
    const visibleCards = layout.layout_config.cards.filter(c => c.visible)
    
    return {
      cards: visibleCards.map(card => ({
        id: card.id,
        x: card.position.x,
        y: card.position.y,
        w: card.position.w,
        h: card.position.h,
        color: card.color || '#6366f1',
        icon: card.icon || '📊',
      })),
      columns: layout.layout_config.columns,
      rowHeight: layout.layout_config.rowHeight,
    }
  }

  /**
   * Get layout by ID
   */
  async getLayoutById(layoutId: string, userId: string): Promise<DashboardLayout | null> {
    try {
      const { data, error } = await this.supabase
        .from('dashboard_layouts')
        .select('*')
        .eq('id', layoutId)
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error loading layout:', error)
        return null
      }

      return data as DashboardLayout
    } catch (error) {
      console.error('Error getting layout by ID:', error)
      return null
    }
  }

  /**
   * Update existing layout
   */
  async updateLayout(layoutId: string, layout: DashboardLayout, userId: string): Promise<boolean> {
    return await this.saveLayout({ ...layout, id: layoutId }, userId)
  }

  /**
   * Create new layout from existing layout object
   */
  async createLayout(layout: DashboardLayout, userId: string): Promise<DashboardLayout | null> {
    try {
      const layoutData = {
        user_id: userId,
        layout_name: layout.layout_name,
        description: layout.description,
        layout_config: layout.layout_config,
        is_active: false,
        is_default: false,
      }

      const { data, error } = await this.supabase
        .from('dashboard_layouts')
        .insert(layoutData)
        .select()
        .single()

      if (error) throw error

      console.log('✅ Layout created successfully')
      return data as DashboardLayout
    } catch (error) {
      console.error('❌ Error creating layout:', error)
      return null
    }
  }
}



