/**
 * Normalize metadata structure to handle both single and double-nested metadata
 *
 * Some entries have: { metadata: { type: "weight", value: 175 } }
 * Others have:       { metadata: { metadata: { type: "weight", value: 175 } } }
 *
 * This function always returns the deepest metadata object
 */
export function normalizeMetadata(entry: any): any {
  if (!entry?.metadata) return {}

  const meta = entry.metadata

  // If metadata has a nested metadata property, use that
  if (meta.metadata && typeof meta.metadata === 'object') {
    return meta.metadata
  }

  // Otherwise use the metadata directly
  return meta
}

/**
 * Get a metadata value with fallback for nested structures
 */
export function getMetadataValue(entry: any, key: string, defaultValue?: any): any {
  const meta = normalizeMetadata(entry)
  return meta?.[key] ?? defaultValue
}

/**
 * Check if entry matches a type (handles both itemType and type fields)
 */
export function isEntryType(entry: any, type: string | string[]): boolean {
  const meta = normalizeMetadata(entry)
  const types = Array.isArray(type) ? type : [type]

  const itemType = meta?.itemType as string
  const metaType = meta?.type as string

  return types.includes(itemType) || types.includes(metaType)
}
