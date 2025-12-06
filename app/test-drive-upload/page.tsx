'use client'

import { DocumentUpload } from '@/components/ui/document-upload'
import { Card } from '@/components/ui/card'
import { useSession } from 'next-auth/react'

export default function TestDriveUploadPage() {
  const { data: session } = useSession()

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🧪 Test Google Drive Upload</h1>
        <p className="text-gray-600">
          Upload a file below to test the Google Drive integration.
          The "LifeHub" folder will be created automatically!
        </p>
      </div>

      {!session && (
        <Card className="p-6 bg-yellow-50 border-yellow-200 mb-6">
          <p className="text-yellow-800">
            ⚠️ Please sign in with Google first to test uploads.
          </p>
          <a href="/auth/signin" className="text-blue-600 hover:underline mt-2 inline-block">
            → Go to Sign In
          </a>
        </Card>
      )}

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">✅ What's Ready:</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Google OAuth connected (with Drive permissions)</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Database table created</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Service role key configured</span>
          </li>
          <li className="flex items-center gap-2">
            <span className={session ? "text-green-500" : "text-yellow-500"}>
              {session ? "✓" : "⚠"}
            </span>
            <span>
              {session 
                ? `Signed in as: ${session.user?.email}` 
                : 'Not signed in yet'}
            </span>
          </li>
        </ul>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">📋 Test Upload (Insurance Domain)</h2>
        <DocumentUpload 
          domain="insurance"
          enableOCR={true}
          label="Upload Test File"
          onUploadComplete={(fileId) => {
            console.log('✅ Upload complete! File ID:', fileId)
            alert(`✅ Success! File uploaded to Google Drive!\n\nCheck your Drive for the "LifeHub/Insurance/" folder!\n\nFile ID: ${fileId}`)
          }}
        />
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">📋 Test Upload (Vehicles Domain)</h2>
        <DocumentUpload 
          domain="vehicles"
          enableOCR={true}
          label="Upload Vehicle Document"
          onUploadComplete={(fileId) => {
            console.log('✅ Upload complete! File ID:', fileId)
            alert(`✅ Success! File uploaded to Google Drive!\n\nCheck your Drive for the "LifeHub/Vehicles/" folder!\n\nFile ID: ${fileId}`)
          }}
        />
      </Card>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h2 className="text-lg font-semibold mb-3 text-blue-900">🎯 What Happens When You Upload:</h2>
        <ol className="space-y-2 text-sm text-blue-800">
          <li className="flex gap-2">
            <span className="font-bold">1.</span>
            <span>Your file is uploaded to Google Drive</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">2.</span>
            <span>Code creates "LifeHub" folder (if it doesn't exist)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">3.</span>
            <span>Code creates domain subfolder (e.g., "LifeHub/Insurance/")</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">4.</span>
            <span>File is saved there with metadata in Supabase</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">5.</span>
            <span>You'll see a success message!</span>
          </li>
        </ol>
        
        <div className="mt-4 pt-4 border-t border-blue-300">
          <p className="text-sm font-semibold text-blue-900 mb-2">After uploading, check:</p>
          <a 
            href="https://drive.google.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            → Open Google Drive (opens in new tab)
          </a>
        </div>
      </Card>

      <Card className="p-6 bg-gray-50">
        <h2 className="text-lg font-semibold mb-3">🔍 Debugging Info:</h2>
        <div className="space-y-2 text-sm font-mono">
          <div>Session: {session ? '✅ Active' : '❌ None'}</div>
          <div>Email: {session?.user?.email || 'Not signed in'}</div>
          <div>Access Token: {session?.accessToken ? '✅ Present' : '❌ Missing'}</div>
        </div>
        <p className="text-xs text-gray-600 mt-4">
          Open browser console (F12) to see detailed upload logs
        </p>
      </Card>
    </div>
  )
}
































