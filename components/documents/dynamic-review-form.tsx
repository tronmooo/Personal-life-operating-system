'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle2, AlertCircle, AlertTriangle, Edit2, Save, X,
  ChevronDown, ChevronUp, Eye, EyeOff
} from 'lucide-react'
import { ExtractedField } from '@/lib/ai/enhanced-document-extractor'
import {
  categorizeFieldsByConfidence,
  groupFieldsByCategory,
  formatFieldValue,
  getConfidenceBadgeColor,
  getConfidenceLabel,
  humanizeFieldName,
  getFieldIcon,
  FieldWithName
} from '@/lib/utils/field-utils'

interface DynamicReviewFormProps {
  extractedFields: Record<string, ExtractedField>
  documentType: string
  documentTitle: string
  summary: string
  onSave: (fields: Record<string, any>) => void
  onCancel?: () => void
}

export function DynamicReviewForm({
  extractedFields,
  documentType,
  documentTitle,
  summary,
  onSave,
  onCancel
}: DynamicReviewFormProps) {
  const [editedFields, setEditedFields] = useState<Record<string, any>>(() => {
    // Initialize with extracted values
    const initial: Record<string, any> = {}
    Object.entries(extractedFields).forEach(([name, field]) => {
      initial[name] = field.value
    })
    return initial
  })
  const [editMode, setEditMode] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'Key Information': true,
    'Dates': true,
    'Financial': true,
  })

  const categorized = categorizeFieldsByConfidence(extractedFields)
  const grouped = groupFieldsByCategory(extractedFields)

  const totalFields = Object.keys(extractedFields).length
  const highConfidenceCount = categorized.highConfidence.length
  const mediumConfidenceCount = categorized.mediumConfidence.length
  const lowConfidenceCount = categorized.lowConfidence.length

  const handleFieldChange = (fieldName: string, value: any) => {
    setEditedFields(prev => ({ ...prev, [fieldName]: value }))
  }

  const handleSave = () => {
    onSave(editedFields)
  }

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Document Summary */}
      <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            {documentTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="capitalize">{documentType}</Badge>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
              {totalFields} fields extracted
            </Badge>
          </div>
          
          <p className="text-sm text-muted-foreground">{summary}</p>

          {/* Confidence Summary */}
          <div className="flex flex-wrap gap-2 pt-2">
            {highConfidenceCount > 0 && (
              <Badge className={getConfidenceBadgeColor(0.9)}>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {highConfidenceCount} high confidence
              </Badge>
            )}
            {mediumConfidenceCount > 0 && (
              <Badge className={getConfidenceBadgeColor(0.6)}>
                <AlertCircle className="h-3 w-3 mr-1" />
                {mediumConfidenceCount} medium confidence
              </Badge>
            )}
            {lowConfidenceCount > 0 && (
              <Badge className={getConfidenceBadgeColor(0.3)}>
                <AlertTriangle className="h-3 w-3 mr-1" />
                {lowConfidenceCount} need review
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Low Confidence Alert */}
      {lowConfidenceCount > 0 && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-300">
            <strong>{lowConfidenceCount} fields</strong> have low confidence. Please review and correct if needed.
          </AlertDescription>
        </Alert>
      )}

      {/* Edit Mode Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant={editMode ? "default" : "outline"}
          onClick={() => setEditMode(!editMode)}
          size="sm"
        >
          {editMode ? (
            <>
              <Eye className="h-4 w-4 mr-2" />
              View Mode
            </>
          ) : (
            <>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Fields
            </>
          )}
        </Button>
        
        {editMode && (
          <span className="text-sm text-muted-foreground">
            Click any field to edit its value
          </span>
        )}
      </div>

      {/* Grouped Fields */}
      {Object.entries(grouped).map(([categoryName, fields]) => (
        <Card key={categoryName}>
          <CardHeader
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => toggleSection(categoryName)}
          >
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getCategoryIcon(categoryName)}</span>
                <span>{categoryName}</span>
                <Badge variant="outline">{fields.length}</Badge>
              </div>
              {expandedSections[categoryName] ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </CardTitle>
          </CardHeader>
          
          {expandedSections[categoryName] && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => (
                  <DynamicField
                    key={field.name}
                    field={field}
                    value={editedFields[field.name]}
                    editMode={editMode}
                    onChange={(value) => handleFieldChange(field.name, value)}
                  />
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-background pb-4">
        <Button onClick={handleSave} size="lg" className="flex-1">
          <Save className="h-5 w-5 mr-2" />
          Save Document
        </Button>
        {onCancel && (
          <Button onClick={onCancel} variant="outline" size="lg">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}

// Individual field component
interface DynamicFieldProps {
  field: FieldWithName
  value: any
  editMode: boolean
  onChange: (value: any) => void
}

function DynamicField({ field, value, editMode, onChange }: DynamicFieldProps) {
  const displayValue = value !== null && value !== undefined 
    ? formatFieldValue({ ...field, value }) 
    : ''

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={field.name} className="flex items-center gap-2">
          <span>{getFieldIcon(field.fieldType)}</span>
          <span>{field.label || humanizeFieldName(field.name)}</span>
        </Label>
        <Badge 
          variant="outline" 
          className={`text-xs ${getConfidenceBadgeColor(field.confidence)}`}
        >
          {Math.round(field.confidence * 100)}%
        </Badge>
      </div>

      {editMode ? (
        <Input
          id={field.name}
          type={getInputType(field.fieldType)}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={field.confidence < 0.5 ? 'border-yellow-500' : ''}
        />
      ) : (
        <div className={`p-2 rounded-md border bg-accent/50 ${
          field.confidence < 0.5 ? 'border-yellow-500' : ''
        }`}>
          <span className="text-sm font-medium">
            {displayValue || <span className="text-muted-foreground italic">Not found</span>}
          </span>
        </div>
      )}
      
      {field.confidence < 0.5 && !editMode && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          Low confidence - please verify
        </p>
      )}
    </div>
  )
}

// Helper functions
function getCategoryIcon(categoryName: string): string {
  const icons: Record<string, string> = {
    'Key Information': '🔑',
    'Dates': '📅',
    'Financial': '💰',
    'Contact Information': '📞',
    'Personal Information': '👤',
    'Other': '📄',
  }
  return icons[categoryName] || '📄'
}

function getInputType(fieldType: string): string {
  const types: Record<string, string> = {
    date: 'date',
    currency: 'number',
    number: 'number',
    email: 'email',
    phone: 'tel',
    text: 'text',
    address: 'text',
  }
  return types[fieldType] || 'text'
}




















