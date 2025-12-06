'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Home, AlertCircle, Clock, DollarSign, CheckCircle, Wrench, 
  FileText, Calendar, Plus, Filter, Search, Package, Users,
  TrendingUp, AlertTriangle, Shield, MapPin, Star, Phone, Mail,
  Edit, Trash2, MoreVertical, List, Grid, LayoutGrid, Eye
} from 'lucide-react'
// eslint-disable-next-line no-restricted-imports -- Legacy component, migration to useDomainCRUD planned
import { useData } from '@/lib/providers/data-provider'
import { format, differenceInDays, isAfter, isBefore, parseISO, addDays } from 'date-fns'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { AddDataDialog } from './add-data-dialog'
import { PropertyFormWithZillow } from './property-form-with-zillow'

interface HomeManagementDashboardProps {
  onAddItem?: (type: string) => void
}

export function HomeManagementDashboard({ onAddItem }: HomeManagementDashboardProps) {
  const { data } = useData()
  const homeItems = data.home || []
  
  const [activeTab, setActiveTab] = useState('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false)

  // Categorize items
  const categorizedItems = useMemo(() => {
    const maintenanceTasks = homeItems.filter(item => item.metadata?.itemType === 'Maintenance Task')
    const assets = homeItems.filter(item => item.metadata?.itemType === 'Asset/Warranty')
    const projects = homeItems.filter(item => item.metadata?.itemType === 'Project')
    const properties = homeItems.filter(item => item.metadata?.itemType === 'Property')
    const documents = homeItems.filter(item => item.metadata?.itemType === 'Document')
    const providers = homeItems.filter(item => item.metadata?.itemType === 'Service Provider')
    
    return { maintenanceTasks, assets, projects, properties, documents, providers }
  }, [homeItems])

  // Dashboard statistics
  const stats = useMemo(() => {
    const today = new Date()
    const { maintenanceTasks, assets, projects } = categorizedItems
    
    // Overdue tasks
    const overdue = maintenanceTasks.filter(task => {
      if (!task.metadata?.dueDate || typeof task.metadata.dueDate !== 'string') return false
      const status = task.metadata?.status
      if (status === 'Completed' || status === 'Cancelled') return false
      return isBefore(new Date(task.metadata.dueDate as string), today)
    }).length
    
    // Due this week
    const dueThisWeek = maintenanceTasks.filter(task => {
      if (!task.metadata?.dueDate || typeof task.metadata.dueDate !== 'string') return false
      const status = task.metadata?.status
      if (status === 'Completed' || status === 'Cancelled') return false
      const dueDate = new Date(task.metadata.dueDate as string)
      const daysUntil = differenceInDays(dueDate, today)
      return daysUntil >= 0 && daysUntil <= 7
    }).length
    
    // Due this month
    const dueThisMonth = maintenanceTasks.filter(task => {
      if (!task.metadata?.dueDate || typeof task.metadata.dueDate !== 'string') return false
      const status = task.metadata?.status
      if (status === 'Completed' || status === 'Cancelled') return false
      const dueDate = new Date(task.metadata.dueDate as string)
      const daysUntil = differenceInDays(dueDate, today)
      return daysUntil >= 0 && daysUntil <= 30
    }).length
    
    // Expiring warranties
    const expiringWarranties = assets.filter(asset => {
      if (!asset.metadata?.warrantyExpires || typeof asset.metadata.warrantyExpires !== 'string') return false
      const expires = new Date(asset.metadata.warrantyExpires as string)
      const daysUntil = differenceInDays(expires, today)
      return daysUntil >= 0 && daysUntil <= 90
    }).length
    
    // YTD maintenance costs
    const ytdCosts = maintenanceTasks.reduce((sum, task) => {
      const cost = parseFloat((task.metadata?.cost || task.metadata?.actualCost || '0') as string)
      const completedDate = task.metadata?.completedDate || task.metadata?.paidDate
      if (completedDate && typeof completedDate === 'string') {
        const year = new Date(completedDate as string).getFullYear()
        if (year === today.getFullYear()) {
          return sum + cost
        }
      }
      return sum
    }, 0)
    
    // Active projects
    const activeProjects = projects.filter(p => 
      p.metadata?.projectStatus === 'In Progress' || p.metadata?.projectStatus === 'Planning'
    ).length
    
    return { overdue, dueThisWeek, dueThisMonth, expiringWarranties, ytdCosts, activeProjects }
  }, [categorizedItems])

  // Filtered items
  const filteredItems = useMemo(() => {
    let items = [...homeItems]
    
    if (searchTerm) {
      items = items.filter(item => 
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof item.metadata?.location === 'string' && item.metadata.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (typeof item.metadata?.category === 'string' && item.metadata.category.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }
    
    if (filterCategory !== 'all') {
      items = items.filter(item => item.metadata?.category === filterCategory)
    }
    
    if (filterStatus !== 'all') {
      items = items.filter(item => item.metadata?.status === filterStatus)
    }
    
    return items
  }, [homeItems, searchTerm, filterCategory, filterStatus])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'text-red-500 bg-red-50 dark:bg-red-950'
      case 'High': return 'text-orange-500 bg-orange-50 dark:bg-orange-950'
      case 'Medium': return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950'
      case 'Low': return 'text-green-500 bg-green-50 dark:bg-green-950'
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-950'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-500'
      case 'In Progress': return 'bg-blue-500'
      case 'Overdue': return 'bg-red-500'
      case 'Pending': return 'bg-yellow-500'
      case 'On Hold': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'Excellent': return 'bg-green-500'
      case 'Good': return 'bg-blue-500'
      case 'Fair': return 'bg-yellow-500'
      case 'Poor': return 'bg-orange-500'
      case 'Needs Repair': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Home className="h-8 w-8 text-orange-500" />
            Home Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive maintenance, assets, projects, and documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={() => setPropertyDialogOpen(true)}>
            <Home className="h-4 w-4 mr-2" />
            Add Property
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Other
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="properties">Properties</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
        </TabsList>

        {/* DASHBOARD TAB */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* At-a-Glance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Card className={cn("border-2", stats.overdue > 0 ? "border-red-500" : "")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                    <p className="text-3xl font-bold text-red-500">{stats.overdue}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className={cn("border-2", stats.dueThisWeek > 0 ? "border-yellow-500" : "")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Due This Week</p>
                    <p className="text-3xl font-bold text-yellow-500">{stats.dueThisWeek}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Due This Month</p>
                    <p className="text-3xl font-bold text-blue-500">{stats.dueThisMonth}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className={cn("border-2", stats.expiringWarranties > 0 ? "border-orange-500" : "")}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Expiring Warranties</p>
                    <p className="text-3xl font-bold text-orange-500">{stats.expiringWarranties}</p>
                  </div>
                  <Shield className="h-8 w-8 text-orange-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Next 90 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">YTD Costs</p>
                    <p className="text-3xl font-bold text-green-500">${stats.ytdCosts.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Total spent {new Date().getFullYear()}</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link href="/domains/home">
                  <Button variant="outline" className="w-full h-20 flex-col">
                    <Wrench className="h-6 w-6 mb-2" />
                    Add Maintenance
                  </Button>
                </Link>
                <Link href="/domains/home">
                  <Button variant="outline" className="w-full h-20 flex-col">
                    <TrendingUp className="h-6 w-6 mb-2" />
                    Log Project
                  </Button>
                </Link>
                <Link href="/domains/home">
                  <Button variant="outline" className="w-full h-20 flex-col">
                    <Package className="h-6 w-6 mb-2" />
                    Add Asset
                  </Button>
                </Link>
                <Link href="/domains/home">
                  <Button variant="outline" className="w-full h-20 flex-col">
                    <FileText className="h-6 w-6 mb-2" />
                    Save Document
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity / Upcoming Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categorizedItems.maintenanceTasks
                    .filter(task => {
                      const status = task.metadata?.status
                      return status !== 'Completed' && status !== 'Cancelled' && task.metadata?.dueDate && typeof task.metadata.dueDate === 'string'
                    })
                    .sort((a, b) => {
                      const dateA = new Date((a.metadata?.dueDate as string) || 0)
                      const dateB = new Date((b.metadata?.dueDate as string) || 0)
                      return dateA.getTime() - dateB.getTime()
                    })
                    .slice(0, 5)
                    .map(task => {
                      const dueDate = new Date(task.metadata?.dueDate as string)
                      const daysUntil = differenceInDays(dueDate, new Date())
                      const isOverdue = daysUntil < 0
                      
                      return (
                        <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full", getStatusColor((task.metadata?.status as string) || 'Pending'))} />
                              <span className="font-medium">{task.title}</span>
                              <Badge variant="outline" className={getPriorityColor((task.metadata?.priority as string) || 'Medium')}>
                                {String((task.metadata?.priority as string) || 'Medium')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              {typeof task.metadata?.location === 'string' && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {task.metadata.location}
                                </span>
                              )}
                              <span className={cn(isOverdue && "text-red-500 font-medium")}>
                                {isOverdue 
                                  ? `Overdue by ${Math.abs(daysUntil)} ${Math.abs(daysUntil) === 1 ? 'day' : 'days'}`
                                  : daysUntil === 0
                                  ? 'Due today'
                                  : `Due in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`
                                }
                              </span>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  {categorizedItems.maintenanceTasks.filter(t => t.metadata?.dueDate && t.metadata?.status !== 'Completed').length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No upcoming tasks</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Active Projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {categorizedItems.projects
                    .filter(p => p.metadata?.projectStatus === 'In Progress' || p.metadata?.projectStatus === 'Planning')
                    .slice(0, 5)
                    .map(project => (
                      <div key={project.id} className="p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{project.title}</span>
                          <Badge variant="outline">{String(project.metadata?.projectStatus || 'Planning')}</Badge>
                        </div>
                        {project.metadata?.progressPercent !== undefined && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{String(project.metadata.progressPercent)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${project.metadata.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                        {typeof project.metadata?.budget === 'string' && (
                          <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                            <span>Budget: ${parseFloat(project.metadata.budget).toLocaleString()}</span>
                            {typeof project.metadata?.actualCost === 'string' && (
                              <span>Spent: ${parseFloat(project.metadata.actualCost).toLocaleString()}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  {categorizedItems.projects.filter(p => p.metadata?.projectStatus === 'In Progress' || p.metadata?.projectStatus === 'Planning').length === 0 && (
                    <p className="text-center text-muted-foreground py-8">No active projects</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MAINTENANCE TAB */}
        <TabsContent value="maintenance" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search tasks..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Appliances">Appliances</SelectItem>
                    <SelectItem value="Structure">Structure</SelectItem>
                    <SelectItem value="Landscaping">Landscaping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Tasks List */}
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Tasks ({categorizedItems.maintenanceTasks.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {categorizedItems.maintenanceTasks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    No maintenance tasks yet. Add your first task to get started!
                  </p>
                ) : (
                  categorizedItems.maintenanceTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={cn("w-3 h-3 rounded-full", getStatusColor((task.metadata?.status as string) || 'Pending'))} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{task.title}</span>
                            {task.metadata?.recurring === true && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {String(task.metadata?.frequency || 'Monthly')}
                              </Badge>
                            )}
                            <Badge variant="outline" className={cn("text-xs", getPriorityColor((task.metadata?.priority as string) || 'Medium'))}>
                              {String((task.metadata?.priority as string) || 'Medium')}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            {typeof task.metadata?.category === 'string' && (
                              <span>{task.metadata.category}</span>
                            )}
                            {typeof task.metadata?.location === 'string' && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {task.metadata.location}
                              </span>
                            )}
                            {typeof task.metadata?.dueDate === 'string' && (
                              <span>Due: {format(new Date(task.metadata.dueDate), 'MMM dd, yyyy')}</span>
                            )}
                            {typeof task.metadata?.cost === 'string' && (
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${parseFloat(task.metadata.cost).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.metadata?.status !== 'Completed' && (
                          <Button variant="outline" size="sm">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ASSETS TAB */}
        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assets & Warranties ({categorizedItems.assets.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("grid gap-4", viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
                {categorizedItems.assets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12 col-span-full">
                    No assets tracked yet. Add appliances, systems, and equipment to track warranties and maintenance!
                  </p>
                ) : (
                  categorizedItems.assets.map(asset => {
                    const warrantyExpires = asset.metadata?.warrantyExpires
                    const daysUntilExpiry = warrantyExpires && typeof warrantyExpires === 'string' ? differenceInDays(new Date(warrantyExpires as string), new Date()) : null
                    const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 90
                    
                    return (
                      <Card key={asset.id} className={cn(isExpiringSoon && "border-2 border-orange-500")}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Package className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium">{asset.title}</span>
                            </div>
                            {typeof asset.metadata?.condition === 'string' && (
                              <div className={cn("w-3 h-3 rounded-full", getConditionColor(asset.metadata.condition))} title={asset.metadata.condition} />
                            )}
                          </div>
                          <div className="space-y-2 text-sm">
                            {typeof asset.metadata?.manufacturer === 'string' && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Brand:</span>
                                <span>{asset.metadata.manufacturer}</span>
                              </div>
                            )}
                            {typeof asset.metadata?.purchaseDate === 'string' && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Purchased:</span>
                                <span>{format(new Date(asset.metadata.purchaseDate), 'MMM yyyy')}</span>
                              </div>
                            )}
                            {typeof warrantyExpires === 'string' && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Warranty:</span>
                                <span className={cn(isExpiringSoon && "text-orange-500 font-medium")}>
                                  {daysUntilExpiry !== null && daysUntilExpiry < 0 
                                    ? 'Expired'
                                    : daysUntilExpiry === 0
                                    ? 'Expires today'
                                    : `${daysUntilExpiry} days left`
                                  }
                                </span>
                              </div>
                            )}
                            {typeof asset.metadata?.location === 'string' && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Location:</span>
                                <span>{asset.metadata.location}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROJECTS TAB */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Projects ({categorizedItems.projects.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categorizedItems.projects.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12">
                    No projects yet. Track home improvement projects, repairs, and renovations!
                  </p>
                ) : (
                  categorizedItems.projects.map(project => (
                    <Card key={project.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium text-lg">{project.title}</h3>
                            {typeof project.metadata?.category === 'string' && (
                              <Badge variant="outline" className="mt-1">{project.metadata.category}</Badge>
                            )}
                          </div>
                          <Badge>{String(project.metadata?.projectStatus || 'Planning')}</Badge>
                        </div>
                        
                        {project.metadata?.progressPercent !== undefined && (
                          <div className="mb-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{String(project.metadata.progressPercent)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${project.metadata.progressPercent}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          {typeof project.metadata?.startDate === 'string' && (
                            <div>
                              <span className="text-muted-foreground">Start:</span>
                              <p className="font-medium">{format(new Date(project.metadata.startDate), 'MMM dd, yyyy')}</p>
                            </div>
                          )}
                          {typeof project.metadata?.targetDate === 'string' && (
                            <div>
                              <span className="text-muted-foreground">Target:</span>
                              <p className="font-medium">{format(new Date(project.metadata.targetDate), 'MMM dd, yyyy')}</p>
                            </div>
                          )}
                          {typeof project.metadata?.budget === 'string' && (
                            <div>
                              <span className="text-muted-foreground">Budget:</span>
                              <p className="font-medium">${parseFloat(project.metadata.budget).toLocaleString()}</p>
                            </div>
                          )}
                          {typeof project.metadata?.actualCost === 'string' && (
                            <div>
                              <span className="text-muted-foreground">Spent:</span>
                              <p className="font-medium text-green-500">${parseFloat(project.metadata.actualCost).toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                        
                        {typeof project.metadata?.notes === 'string' && (
                          <p className="text-sm text-muted-foreground mt-3">{project.metadata.notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROPERTIES TAB */}
        <TabsContent value="properties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Properties & Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="properties" className="w-full">
                <TabsList>
                  <TabsTrigger value="properties">Properties</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
                
                <TabsContent value="properties" className="space-y-4 mt-4">
                  {categorizedItems.properties.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">
                      No properties added. Track your primary residence, rental properties, and investments!
                    </p>
                  ) : (
                    categorizedItems.properties.map(property => (
                      <Card key={property.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-medium text-lg flex items-center gap-2">
                                <Home className="h-5 w-5" />
                                {property.title}
                              </h3>
                              {typeof property.metadata?.propertyType === 'string' && (
                                <Badge variant="outline" className="mt-1">{property.metadata.propertyType}</Badge>
                              )}
                            </div>
                          </div>
                          {typeof property.metadata?.propertyAddress === 'string' && (
                            <p className="text-sm text-muted-foreground mb-3">{property.metadata.propertyAddress}</p>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            {typeof property.metadata?.currentValue === 'string' && (
                              <div>
                                <span className="text-muted-foreground">Value:</span>
                                <p className="font-medium text-green-500">${parseFloat(property.metadata.currentValue).toLocaleString()}</p>
                              </div>
                            )}
                            {typeof property.metadata?.mortgageBalance === 'string' && (
                              <div>
                                <span className="text-muted-foreground">Mortgage:</span>
                                <p className="font-medium">${parseFloat(property.metadata.mortgageBalance).toLocaleString()}</p>
                              </div>
                            )}
                            {typeof property.metadata?.squareFeet === 'string' && (
                              <div>
                                <span className="text-muted-foreground">Size:</span>
                                <p className="font-medium">{parseFloat(property.metadata.squareFeet).toLocaleString()} sq ft</p>
                              </div>
                            )}
                            {typeof property.metadata?.yearBuilt === 'string' && (
                              <div>
                                <span className="text-muted-foreground">Built:</span>
                                <p className="font-medium">{property.metadata.yearBuilt}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
                
                <TabsContent value="documents" className="space-y-2 mt-4">
                  {categorizedItems.documents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-12">
                      No documents saved. Store deeds, titles, warranties, and important paperwork!
                    </p>
                  ) : (
                    categorizedItems.documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.title}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {typeof doc.metadata?.documentType === 'string' && (
                                <Badge variant="outline" className="text-xs">{doc.metadata.documentType}</Badge>
                              )}
                              {typeof doc.metadata?.expirationDate === 'string' && (
                                <span>Expires: {format(new Date(doc.metadata.expirationDate), 'MMM dd, yyyy')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {typeof doc.metadata?.documentUrl === 'string' && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={doc.metadata.documentUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROVIDERS TAB */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Providers ({categorizedItems.providers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("grid gap-4", viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
                {categorizedItems.providers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12 col-span-full">
                    No service providers saved. Add plumbers, electricians, contractors you trust!
                  </p>
                ) : (
                  categorizedItems.providers.map(provider => (
                    <Card key={provider.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-medium">{provider.title}</h3>
                            {typeof provider.metadata?.serviceType === 'string' && (
                              <Badge variant="outline" className="mt-1">{provider.metadata.serviceType}</Badge>
                            )}
                          </div>
                          {typeof provider.metadata?.rating === 'number' && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm font-medium">{provider.metadata.rating}/5</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2 text-sm">
                          {typeof provider.metadata?.contactPhone === 'string' && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <a href={`tel:${provider.metadata.contactPhone}`} className="hover:text-primary">
                                {provider.metadata.contactPhone}
                              </a>
                            </div>
                          )}
                          {typeof provider.metadata?.contactEmail === 'string' && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <a href={`mailto:${provider.metadata.contactEmail}`} className="hover:text-primary">
                                {provider.metadata.contactEmail}
                              </a>
                            </div>
                          )}
                          {typeof provider.metadata?.lastServiceDate === 'string' && (
                            <div className="text-xs text-muted-foreground mt-2">
                              Last service: {format(new Date(provider.metadata.lastServiceDate), 'MMM dd, yyyy')}
                            </div>
                          )}
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-3">
                          Book Again
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Property Dialog with Zillow */}
      <PropertyFormWithZillow 
        open={propertyDialogOpen}
        onClose={() => setPropertyDialogOpen(false)}
      />
      
      {/* Add Data Dialog for Other Items */}
      <AddDataDialog 
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
      />
    </div>
  )
}

