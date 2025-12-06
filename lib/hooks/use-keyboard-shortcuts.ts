import { useEffect } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  description: string
  action: () => void
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find(shortcut => {
        const eventKey = event.key?.toLowerCase() || ''
        const shortcutKey = shortcut.key?.toLowerCase() || ''
        const keyMatches = eventKey === shortcutKey
        const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey
        const metaMatches = !!shortcut.metaKey === event.metaKey
        const shiftMatches = !!shortcut.shiftKey === event.shiftKey
        const altMatches = !!shortcut.altKey === event.altKey

        return keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches
      })

      if (matchingShortcut) {
        event.preventDefault()
        matchingShortcut.action()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts, enabled])
}

// Default app-wide shortcuts
export const getDefaultShortcuts = (handlers: {
  onQuickAdd?: () => void
  onCommandPalette?: () => void
  onSearch?: () => void
  onAchievements?: () => void
  onNotifications?: () => void
}): KeyboardShortcut[] => [
  {
    key: 'n',
    metaKey: true,
    description: 'Quick Add',
    action: () => handlers.onQuickAdd?.(),
  },
  {
    key: 'k',
    metaKey: true,
    description: 'Command Palette',
    action: () => handlers.onCommandPalette?.(),
  },
  {
    key: 'f',
    metaKey: true,
    description: 'Search',
    action: () => handlers.onSearch?.(),
  },
  {
    key: 'a',
    metaKey: true,
    shiftKey: true,
    description: 'View Achievements',
    action: () => handlers.onAchievements?.(),
  },
  {
    key: 'b',
    metaKey: true,
    shiftKey: true,
    description: 'Request Notifications',
    action: () => handlers.onNotifications?.(),
  },
]

export function getKeyboardShortcutLabel(shortcut: Partial<KeyboardShortcut>): string {
  const parts: string[] = []
  
  if (shortcut.ctrlKey) parts.push('Ctrl')
  if (shortcut.metaKey) parts.push('⌘')
  if (shortcut.shiftKey) parts.push('⇧')
  if (shortcut.altKey) parts.push('⌥')
  if (shortcut.key) parts.push(shortcut.key.toUpperCase())

  return parts.join(' + ')
}








