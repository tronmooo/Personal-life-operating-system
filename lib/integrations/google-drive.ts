/**
 * Google Drive Integration
 * Handles document storage, organization, and retrieval from Google Drive
 */

import { google, drive_v3 } from 'googleapis'
import { Readable } from 'stream'

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  webViewLink?: string
  webContentLink?: string
  thumbnailLink?: string
  createdTime: string
  modifiedTime: string
  size?: string
  extractedText?: string
}

export interface UploadOptions {
  file: File | Buffer
  fileName: string
  mimeType: string
  domainFolder: string
  extractedText?: string
}

export class GoogleDriveService {
  private drive: drive_v3.Drive
  private rootFolderName = 'LifeHub'
  
  // Domain to folder mapping
  private domainFolders: Record<string, string> = {
    insurance: 'Insurance',
    vehicles: 'Vehicles',
    health: 'Health',
    home: 'Home',
    pets: 'Pets',
    collectibles: 'Collectibles',
    relationships: 'Relationships',
    financial: 'Financial',
    career: 'Career',
    misc: 'Miscellaneous',
  }

  constructor(accessToken: string, refreshToken?: string) {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + '/api/auth/callback/google'
    )

    auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    this.drive = google.drive({ version: 'v3', auth })
  }

  /**
   * Ensure root LifeHub folder exists, create if not
   */
  private async ensureRootFolder(): Promise<string> {
    try {
      console.log('🔍 Searching for LifeHub folder in Google Drive...')
      
      // Search for existing LifeHub folder
      const response = await this.drive.files.list({
        q: `name='${this.rootFolderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      })

      if (response.data.files && response.data.files.length > 0) {
        console.log('✅ Found existing LifeHub folder:', response.data.files[0].id)
        return response.data.files[0].id!
      }

      // Create root folder if it doesn't exist
      console.log('📁 Creating NEW LifeHub folder in Google Drive...')
      const folder = await this.drive.files.create({
        requestBody: {
          name: this.rootFolderName,
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      })

      console.log('🎉 SUCCESS! Created LifeHub root folder with ID:', folder.data.id)
      console.log('👉 Check your Google Drive now: https://drive.google.com')
      return folder.data.id!
    } catch (error: any) {
      console.error('❌ Error ensuring root folder:', error.message)
      throw new Error('Failed to create LifeHub folder in Google Drive')
    }
  }

  /**
   * Ensure domain-specific folder exists under LifeHub
   */
  private async ensureDomainFolder(domain: string): Promise<string> {
    try {
      console.log(`🔍 Ensuring domain folder for: ${domain}`)
      const rootFolderId = await this.ensureRootFolder()
      const folderName = this.domainFolders[domain] || 'Miscellaneous'

      // Search for existing domain folder
      const response = await this.drive.files.list({
        q: `name='${folderName}' and '${rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      })

      if (response.data.files && response.data.files.length > 0) {
        return response.data.files[0].id!
      }

      // Create domain folder
      const folder = await this.drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [rootFolderId],
        },
        fields: 'id',
      })

      console.log(`📁 Created ${folderName} folder:`, folder.data.id)
      return folder.data.id!
    } catch (error: any) {
      console.error('Error ensuring domain folder:', error.message)
      throw new Error(`Failed to create ${domain} folder`)
    }
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(options: UploadOptions): Promise<DriveFile> {
    try {
      const folderId = await this.ensureDomainFolder(options.domainFolder)

      let fileData: Buffer
      if (options.file instanceof File) {
        const arrayBuffer = await options.file.arrayBuffer()
        fileData = Buffer.from(arrayBuffer)
      } else {
        fileData = options.file
      }

      // Prepare metadata
      const metadata: drive_v3.Schema$File = {
        name: options.fileName,
        parents: [folderId],
        description: `Uploaded from LifeHub - ${options.domainFolder} domain`,
      }

      // Add OCR flag to description (properties have 124 byte limit)
      if (options.extractedText) {
        metadata.description += ' | OCR extracted'
      }

      // Convert Buffer to a Node stream compatible with googleapis
      const stream = Readable.from(fileData)

      const response = await this.drive.files.create({
        requestBody: metadata,
        media: {
          mimeType: options.mimeType,
          body: stream,
        },
        fields: 'id, name, mimeType, webViewLink, webContentLink, thumbnailLink, createdTime, modifiedTime, size',
      })

      console.log('📤 Uploaded file to Drive:', response.data.name)

      return {
        id: response.data.id!,
        name: response.data.name!,
        mimeType: response.data.mimeType!,
        webViewLink: response.data.webViewLink || undefined,
        webContentLink: response.data.webContentLink || undefined,
        thumbnailLink: response.data.thumbnailLink || undefined,
        createdTime: response.data.createdTime!,
        modifiedTime: response.data.modifiedTime!,
        size: response.data.size || undefined,
        extractedText: options.extractedText, // Return the full text from the input, not from Drive
      }
    } catch (error: any) {
      console.error('Error uploading file to Drive:', error.message)
      throw new Error('Failed to upload file to Google Drive')
    }
  }

  /**
   * List all files in a domain folder
   */
  async listDomainFiles(domain: string): Promise<DriveFile[]> {
    try {
      const folderId = await this.ensureDomainFolder(domain)

      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, createdTime, modifiedTime, size, properties)',
        orderBy: 'modifiedTime desc',
        pageSize: 100,
      })

      return (response.data.files || []).map((file) => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        webViewLink: file.webViewLink || undefined,
        webContentLink: file.webContentLink || undefined,
        thumbnailLink: file.thumbnailLink || undefined,
        createdTime: file.createdTime!,
        modifiedTime: file.modifiedTime!,
        size: file.size || undefined,
        extractedText: file.properties?.extractedText,
      }))
    } catch (error: any) {
      console.error('Error listing domain files:', error.message)
      return []
    }
  }

  /**
   * Delete a file from Google Drive
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.drive.files.delete({
        fileId,
      })
      console.log('🗑️ Deleted file from Drive:', fileId)
    } catch (error: any) {
      console.error('Error deleting file:', error.message)
      throw new Error('Failed to delete file from Google Drive')
    }
  }

  /**
   * Get shareable link for a file
   */
  async createShareableLink(fileId: string): Promise<string> {
    try {
      // Make file accessible to anyone with the link
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      })

      const file = await this.drive.files.get({
        fileId,
        fields: 'webViewLink',
      })

      return file.data.webViewLink || ''
    } catch (error: any) {
      console.error('Error creating shareable link:', error.message)
      throw new Error('Failed to create shareable link')
    }
  }

  /**
   * Share file with specific email
   */
  async shareWithEmail(fileId: string, email: string, role: 'reader' | 'writer' = 'reader'): Promise<void> {
    try {
      await this.drive.permissions.create({
        fileId,
        requestBody: {
          role,
          type: 'user',
          emailAddress: email,
        },
        sendNotificationEmail: true,
      })

      console.log(`📧 Shared file ${fileId} with ${email} (${role})`)
    } catch (error: any) {
      console.error('Error sharing file:', error.message)
      throw new Error('Failed to share file')
    }
  }

  /**
   * Search across all LifeHub documents
   */
  async searchDocuments(query: string): Promise<DriveFile[]> {
    try {
      const rootFolderId = await this.ensureRootFolder()

      // Search in all files under LifeHub folder
      const response = await this.drive.files.list({
        q: `'${rootFolderId}' in parents and (name contains '${query}' or fullText contains '${query}') and trashed=false`,
        fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, createdTime, modifiedTime, size, properties)',
        orderBy: 'modifiedTime desc',
        pageSize: 50,
      })

      return (response.data.files || []).map((file) => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        webViewLink: file.webViewLink || undefined,
        webContentLink: file.webContentLink || undefined,
        thumbnailLink: file.thumbnailLink || undefined,
        createdTime: file.createdTime!,
        modifiedTime: file.modifiedTime!,
        size: file.size || undefined,
        extractedText: file.properties?.extractedText,
      }))
    } catch (error: any) {
      console.error('Error searching documents:', error.message)
      return []
    }
  }

  /**
   * Get folder structure (all domain folders)
   */
  async getFolderStructure(): Promise<{ domain: string; folderId: string; fileCount: number }[]> {
    try {
      const rootFolderId = await this.ensureRootFolder()
      const structure: { domain: string; folderId: string; fileCount: number }[] = []

      for (const [domain, folderName] of Object.entries(this.domainFolders)) {
        try {
          const folderId = await this.ensureDomainFolder(domain)
          const files = await this.listDomainFiles(domain)
          
          structure.push({
            domain,
            folderId,
            fileCount: files.length,
          })
        } catch (error) {
          console.error(`Error getting folder for ${domain}:`, error)
        }
      }

      return structure
    } catch (error: any) {
      console.error('Error getting folder structure:', error.message)
      return []
    }
  }
}

