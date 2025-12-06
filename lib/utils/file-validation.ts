/**
 * File Upload Validation Utility
 * Provides secure file validation to prevent malicious uploads
 */

// Maximum file size: 10MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed MIME types for uploads
export const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain',
  'text/csv',
] as const

// File extension to MIME type mapping
export const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
  csv: 'text/csv',
}

// Magic bytes for file type detection
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP is RIFF format)
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
}

interface ValidationResult {
  valid: boolean
  error?: string
  sanitizedName?: string
  detectedMimeType?: string
}

/**
 * Validate file size
 */
export function validateFileSize(size: number): ValidationResult {
  if (size === 0) {
    return { valid: false, error: 'File is empty' }
  }
  
  if (size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB` 
    }
  }
  
  return { valid: true }
}

/**
 * Validate MIME type
 */
export function validateMimeType(mimeType: string): ValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(mimeType as any)) {
    return { 
      valid: false, 
      error: `File type '${mimeType}' is not allowed` 
    }
  }
  
  return { valid: true }
}

/**
 * Detect MIME type from magic bytes (file signature)
 */
export function detectMimeTypeFromBytes(bytes: Uint8Array): string | null {
  for (const [mimeType, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const signature of signatures) {
      let matches = true
      for (let i = 0; i < signature.length; i++) {
        if (bytes[i] !== signature[i]) {
          matches = false
          break
        }
      }
      if (matches) {
        return mimeType
      }
    }
  }
  return null
}

/**
 * Sanitize filename to prevent path traversal and XSS
 */
export function sanitizeFilename(filename: string): string {
  // Remove any directory path
  let sanitized = filename.replace(/^.*[\\/]/, '')
  
  // Replace dangerous characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_')
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || ''
    const nameWithoutExt = sanitized.substring(0, sanitized.length - ext.length - 1)
    sanitized = nameWithoutExt.substring(0, 250 - ext.length) + '.' + ext
  }
  
  // Ensure filename isn't empty after sanitization
  if (!sanitized || sanitized === '.' || sanitized === '_') {
    sanitized = 'file_' + Date.now()
  }
  
  return sanitized
}

/**
 * Validate file extension matches MIME type
 */
export function validateExtensionMatchesMime(filename: string, mimeType: string): ValidationResult {
  const extension = filename.split('.').pop()?.toLowerCase()
  
  if (!extension) {
    return { valid: false, error: 'File has no extension' }
  }
  
  const expectedMime = EXTENSION_TO_MIME[extension]
  
  if (!expectedMime) {
    return { valid: false, error: `File extension '.${extension}' is not allowed` }
  }
  
  // Normalize MIME types (some browsers use variations)
  const normalizedMime = mimeType.toLowerCase().split(';')[0].trim()
  const normalizedExpected = expectedMime.toLowerCase()
  
  if (normalizedMime !== normalizedExpected && 
      !(normalizedMime === 'image/jpg' && normalizedExpected === 'image/jpeg')) {
    return { 
      valid: false, 
      error: `File extension '.${extension}' does not match MIME type '${mimeType}'` 
    }
  }
  
  return { valid: true }
}

/**
 * Comprehensive file validation
 * Validates size, MIME type, magic bytes, and sanitizes filename
 */
export async function validateFile(file: File): Promise<ValidationResult> {
  // 1. Validate file size
  const sizeValidation = validateFileSize(file.size)
  if (!sizeValidation.valid) {
    return sizeValidation
  }
  
  // 2. Validate MIME type (client-provided, not fully trustworthy)
  const mimeValidation = validateMimeType(file.type)
  if (!mimeValidation.valid) {
    return mimeValidation
  }
  
  // 3. Validate extension matches MIME type
  const extensionValidation = validateExtensionMatchesMime(file.name, file.type)
  if (!extensionValidation.valid) {
    return extensionValidation
  }
  
  // 4. Check magic bytes (file signature) for images and PDFs
  if (file.type.startsWith('image/') || file.type === 'application/pdf') {
    try {
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer.slice(0, 16)) // Read first 16 bytes
      
      const detectedMime = detectMimeTypeFromBytes(bytes)
      
      if (detectedMime && detectedMime !== file.type && 
          !(detectedMime === 'image/jpeg' && file.type === 'image/jpg')) {
        return {
          valid: false,
          error: `File signature does not match declared type. Expected '${file.type}' but detected '${detectedMime}'`
        }
      }
      
      // If we can't detect the type but it's a known format, that's okay
      // (we might not have magic bytes for all formats)
    } catch (error) {
      console.error('Error reading file for magic byte detection:', error)
      // Don't fail validation if we can't read the file
    }
  }
  
  // 5. Sanitize filename
  const sanitizedName = sanitizeFilename(file.name)
  
  return {
    valid: true,
    sanitizedName,
    detectedMimeType: file.type
  }
}

/**
 * Validate file on server side (for API routes)
 */
export function validateFileServerSide(
  filename: string,
  mimeType: string,
  size: number,
  fileBuffer?: Buffer | ArrayBuffer
): ValidationResult {
  // 1. Validate size
  const sizeValidation = validateFileSize(size)
  if (!sizeValidation.valid) {
    return sizeValidation
  }
  
  // 2. Validate MIME type
  const mimeValidation = validateMimeType(mimeType)
  if (!mimeValidation.valid) {
    return mimeValidation
  }
  
  // 3. Validate extension matches MIME type
  const extensionValidation = validateExtensionMatchesMime(filename, mimeType)
  if (!extensionValidation.valid) {
    return extensionValidation
  }
  
  // 4. Check magic bytes if buffer is provided
  if (fileBuffer && (mimeType.startsWith('image/') || mimeType === 'application/pdf')) {
    const bytes = new Uint8Array(
      fileBuffer instanceof Buffer ? fileBuffer : fileBuffer
    ).slice(0, 16)
    
    const detectedMime = detectMimeTypeFromBytes(bytes)
    
    if (detectedMime && detectedMime !== mimeType &&
        !(detectedMime === 'image/jpeg' && mimeType === 'image/jpg')) {
      return {
        valid: false,
        error: `File signature does not match declared type. Expected '${mimeType}' but detected '${detectedMime}'`
      }
    }
  }
  
  // 5. Sanitize filename
  const sanitizedName = sanitizeFilename(filename)
  
  return {
    valid: true,
    sanitizedName,
    detectedMimeType: mimeType
  }
}

/**
 * Get user-friendly error message for validation errors
 */
export function getValidationErrorMessage(error: string): string {
  if (error.includes('File size exceeds')) {
    return `File is too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`
  }
  if (error.includes('File type')) {
    return 'This file type is not supported. Please upload an image, PDF, or document file.'
  }
  if (error.includes('File has no extension')) {
    return 'Please upload a file with a valid extension (e.g., .pdf, .jpg, .png)'
  }
  if (error.includes('File extension')) {
    return 'File extension does not match the file type. The file may be corrupted or incorrectly named.'
  }
  if (error.includes('File signature')) {
    return 'File validation failed. The file may be corrupted or not a valid file of this type.'
  }
  if (error.includes('File is empty')) {
    return 'The file is empty. Please upload a valid file.'
  }
  return error
}



