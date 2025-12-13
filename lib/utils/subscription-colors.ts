/**
 * Get color for subscription category
 */
export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    streaming: '#ef4444', // red
    software: '#8b5cf6', // purple
    ai_tools: '#10b981', // green
    productivity: '#f59e0b', // amber
    cloud_storage: '#3b82f6', // blue
    gaming: '#ec4899', // pink
    music: '#14b8a6', // teal
    fitness: '#06b6d4', // cyan
    news: '#6366f1', // indigo
    other: '#6b7280', // gray
  }

  return colors[category] || colors.other
}

/**
 * Get icon for subscription category
 */
export function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    streaming: '📺',
    software: '💻',
    ai_tools: '🤖',
    productivity: '⚡',
    cloud_storage: '☁️',
    gaming: '🎮',
    music: '🎵',
    fitness: '💪',
    news: '📰',
    other: '📦',
  }

  return icons[category] || icons.other
}




