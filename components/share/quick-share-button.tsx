'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UniversalShareModal } from './universal-share-modal'
import { QuickShareButtonProps, ShareChannel } from '@/types/share'
import { useShare } from '@/lib/contexts/share-context'
import { 
  Share2, Link2, Download, Mail, QrCode, 
  FileJson, FileText, MessageCircle 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function QuickShareButton({
  data,
  domain,
  size = 'md',
  variant = 'default',
  position,
  quickActions = ['link', 'download', 'email']
}: QuickShareButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [modalTab, setModalTab] = useState<'link' | 'export' | 'email' | 'qr'>('link')
  const { shareData, exportData, loading } = useShare()

  // Ensure data is an array
  const entries = Array.isArray(data) ? data : [data]

  const sizeClasses = {
    sm: 'h-8 text-xs',
    md: 'h-9 text-sm',
    lg: 'h-10 text-base'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  const positionClasses = position ? {
    'top-left': 'absolute top-2 left-2',
    'top-right': 'absolute top-2 right-2',
    'bottom-left': 'absolute bottom-2 left-2',
    'bottom-right': 'absolute bottom-2 right-2'
  }[position] : ''

  /**
   * Quick action: Generate and copy link
   */
  const handleQuickLink = async () => {
    try {
      const result = await shareData({
        domain,
        entry_ids: entries.map(e => e.id),
        title: `Quick Share - ${entries.length} item(s)`,
        access_type: 'public'
      })

      await navigator.clipboard.writeText(result.share_url)
    } catch (error) {
      console.error('Quick link failed:', error)
    }
  }

  /**
   * Quick action: Export as JSON
   */
  const handleQuickExport = async () => {
    try {
      await exportData({
        domain,
        entry_ids: entries.map(e => e.id),
        format: 'json'
      })
    } catch (error) {
      console.error('Quick export failed:', error)
    }
  }

  /**
   * Open modal with specific tab
   */
  const openModalTab = (tab: typeof modalTab) => {
    setModalTab(tab)
    setShowModal(true)
  }

  return (
    <>
      <div className={cn(positionClasses, 'z-10')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={variant}
              size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
              className={cn(sizeClasses[size])}
              disabled={loading}
            >
              <Share2 className={cn(iconSizes[size], 'mr-1.5')} />
              Share
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-56">
            {quickActions.includes('link') && (
              <DropdownMenuItem onClick={handleQuickLink}>
                <Link2 className="h-4 w-4 mr-2" />
                Copy Share Link
              </DropdownMenuItem>
            )}

            {quickActions.includes('download') && (
              <>
                <DropdownMenuItem onClick={handleQuickExport}>
                  <FileJson className="h-4 w-4 mr-2" />
                  Quick Export (JSON)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openModalTab('export')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Options...
                </DropdownMenuItem>
              </>
            )}

            {quickActions.includes('email') && (
              <DropdownMenuItem onClick={() => openModalTab('email')}>
                <Mail className="h-4 w-4 mr-2" />
                Send via Email
              </DropdownMenuItem>
            )}

            {quickActions.includes('qr') && (
              <DropdownMenuItem onClick={() => openModalTab('qr')}>
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR Code
              </DropdownMenuItem>
            )}

            {quickActions.includes('social') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => {
                  // Social share functionality
                  openModalTab('link')
                }}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Share on Social Media
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openModalTab('link')}>
              <Share2 className="h-4 w-4 mr-2" />
              All Sharing Options...
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <UniversalShareModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        domain={domain}
        entries={entries}
        defaultTab={modalTab}
      />
    </>
  )
}

