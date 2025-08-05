'use client'

import { useState } from 'react'
import { Button } from '@admin-griffe/ui'
import { 
  BarChart3, 
  LineChart, 
  PieChart, 
  TrendingUp,
  Users,
  ShoppingBag,
  CreditCard,
  MapPin,
  Calendar,
  Maximize2
} from 'lucide-react'

export function ReportesBI() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedMetric, setSelectedMetric] = useState('revenue')

  // Mock BI data
  const revenueData = [
    { period: 'Ene', value: 3200000, growth: 12 },
    { period: 'Feb', value: 3800000, growth: 18 },
    { period: 'Mar', value: 4200000, growth: 10 },
    { period: 'Abr', value: 3900000, growth: -7 },
    { period: 'May', value: 4500000, growth: 15 },
    { period: 'Jun', value: 5100000, growth: 13 }
  ]

  const userGrowthData = [
    { period: 'Ene', nuevos: 1200, activos: 8500, retencion: 78 },
    { period: 'Feb', nuevos: 1450, activos: 9200, retencion: 82 },
    { period: 'Mar', nuevos: 1680, activos: 10100, retencion: 85 },
    { period: 'Abr', nuevos: 1320, activos: 9800, retencion: 79 },
    { period: 'May', nuevos: 1890, activos: 11200, retencion: 88 },
    { period: 'Jun', nuevos: 2100, activos: 12500, retencion: 91 }
  ]

  const categoryData = [
    { name: 'Moda', value: 35, amount: 8750000, color: 'bg-blue-500' },
    { name: 'Tecnología', value: 28, amount: 7000000, color: 'bg-green-500' },
    { name: 'Hogar', value: 18, amount: 4500000, color: 'bg-purple-500' },
    { name: 'Deportes', value: 12, amount: 3000000, color: 'bg-orange-500' },
    { name: 'Otros', value: 7, amount: 1750000, color: 'bg-gray-500' }
  ]

  const geographicData = [
    { region: 'Bogotá', sales: 12500000, stores: 342, growth: 15 },
    { region: 'Medellín', sales: 8900000, stores: 198, growth: 22 },
    { region: 'Cali', sales: 6700000, stores: 156, growth: 18 },
    { region: 'Barranquilla', sales: 4200000, stores: 89, growth: 12 },
    { region: 'Otras', sales: 7700000, stores: 462, growth: 8 }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const RevenueChart = () => {
    const maxValue = Math.max(...revenueData.map(d => d.value))
    
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Evolución de Ingresos</h3>
            <p className="text-sm text-gray-600">Últimos 6 meses</p>
          </div>
          <Button variant="outline" size="sm">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          {revenueData.map((data, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">{data.period}</span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-900">{formatCurrency(data.value)}</span>
                  <span className={`flex items-center gap-1 ${
                    data.growth > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className={`h-3 w-3 ${data.growth < 0 ? 'rotate-180' : ''}`} />
                    {Math.abs(data.growth)}%
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${(data.value / maxValue) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const UserGrowthChart = () => {
    const maxUsers = Math.max(...userGrowthData.map(d => d.activos))
    
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Crecimiento de Usuarios</h3>
            <p className="text-sm text-gray-600">Nuevos vs Activos</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Nuevos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Activos</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-end justify-between h-48 gap-2">
          {userGrowthData.map((data, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="w-full flex flex-col justify-end h-40 gap-1">
                <div 
                  className="bg-green-500 rounded-t transition-all duration-300"
                  style={{ height: `${(data.nuevos / 2500) * 100}%` }}
                  title={`${data.nuevos} nuevos usuarios`}
                ></div>
                <div 
                  className="bg-blue-500 rounded-t transition-all duration-300"
                  style={{ height: `${(data.activos / maxUsers) * 100}%` }}
                  title={`${data.activos} usuarios activos`}
                ></div>
              </div>
              <div className="mt-2 text-xs font-medium text-gray-600">{data.period}</div>
              <div className="text-xs text-gray-500">{data.retencion}%</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const CategoryChart = () => {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Ventas por Categoría</h3>
            <p className="text-sm text-gray-600">Distribución del mes actual</p>
          </div>
          <PieChart className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-40 h-40">
            <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 via-green-500 via-purple-500 via-orange-500 to-gray-500"></div>
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">100%</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {categoryData.map((category, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-4 h-4 rounded ${category.color}`}></div>
                <span className="text-sm font-medium">{category.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{category.value}%</div>
                <div className="text-xs text-gray-500">{formatCurrency(category.amount)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const GeographicChart = () => {
    const maxSales = Math.max(...geographicData.map(d => d.sales))
    
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Distribución Geográfica</h3>
            <p className="text-sm text-gray-600">Ventas por región</p>
          </div>
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>
        
        <div className="space-y-4">
          {geographicData.map((region, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm">{region.region}</span>
                  <span className="text-xs text-gray-500">{region.stores} tiendas</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{formatCurrency(region.sales)}</div>
                  <div className="text-xs text-green-600">+{region.growth}%</div>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(region.sales / maxSales) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Period and Metric Selectors */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2">
          {[
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mes' },
            { id: 'quarter', label: 'Trimestre' },
            { id: 'year', label: 'Año' }
          ].map((period) => (
            <Button
              key={period.id}
              variant={selectedPeriod === period.id ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period.id)}
            >
              {period.label}
            </Button>
          ))}
        </div>
        
        <div className="flex gap-2">
          {[
            { id: 'revenue', label: 'Ingresos', icon: <BarChart3 className="h-4 w-4" /> },
            { id: 'users', label: 'Usuarios', icon: <Users className="h-4 w-4" /> },
            { id: 'stores', label: 'Tiendas', icon: <ShoppingBag className="h-4 w-4" /> },
            { id: 'transactions', label: 'Transacciones', icon: <CreditCard className="h-4 w-4" /> }
          ].map((metric) => (
            <Button
              key={metric.id}
              variant={selectedMetric === metric.id ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric(metric.id)}
              className="flex items-center gap-2"
            >
              {metric.icon}
              {metric.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <UserGrowthChart />
        <CategoryChart />
        <GeographicChart />
      </div>

      {/* Key Insights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights Clave</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="font-medium text-sm">Crecimiento Acelerado</span>
            </div>
            <p className="text-xs text-gray-600">
              Las ventas han crecido un 22% en el último trimestre, superando las proyecciones.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-5 w-5 text-blue-500" />
              <span className="font-medium text-sm">Retención Mejorada</span>
            </div>
            <p className="text-xs text-gray-600">
              La tasa de retención de usuarios ha aumentado al 91%, el mejor registro histórico.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center gap-3 mb-2">
              <MapPin className="h-5 w-5 text-purple-500" />
              <span className="font-medium text-sm">Expansión Regional</span>
            </div>
            <p className="text-xs text-gray-600">
              Medellín muestra el mayor crecimiento (22%) y potencial para nuevas tiendas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}