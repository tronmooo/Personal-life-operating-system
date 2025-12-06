/**
 * Responsive Dashboard Manager
 * Handles device-specific layouts, breakpoints, and optimizations
 */

import { DashboardLayout, DashboardCard } from '@/lib/types/dashboard-layout-types'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'
export type Orientation = 'portrait' | 'landscape'

export interface ResponsiveBreakpoint {
  minWidth: number
  maxWidth?: number
  cols: number
  rowHeight: number
  margin: [number, number]
  containerPadding: [number, number]
}

export const RESPONSIVE_BREAKPOINTS: Record<DeviceType, ResponsiveBreakpoint> = {
  mobile: {
    minWidth: 0,
    maxWidth: 767,
    cols: 2, // 2 columns on mobile
    rowHeight: 120,
    margin: [8, 8],
    containerPadding: [8, 8],
  },
  tablet: {
    minWidth: 768,
    maxWidth: 1023,
    cols: 6, // 6 columns on tablet
    rowHeight: 110,
    margin: [12, 12],
    containerPadding: [16, 16],
  },
  desktop: {
    minWidth: 1024,
    cols: 12, // 12 columns on desktop
    rowHeight: 100,
    margin: [16, 16],
    containerPadding: [0, 0],
  },
}

export class ResponsiveManager {
  /**
   * Detect current device type
   */
  static detectDevice(): DeviceType {
    if (typeof window === 'undefined') return 'desktop'
    
    const width = window.innerWidth
    
    if (width < 768) {
      return 'mobile'
    } else if (width < 1024) {
      return 'tablet'
    } else {
      return 'desktop'
    }
  }

  /**
   * Detect orientation
   */
  static detectOrientation(): Orientation {
    if (typeof window === 'undefined') return 'portrait'
    
    return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  }

  /**
   * Check if touch is supported
   */
  static isTouchDevice(): boolean {
    if (typeof window === 'undefined') return false
    
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }

  /**
   * Get breakpoint configuration for current device
   */
  static getCurrentBreakpoint(): ResponsiveBreakpoint {
    const device = this.detectDevice()
    return RESPONSIVE_BREAKPOINTS[device]
  }

  /**
   * Optimize layout for device
   */
  static optimizeLayoutForDevice(
    layout: DashboardLayout,
    device: DeviceType = this.detectDevice()
  ): DashboardLayout {
    const breakpoint = RESPONSIVE_BREAKPOINTS[device]
    const optimizedCards = layout.layout_config.cards.map(card => 
      this.optimizeCardForDevice(card, device)
    )

    return {
      ...layout,
      layout_config: {
        ...layout.layout_config,
        cards: optimizedCards,
        columns: breakpoint.cols,
        rowHeight: breakpoint.rowHeight,
      }
    }
  }

  /**
   * Optimize individual card for device
   */
  static optimizeCardForDevice(
    card: DashboardCard,
    device: DeviceType
  ): DashboardCard {
    const breakpoint = RESPONSIVE_BREAKPOINTS[device]
    
    switch (device) {
      case 'mobile':
        // On mobile, make all cards take full width (2 cols)
        return {
          ...card,
          position: {
            ...card.position,
            w: Math.min(card.position.w, breakpoint.cols),
            h: card.size === 'large' ? 3 : 2, // Reduce height for mobile
          }
        }
      
      case 'tablet':
        // On tablet, scale down large cards
        return {
          ...card,
          position: {
            ...card.position,
            w: Math.min(card.position.w, breakpoint.cols),
            h: card.size === 'large' ? 3 : 2,
          }
        }
      
      case 'desktop':
      default:
        return card
    }
  }

  /**
   * Get recommended visible cards count for device
   */
  static getRecommendedCardCount(device: DeviceType): { min: number; max: number } {
    switch (device) {
      case 'mobile':
        return { min: 3, max: 6 }
      case 'tablet':
        return { min: 4, max: 8 }
      case 'desktop':
      default:
        return { min: 6, max: 12 }
    }
  }

  /**
   * Auto-hide cards for mobile optimization
   */
  static autoOptimizeForMobile(layout: DashboardLayout): DashboardLayout {
    const device = this.detectDevice()
    
    if (device !== 'mobile') {
      return layout
    }

    const { max } = this.getRecommendedCardCount('mobile')
    const sortedCards = [...layout.layout_config.cards].sort((a, b) => {
      // Prioritize: visible > large > medium > small
      if (a.visible !== b.visible) return a.visible ? -1 : 1
      const sizeOrder = { large: 3, medium: 2, small: 1 }
      return sizeOrder[b.size] - sizeOrder[a.size]
    })

    const optimizedCards = sortedCards.map((card, index) => ({
      ...card,
      visible: index < max ? card.visible : false,
    }))

    return {
      ...layout,
      layout_config: {
        ...layout.layout_config,
        cards: optimizedCards,
      }
    }
  }

  /**
   * Generate mobile-specific layout
   */
  static generateMobileLayout(cards: DashboardCard[]): DashboardCard[] {
    const mobileBreakpoint = RESPONSIVE_BREAKPOINTS.mobile
    let currentY = 0

    return cards
      .filter(card => card.visible)
      .map((card, index) => {
        const optimizedCard = {
          ...card,
          position: {
            x: 0, // Always start at 0 on mobile
            y: currentY,
            w: mobileBreakpoint.cols, // Full width
            h: card.size === 'large' ? 3 : 2,
          }
        }

        currentY += optimizedCard.position.h

        return optimizedCard
      })
  }

  /**
   * Listen for device changes
   */
  static onDeviceChange(callback: (device: DeviceType, orientation: Orientation) => void) {
    if (typeof window === 'undefined') return () => {}

    const handleChange = () => {
      const device = this.detectDevice()
      const orientation = this.detectOrientation()
      callback(device, orientation)
    }

    window.addEventListener('resize', handleChange)
    window.addEventListener('orientationchange', handleChange)

    // Call immediately
    handleChange()

    // Return cleanup function
    return () => {
      window.removeEventListener('resize', handleChange)
      window.removeEventListener('orientationchange', handleChange)
    }
  }

  /**
   * Get CSS media queries
   */
  static getMediaQueries() {
    return {
      mobile: `(max-width: ${RESPONSIVE_BREAKPOINTS.mobile.maxWidth}px)`,
      tablet: `(min-width: ${RESPONSIVE_BREAKPOINTS.tablet.minWidth}px) and (max-width: ${RESPONSIVE_BREAKPOINTS.tablet.maxWidth}px)`,
      desktop: `(min-width: ${RESPONSIVE_BREAKPOINTS.desktop.minWidth}px)`,
      portrait: '(orientation: portrait)',
      landscape: '(orientation: landscape)',
      touch: '(hover: none) and (pointer: coarse)',
    }
  }

  /**
   * Get touch-friendly minimum sizes
   */
  static getTouchMinimumSizes() {
    return {
      button: 48, // 48x48px minimum for touch targets
      icon: 24, // 24x24px for icons
      spacing: 16, // 16px minimum spacing between elements
      fontSize: {
        small: 14,
        medium: 16,
        large: 18,
      }
    }
  }

  /**
   * Check if current viewport is mobile
   */
  static isMobile(): boolean {
    return this.detectDevice() === 'mobile'
  }

  /**
   * Check if current viewport is tablet
   */
  static isTablet(): boolean {
    return this.detectDevice() === 'tablet'
  }

  /**
   * Check if current viewport is desktop
   */
  static isDesktop(): boolean {
    return this.detectDevice() === 'desktop'
  }

  // Persistence helpers were previously localStorage-backed; layout persistence now
  // lives in user preferences via Supabase.
}

























