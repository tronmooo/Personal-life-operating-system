/**
 * Layout Import/Export Functionality
 * Handles importing, exporting, and sharing dashboard layouts
 */

import { DashboardLayout, DashboardCard, DEFAULT_CARD_SIZES } from '@/lib/types/dashboard-layout-types'
import { LayoutManager } from './layout-manager'

export class LayoutIO {
  private layoutManager = new LayoutManager()

  /**
   * Export a layout to JSON
   */
  async exportLayout(layoutId: string, userId: string): Promise<string> {
    const layouts = await this.layoutManager.loadAllLayouts(userId)
    const layout = layouts.find(l => l.id === layoutId)

    if (!layout) {
      throw new Error('Layout not found')
    }

    // Clean up the layout for export (remove user-specific data)
    const exportData = {
      version: '1.0.0',
      layout_name: layout.layout_name,
      description: layout.description,
      layout_config: layout.layout_config,
      exported_at: new Date().toISOString(),
      metadata: {
        card_count: layout.layout_config.cards.length,
        visible_cards: layout.layout_config.cards.filter(c => c.visible).length,
      }
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Download layout as JSON file
   */
  downloadLayout(layoutData: string, layoutName: string) {
    const blob = new Blob([layoutData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${layoutName.toLowerCase().replace(/\s+/g, '-')}-layout.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * Import layout from JSON file
   */
  async importLayout(file: File): Promise<DashboardLayout> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const layoutData = JSON.parse(content)

          // Validate the layout
          const validatedLayout = this.validateLayout(layoutData)
          
          if (!validatedLayout.valid) {
            reject(new Error(validatedLayout.error || 'Invalid layout'))
            return
          }

          // Create a new layout object
          const importedLayout: Omit<DashboardLayout, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
            layout_name: layoutData.layout_name + ' (Imported)',
            description: layoutData.description || 'Imported layout',
            layout_config: layoutData.layout_config,
            is_active: false,
            is_default: false,
          }

          resolve(importedLayout as DashboardLayout)
        } catch (error) {
          reject(new Error('Failed to parse layout file: ' + (error as Error).message))
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  /**
   * Validate imported layout data
   */
  validateLayout(layoutData: any): { valid: boolean; error?: string } {
    // Check version
    if (!layoutData.version) {
      return { valid: false, error: 'Missing version field' }
    }

    // Check required fields
    if (!layoutData.layout_name) {
      return { valid: false, error: 'Missing layout_name field' }
    }

    if (!layoutData.layout_config) {
      return { valid: false, error: 'Missing layout_config field' }
    }

    if (!Array.isArray(layoutData.layout_config.cards)) {
      return { valid: false, error: 'Invalid cards array' }
    }

    // Validate each card
    for (const card of layoutData.layout_config.cards) {
      if (!card.id || !card.domain || !card.title) {
        return { valid: false, error: 'Invalid card structure' }
      }

      if (!card.position || typeof card.position.x !== 'number' || typeof card.position.y !== 'number') {
        return { valid: false, error: 'Invalid card position' }
      }

      if (!['small', 'medium', 'large'].includes(card.size)) {
        return { valid: false, error: 'Invalid card size: ' + card.size }
      }
    }

    // Check for duplicate card IDs
    const cardIds = layoutData.layout_config.cards.map((c: any) => c.id)
    if (new Set(cardIds).size !== cardIds.length) {
      return { valid: false, error: 'Duplicate card IDs detected' }
    }

    return { valid: true }
  }

  /**
   * Share layout via shareable URL/code
   */
  async shareLayout(layoutId: string, userId: string): Promise<string> {
    const layoutData = await this.exportLayout(layoutId, userId)
    
    // Compress and encode the layout data
    const compressed = btoa(encodeURIComponent(layoutData))
    
    // Create a shareable code (first 12 chars for readability)
    const shareCode = compressed.substring(0, 12).toUpperCase()
    
    // In a real app, you'd save this to a database with the full layout
    // For now, we'll return the full encoded string
    return compressed
  }

  /**
   * Import layout from share code
   */
  async importFromShareCode(shareCode: string): Promise<DashboardLayout> {
    try {
      // Decode the share code
      const decoded = decodeURIComponent(atob(shareCode))
      const layoutData = JSON.parse(decoded)

      // Validate
      const validation = this.validateLayout(layoutData)
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid layout')
      }

      // Create layout object
      const importedLayout: Omit<DashboardLayout, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
        layout_name: layoutData.layout_name + ' (Shared)',
        description: layoutData.description || 'Shared layout',
        layout_config: layoutData.layout_config,
        is_active: false,
        is_default: false,
      }

      return importedLayout as DashboardLayout
    } catch (error) {
      throw new Error('Invalid share code: ' + (error as Error).message)
    }
  }

  /**
   * Generate layout preview image (returns data URL)
   */
  generateLayoutPreview(layout: DashboardLayout): string {
    // Create a simple SVG preview
    const cards = layout.layout_config.cards.filter(c => c.visible)
    const maxX = Math.max(...cards.map(c => c.position.x + c.position.w))
    const maxY = Math.max(...cards.map(c => c.position.y + c.position.h))
    
    const width = 400
    const height = (maxY / maxX) * width
    
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${maxX} ${maxY}">
        <rect width="${maxX}" height="${maxY}" fill="#f3f4f6"/>
        ${cards.map(card => `
          <rect 
            x="${card.position.x}" 
            y="${card.position.y}" 
            width="${card.position.w}" 
            height="${card.position.h}" 
            fill="${this.getCardColor(card.domain)}"
            stroke="#e5e7eb"
            stroke-width="0.1"
            rx="0.3"
          />
          <text 
            x="${card.position.x + card.position.w / 2}" 
            y="${card.position.y + card.position.h / 2}" 
            text-anchor="middle" 
            dominant-baseline="middle"
            font-size="0.8"
            font-family="Arial"
            fill="white"
          >
            ${card.icon || ''}
          </text>
        `).join('')}
      </svg>
    `
    
    return 'data:image/svg+xml;base64,' + btoa(svg)
  }

  /**
   * Get color for domain (for preview)
   */
  private getCardColor(domain: string): string {
    const colors: Record<string, string> = {
      financial: '#3b82f6',
      health: '#10b981',
      housing: '#f59e0b',
      career: '#8b5cf6',
      education: '#ec4899',
      relationships: '#ef4444',
      legal: '#6366f1',
      transportation: '#14b8a6',
      lifestyle: '#f97316',
      insurance: '#06b6d4',
    }
    return colors[domain] || '#6b7280'
  }

  /**
   * Copy layout to clipboard
   */
  async copyLayoutToClipboard(layoutData: string) {
    try {
      await navigator.clipboard.writeText(layoutData)
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }

  /**
   * Paste layout from clipboard
   */
  async pasteLayoutFromClipboard(): Promise<DashboardLayout> {
    try {
      const text = await navigator.clipboard.readText()
      const layoutData = JSON.parse(text)

      const validation = this.validateLayout(layoutData)
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid layout')
      }

      const importedLayout: Omit<DashboardLayout, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
        layout_name: layoutData.layout_name + ' (From Clipboard)',
        description: layoutData.description || 'Pasted layout',
        layout_config: layoutData.layout_config,
        is_active: false,
        is_default: false,
      }

      return importedLayout as DashboardLayout
    } catch (error) {
      throw new Error('Invalid clipboard data: ' + (error as Error).message)
    }
  }
}


























