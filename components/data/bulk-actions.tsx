'use client'

import { useState } from 'react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckSquare, Trash2, Tag, Download, Upload, Copy,
  Archive, Calendar, Flag, FolderOpen, Edit
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface BulkActionsProps {
  items: any[]
  selectedItems: string[]
  onSelectionChange: (selected: string[]) => void
  dataType: string // 'tasks', 'bills', 'goals', etc.
  onUpdate: () => void
}

export function BulkActions({
  items,
  selectedItems,
  onSelectionChange,
  dataType,
  onUpdate
}: BulkActionsProps) {
  const { addData, updateData, deleteData, getData } = useData()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<string>('')
  const [bulkEditField, setBulkEditField] = useState<string>('')
  const [bulkEditValue, setBulkEditValue] = useState<string>('')

  const allSelected = items.length > 0 && selectedItems.length === items.length
  const someSelected = selectedItems.length > 0 && selectedItems.length < items.length

  const toggleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([])
    } else {
      onSelectionChange(items.map(item => item.id))
    }
  }

  const toggleItem = (id: string) => {
    if (selectedItems.includes(id)) {
      onSelectionChange(selectedItems.filter(i => i !== id))
    } else {
      onSelectionChange([...selectedItems, id])
    }
  }

  const confirmBulkAction = (action: string) => {
    setConfirmAction(action)
    setIsConfirmOpen(true)
  }

  const executeBulkAction = async () => {
    const domain = dataType as any
    const data = (getData(domain) || []) as any[]

    switch (confirmAction) {
      case 'delete': {
        await Promise.all(selectedItems.map(id => deleteData(domain, id)))
        break
      }

      case 'complete': {
        await Promise.all(data.filter((item: any) => selectedItems.includes(item.id)).map((item: any) => updateData(domain, item.id, { ...item, completed: true })))
        break
      }

      case 'archive': {
        await Promise.all(data.filter((item: any) => selectedItems.includes(item.id)).map((item: any) => updateData(domain, item.id, { ...item, archived: true })))
        break
      }

      case 'duplicate': {
        const duplicates = data.filter((item: any) => selectedItems.includes(item.id))
          .map((item: any) => ({
            title: `${item.title} (Copy)`,
            description: item.description,
            metadata: item.metadata
          }))
        await Promise.all(duplicates.map((dup: any) => addData(domain, dup)))
        break
      }

      case 'export':
        exportSelected(data.filter((item: any) => selectedItems.includes(item.id)))
        break

      case 'edit': {
        if (bulkEditField && bulkEditValue) {
          await Promise.all(data.filter((item: any) => selectedItems.includes(item.id)).map((item: any) => updateData(domain, item.id, { ...item, [bulkEditField]: bulkEditValue })))
        }
        break
      }
    }

    onSelectionChange([])
    setIsConfirmOpen(false)
    onUpdate()
  }

  const exportSelected = (selectedData: any[]) => {
    const dataStr = JSON.stringify(selectedData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `${dataType}-export-${new Date().toISOString().split('T')[0]}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)
        const domain = dataType as any
        Promise.all(
          importedData.map((item: any) => addData(domain, {
            title: item.title || item.name,
            description: item.description,
            metadata: item.metadata || item
          }))
        ).then(onUpdate)
      } catch (error) {
        console.error('Import failed:', error)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-4">
      {/* Selection Controls */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={allSelected || someSelected}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm font-medium">
            {selectedItems.length > 0 ? (
              <>{selectedItems.length} selected</>
            ) : (
              <>Select all</>
            )}
          </span>
        </div>

        {selectedItems.length > 0 && (
          <div className="flex items-center gap-2">
            {/* Bulk Actions */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Edit {selectedItems.length} Items</DialogTitle>
                  <DialogDescription>
                    Update a field for all selected items at once
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label>Field to Update</Label>
                    <Select value={bulkEditField} onValueChange={setBulkEditField}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="priority">Priority</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="category">Category</SelectItem>
                        <SelectItem value="tags">Tags</SelectItem>
                        <SelectItem value="dueDate">Due Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>New Value</Label>
                    <Input
                      value={bulkEditValue}
                      onChange={(e) => setBulkEditValue(e.target.value)}
                      placeholder="Enter new value"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      confirmBulkAction('edit')
                    }}
                    className="w-full"
                  >
                    Apply to {selectedItems.length} Items
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              onClick={() => confirmBulkAction('complete')}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Complete
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => confirmBulkAction('duplicate')}
            >
              <Copy className="h-4 w-4 mr-2" />
              Duplicate
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => confirmBulkAction('archive')}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => confirmBulkAction('export')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => confirmBulkAction('delete')}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}

        {selectedItems.length === 0 && (
          <div>
            <label htmlFor="import-file">
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </span>
              </Button>
            </label>
            <input
              id="import-file"
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Item List with Checkboxes */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
              selectedItems.includes(item.id) ? 'bg-primary/5 border-primary' : ''
            }`}
          >
            <Checkbox
              checked={selectedItems.includes(item.id)}
              onCheckedChange={() => toggleItem(item.id)}
            />
            <div className="flex-1">
              <div className="font-medium">{item.title || item.name}</div>
              {item.description && (
                <div className="text-sm text-muted-foreground line-clamp-1">
                  {item.description}
                </div>
              )}
            </div>
            {item.priority && (
              <Badge variant={
                item.priority === 'high' ? 'destructive' :
                item.priority === 'medium' ? 'default' :
                'secondary'
              }>
                {item.priority}
              </Badge>
            )}
            {item.amount && (
              <span className="font-semibold">${item.amount}</span>
            )}
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Action</DialogTitle>
            <DialogDescription>
              Are you sure you want to {confirmAction} {selectedItems.length} items?
              {confirmAction === 'delete' && ' This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <AlertDescription>
              <strong>{selectedItems.length}</strong> items will be affected
            </AlertDescription>
          </Alert>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={confirmAction === 'delete' ? 'destructive' : 'default'}
              onClick={executeBulkAction}
            >
              Confirm {confirmAction}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

