'use client'

import { useState, useCallback, useEffect } from 'react'
import DOMPurify from 'dompurify'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Bold, Italic, Underline, Strikethrough, List, ListOrdered,
  Link as LinkIcon, Image as ImageIcon, Code, Quote, Heading1,
  Heading2, AlignLeft, AlignCenter, AlignRight, Undo, Redo,
  Save, Eye, CheckSquare
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  onSave?: () => void
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  minHeight = '300px',
  onSave
}: RichTextEditorProps) {
  const [content, setContent] = useState(value)
  const [history, setHistory] = useState<string[]>([value])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkText, setLinkText] = useState('')
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    setContent(value)
  }, [value])

  const updateContent = (newContent: string) => {
    setContent(newContent)
    onChange(newContent)
    
    // Update history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newContent)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      const previousContent = history[historyIndex - 1]
      setContent(previousContent)
      onChange(previousContent)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      const nextContent = history[historyIndex + 1]
      setContent(nextContent)
      onChange(nextContent)
    }
  }

  const insertMarkdown = useCallback((before: string, after: string = '', placeholder: string = '') => {
    const textarea = document.getElementById('rich-editor') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const textToInsert = selectedText || placeholder

    const newContent = 
      content.substring(0, start) + 
      before + textToInsert + after + 
      content.substring(end)

    updateContent(newContent)

    // Set cursor position
    setTimeout(() => {
      const newCursorPos = start + before.length + textToInsert.length + after.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }, [content])

  const insertLink = () => {
    if (!linkUrl) return
    const displayText = linkText || linkUrl
    insertMarkdown('[', `](${linkUrl})`, displayText)
    setLinkUrl('')
    setLinkText('')
    setIsLinkDialogOpen(false)
  }

  const insertImage = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      insertMarkdown('![', `](${url})`, 'Image description')
    }
  }

  const formatActions = [
    {
      label: 'Bold',
      icon: Bold,
      action: () => insertMarkdown('**', '**', 'bold text'),
    },
    {
      label: 'Italic',
      icon: Italic,
      action: () => insertMarkdown('*', '*', 'italic text'),
    },
    {
      label: 'Underline',
      icon: Underline,
      action: () => insertMarkdown('<u>', '</u>', 'underlined text'),
    },
    {
      label: 'Strikethrough',
      icon: Strikethrough,
      action: () => insertMarkdown('~~', '~~', 'strikethrough'),
    },
    {
      label: 'Heading 1',
      icon: Heading1,
      action: () => insertMarkdown('# ', '', 'Heading 1'),
    },
    {
      label: 'Heading 2',
      icon: Heading2,
      action: () => insertMarkdown('## ', '', 'Heading 2'),
    },
    {
      label: 'Bullet List',
      icon: List,
      action: () => insertMarkdown('- ', '', 'List item'),
    },
    {
      label: 'Numbered List',
      icon: ListOrdered,
      action: () => insertMarkdown('1. ', '', 'List item'),
    },
    {
      label: 'Task List',
      icon: CheckSquare,
      action: () => insertMarkdown('- [ ] ', '', 'Task'),
    },
    {
      label: 'Quote',
      icon: Quote,
      action: () => insertMarkdown('> ', '', 'Quote'),
    },
    {
      label: 'Code',
      icon: Code,
      action: () => insertMarkdown('`', '`', 'code'),
    },
  ]

  const renderMarkdown = (text: string) => {
    let html = text
    
    // Headers
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-3xl font-bold my-4">$1</h1>')
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-2xl font-bold my-3">$1</h2>')
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-xl font-bold my-2">$1</h3>')
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Underline
    html = html.replace(/<u>(.*?)<\/u>/g, '<u>$1</u>')
    
    // Strikethrough
    html = html.replace(/~~(.*?)~~/g, '<del>$1</del>')
    
    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary underline" target="_blank">$1</a>')
    
    // Images
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-2" />')
    
    // Code
    html = html.replace(/`(.*?)`/g, '<code class="bg-muted px-1 rounded">$1</code>')
    
    // Quotes
    html = html.replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-primary pl-4 italic my-2">$1</blockquote>')
    
    // Lists
    html = html.replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
    html = html.replace(/^(\d+)\. (.*$)/gm, '<li class="ml-4" style="list-style-type: decimal;">$2</li>')
    
    // Task lists
    html = html.replace(/^- \[ \] (.*$)/gm, '<li class="ml-4"><input type="checkbox" disabled class="mr-2" />$1</li>')
    html = html.replace(/^- \[x\] (.*$)/gm, '<li class="ml-4"><input type="checkbox" disabled checked class="mr-2" />$1</li>')
    
    // Line breaks
    html = html.replace(/\n/g, '<br />')
    
    // CRITICAL SECURITY FIX: Sanitize HTML to prevent XSS attacks
    if (typeof window !== 'undefined') {
      html = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: ['h1', 'h2', 'h3', 'strong', 'em', 'u', 'del', 'a', 'img', 'code', 'blockquote', 'li', 'br', 'input'],
        ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'class', 'style', 'type', 'disabled', 'checked'],
        ALLOW_DATA_ATTR: false,
      })
    }
    
    return html
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-muted/50 p-2 border-b flex flex-wrap items-center gap-1">
        {/* History Controls */}
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={historyIndex <= 0}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Format Actions */}
        {formatActions.map((action) => (
          <Button
            key={action.label}
            variant="ghost"
            size="sm"
            onClick={action.action}
            title={action.label}
          >
            <action.icon className="h-4 w-4" />
          </Button>
        ))}

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Link */}
        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" title="Insert Link">
              <LinkIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert Link</DialogTitle>
              <DialogDescription>Add a hyperlink to your text</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Link Text</Label>
                <Input
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Click here"
                />
              </div>
              <div>
                <Label>URL</Label>
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <Button onClick={insertLink} className="w-full">
                Insert Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image */}
        <Button
          variant="ghost"
          size="sm"
          onClick={insertImage}
          title="Insert Image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Preview Toggle */}
        <Button
          variant={previewMode ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setPreviewMode(!previewMode)}
          title="Toggle Preview"
        >
          <Eye className="h-4 w-4" />
        </Button>

        {onSave && (
          <>
            <Separator orientation="vertical" className="h-6 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onSave}
              title="Save"
            >
              <Save className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Editor/Preview */}
      <Tabs value={previewMode ? 'preview' : 'edit'} className="w-full">
        <TabsContent value="edit" className="m-0">
          <Textarea
            id="rich-editor"
            value={content}
            onChange={(e) => updateContent(e.target.value)}
            placeholder={placeholder}
            className="border-0 resize-none focus-visible:ring-0 font-mono text-sm"
            style={{ minHeight }}
          />
        </TabsContent>
        <TabsContent value="preview" className="m-0">
          <div
            className="p-4 prose prose-sm max-w-none dark:prose-invert"
            style={{ minHeight }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        </TabsContent>
      </Tabs>

      {/* Status Bar */}
      <div className="bg-muted/30 px-3 py-1 border-t text-xs text-muted-foreground flex items-center justify-between">
        <div>
          {content.length} characters · {content.split(/\s+/).filter(w => w).length} words
        </div>
        <div>
          Markdown supported
        </div>
      </div>
    </div>
  )
}






























