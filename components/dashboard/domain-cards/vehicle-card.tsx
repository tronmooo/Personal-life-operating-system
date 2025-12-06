'use client'

import { useEffect } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Car, Fuel, Wrench, Calendar, DollarSign, AlertTriangle,
  CheckCircle, Clock, TrendingUp, MapPin, Gauge, Shield
} from 'lucide-react'

interface VehicleCardProps {
  size: 'small' | 'medium' | 'large'
  data: any
}

export function VehicleCard({ size, data }: VehicleCardProps) {
  const vehicles = data?.vehicles || []
  const primaryVehicle = vehicles[0] || getDefaultVehicle()
  const maintenance = getMaintenance(primaryVehicle)
  const stats = getVehicleStats(vehicles)

  useEffect(() => {
    console.log('[VehicleCard] Component mounting')
    console.log('[VehicleCard] Props received:', { size, data })
    console.log('[VehicleCard] Hook data:', { vehicles })
  }, [size, data, vehicles])

  console.log('[VehicleCard] Rendering with values:', {
    size,
    vehiclesCount: vehicles.length,
    primaryVehicle,
    maintenance,
    stats,
  })

  if (size === 'small') {
    return (
      <Card className="h-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
        <CardContent className="p-4 flex flex-col justify-center h-full">
          <div className="flex items-center justify-between mb-2">
            <Car className="h-5 w-5 text-purple-600" />
            {maintenance.overdue > 0 && (
              <Badge variant="destructive" className="text-xs">
                {maintenance.overdue}
              </Badge>
            )}
          </div>
          <div>
            <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
              {vehicles.length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {vehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (size === 'medium') {
    return (
      <Card className="h-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Car className="h-5 w-5 text-purple-600" />
              Vehicles
            </div>
            <Badge variant={maintenance.overdue > 0 ? 'destructive' : 'outline'}>
              {vehicles.length} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Primary Vehicle Info */}
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-sm">{primaryVehicle.name}</span>
              <Badge variant="outline" className="text-xs">
                {primaryVehicle.year}
              </Badge>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {primaryVehicle.make} {primaryVehicle.model}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Gauge className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Mileage</span>
              </div>
              <p className="text-sm font-bold">{primaryVehicle.mileage.toLocaleString()}</p>
            </div>

            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Wrench className="h-3 w-3 text-orange-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Due Soon</span>
              </div>
              <p className="text-sm font-bold">{maintenance.upcoming}</p>
            </div>
          </div>

          {maintenance.overdue > 0 && (
            <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="h-3 w-3" />
              {maintenance.overdue} overdue maintenance item{maintenance.overdue > 1 ? 's' : ''}
            </div>
          )}

          <Button variant="outline" className="w-full" size="sm">
            <Wrench className="h-4 w-4 mr-2" />
            View Maintenance
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Large size - Full vehicle dashboard
  return (
    <Card className="h-full bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-purple-600" />
            Vehicle Management
          </div>
          <Badge variant="outline" className="flex items-center gap-1">
            <Car className="h-3 w-3" />
            {vehicles.length} Vehicle{vehicles.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Vehicle Summary */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg">{primaryVehicle.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {primaryVehicle.year} {primaryVehicle.make} {primaryVehicle.model}
              </p>
            </div>
            <div className="text-right">
              <Badge variant={primaryVehicle.status === 'active' ? 'default' : 'secondary'}>
                {primaryVehicle.status}
              </Badge>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Gauge className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Mileage</span>
              </div>
              <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {(primaryVehicle.mileage / 1000).toFixed(0)}k
              </p>
            </div>

            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Fuel className="h-3 w-3 text-green-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">MPG</span>
              </div>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                {primaryVehicle.mpg}
              </p>
            </div>

            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="h-3 w-3 text-purple-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Value</span>
              </div>
              <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                ${(primaryVehicle.value / 1000).toFixed(0)}k
              </p>
            </div>

            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-center gap-1 mb-1">
                <Shield className="h-3 w-3 text-orange-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Insurance</span>
              </div>
              <p className="text-lg font-bold text-orange-700 dark:text-orange-300">
                ${primaryVehicle.insuranceMonthly}
              </p>
            </div>
          </div>
        </div>

        {/* Maintenance Overview */}
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-orange-600" />
              <h3 className="font-semibold">Maintenance</h3>
            </div>
            {maintenance.overdue > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {maintenance.overdue} Overdue
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            {maintenance.items.map((item, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  item.status === 'overdue'
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : item.status === 'due-soon'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20'
                    : 'bg-gray-50 dark:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.status === 'overdue' ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : item.status === 'due-soon' ? (
                    <Clock className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {item.status === 'overdue'
                        ? `Overdue by ${item.overdueMiles.toLocaleString()} miles`
                        : `Due at ${item.dueMileage.toLocaleString()} miles`}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={
                    item.status === 'overdue'
                      ? 'destructive'
                      : item.status === 'due-soon'
                      ? 'outline'
                      : 'secondary'
                  }
                >
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Fleet Stats (if multiple vehicles) */}
        {vehicles.length > 1 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                ${stats.totalValue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Value</p>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {stats.avgMPG}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Avg MPG</p>
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                ${stats.monthlyInsurance}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Insurance/mo</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" className="w-full">
            <Fuel className="h-4 w-4 mr-2" />
            Log Fuel
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <Wrench className="h-4 w-4 mr-2" />
            Service
          </Button>
          <Button variant="outline" size="sm" className="w-full">
            <MapPin className="h-4 w-4 mr-2" />
            Trips
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper functions
function getDefaultVehicle() {
  return {
    id: 'default',
    name: 'Primary Vehicle',
    year: 2020,
    make: 'Toyota',
    model: 'Camry',
    mileage: 45000,
    mpg: 32,
    value: 22000,
    insuranceMonthly: 125,
    status: 'active',
  }
}

function getMaintenance(vehicle: any) {
  const currentMileage = vehicle.mileage || 0
  
  const items = [
    {
      name: 'Oil Change',
      dueMileage: Math.ceil((currentMileage + 2000) / 5000) * 5000,
      status: currentMileage % 5000 > 4500 ? 'due-soon' : currentMileage % 5000 > 5000 ? 'overdue' : 'ok',
      overdueMiles: Math.max(0, currentMileage - (Math.floor(currentMileage / 5000) * 5000 + 5000)),
    },
    {
      name: 'Tire Rotation',
      dueMileage: Math.ceil((currentMileage + 5000) / 10000) * 10000,
      status: currentMileage % 10000 > 9000 ? 'due-soon' : 'ok',
      overdueMiles: 0,
    },
    {
      name: 'Air Filter',
      dueMileage: Math.ceil((currentMileage + 10000) / 15000) * 15000,
      status: 'ok',
      overdueMiles: 0,
    },
  ]

  const overdue = items.filter(item => item.status === 'overdue').length
  const upcoming = items.filter(item => item.status === 'due-soon').length

  return { items, overdue, upcoming }
}

function getVehicleStats(vehicles: any[]) {
  if (!vehicles || vehicles.length === 0) {
    return {
      totalValue: 0,
      avgMPG: 0,
      monthlyInsurance: 0,
    }
  }

  return {
    totalValue: vehicles.reduce((sum, v) => sum + (v.value || 0), 0),
    avgMPG: Math.round(vehicles.reduce((sum, v) => sum + (v.mpg || 0), 0) / vehicles.length),
    monthlyInsurance: vehicles.reduce((sum, v) => sum + (v.insuranceMonthly || 0), 0),
  }
}


























