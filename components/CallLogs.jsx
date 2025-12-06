'use client'

import { useState, useEffect } from 'react'
import { Phone, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function CallLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/calls')
      
      if (!response.ok) {
        throw new Error('Failed to fetch call logs')
      }

      const data = await response.json()
      
      if (data.success) {
        setLogs(data.calls || [])
      } else {
        throw new Error(data.error || 'Unknown error')
      }
    } catch (err) {
      console.error('Error fetching logs:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchLogs, 10000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'started':
      case 'active':
        return <AlertCircle className="h-5 w-5 text-blue-500 animate-pulse" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'started':
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A'
    
    try {
      const date = new Date(timestamp)
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return timestamp
    }
  }

  const formatDuration = (duration) => {
    if (!duration || duration === 0) return '-'
    
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    
    return minutes > 0 
      ? `${minutes}m ${seconds}s` 
      : `${seconds}s`
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Phone className="h-6 w-6 text-cyan-600" />
          <h2 className="text-2xl font-bold text-gray-900">Call Logs</h2>
          {logs.length > 0 && (
            <span className="px-3 py-1 bg-cyan-100 text-cyan-800 rounded-full text-sm font-medium">
              {logs.length} {logs.length === 1 ? 'call' : 'calls'}
            </span>
          )}
        </div>
        
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Loading State */}
      {loading && logs.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && logs.length === 0 && !error && (
        <div className="text-center py-12">
          <Phone className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No calls yet</h3>
          <p className="text-gray-600">
            Call logs will appear here after you make your first call
          </p>
        </div>
      )}

      {/* Logs Table */}
      {!loading && logs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Call ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">To</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Time</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Duration</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log, index) => (
                <tr 
                  key={log.id || index}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Call ID */}
                  <td className="py-4 px-4">
                    <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {log.callId?.substring(0, 12) || log.id?.substring(0, 12) || 'N/A'}
                    </span>
                  </td>
                  
                  {/* To */}
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-900">
                      {log.to || 'Unknown'}
                    </span>
                  </td>
                  
                  {/* Status */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(log.status)}`}>
                        {log.status || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  
                  {/* Time */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{formatTime(log.timestamp)}</span>
                    </div>
                  </td>
                  
                  {/* Duration */}
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-700">
                      {formatDuration(log.duration)}
                    </span>
                  </td>
                  
                  {/* Notes */}
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600 max-w-xs truncate block">
                      {log.notes || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      {logs.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Auto-refreshes every 10 seconds • Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  )
}







