/**
 * Family Health History Dialog
 * Add/Edit family health history entries
 */

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useDomainCRUD } from '@/lib/hooks/use-domain-crud'
import { Loader2 } from 'lucide-react'

interface FamilyHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FamilyHistoryDialog({ open, onOpenChange }: FamilyHistoryDialogProps) {
  const { create } = useDomainCRUD('health')
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    condition: '',
    relation: '',
    ageAtDiagnosis: '',
    notes: '',
  })

  async function handleSave() {
    if (!formData.condition || !formData.relation) {
      return
    }

    try {
      setSaving(true)
      await create({
        domain: 'health',
        title: `${formData.condition} (${formData.relation})`,
        metadata: {
          logType: 'family_history',
          condition: formData.condition,
          relation: formData.relation,
          ageAtDiagnosis: formData.ageAtDiagnosis ? parseInt(formData.ageAtDiagnosis) : null,
          notes: formData.notes,
        },
      })
      
      // Reset form
      setFormData({
        condition: '',
        relation: '',
        ageAtDiagnosis: '',
        notes: '',
      })
      
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Family Health History</DialogTitle>
          <DialogDescription>Track hereditary health conditions in your family</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="condition">Condition/Disease</Label>
            <Input
              id="condition"
              placeholder="e.g., Heart Disease, Diabetes"
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relation">Relation</Label>
            <Select value={formData.relation} onValueChange={(value) => setFormData({ ...formData, relation: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select relation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mother">Mother</SelectItem>
                <SelectItem value="Father">Father</SelectItem>
                <SelectItem value="Sister">Sister</SelectItem>
                <SelectItem value="Brother">Brother</SelectItem>
                <SelectItem value="Maternal Grandmother">Maternal Grandmother</SelectItem>
                <SelectItem value="Maternal Grandfather">Maternal Grandfather</SelectItem>
                <SelectItem value="Paternal Grandmother">Paternal Grandmother</SelectItem>
                <SelectItem value="Paternal Grandfather">Paternal Grandfather</SelectItem>
                <SelectItem value="Aunt">Aunt</SelectItem>
                <SelectItem value="Uncle">Uncle</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age at Diagnosis</Label>
            <Input
              id="age"
              type="number"
              placeholder="e.g., 55"
              value={formData.ageAtDiagnosis}
              onChange={(e) => setFormData({ ...formData, ageAtDiagnosis: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any relevant details..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving || !formData.condition || !formData.relation}
            className="bg-red-600 hover:bg-red-700"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Add History'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


