'use client'

import { MCPManagementUI } from '@/components/mcp/mcp-management-ui'

export default function ExternalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🔌 External Integrations
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage MCP (Model Context Protocol) servers and external tool integrations for your AI assistants
          </p>
        </div>

        {/* MCP Management UI */}
        <MCPManagementUI />
      </div>
    </div>
  )
}






















