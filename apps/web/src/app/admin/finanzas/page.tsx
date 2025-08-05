'use client'

import { useState } from 'react'
import { Button } from '@admin-griffe/ui'
import { 
  Download, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  PieChart, 
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { FinanzasCharts } from '@/components/admin/finanzas/finanzas-charts'
import { TransaccionesTable } from '@/components/admin/finanzas/transacciones-table'

export default function FinanzasPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [activeTab, setActiveTab] = useState('overview')

  // Mock financial data
  const financialStats = [
    {
      title: 'Ingresos Totales',
      value: '$45,231,890',
      change: '+12.5%',
      changeType: 'increase' as const,
      icon: <DollarSign className="h-6 w-6" />,
      color: 'green'
    },
    {
      title: 'Comisiones Generadas',
      value: '$2,261,595',
      change: '+8.2%',
      changeType: 'increase' as const,
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'blue'
    },
    {
      title: 'Transacciones',
      value: '1,247',
      change: '+15.3%',
      changeType: 'increase' as const,
      icon: <CreditCard className="h-6 w-6" />,
      color: 'purple'
    },
    {
      title: 'Ticket Promedio',
      value: '$36,289',
      change: '-2.1%',
      changeType: 'decrease' as const,
      icon: <BarChart3 className="h-6 w-6" />,
      color: 'orange'
    }
  ]

  const topStores = [
    { nombre: 'Boutique Elegance', ingresos: 8450000, comision: 422500, transacciones: 156 },
    { nombre: 'Tech Store', ingresos: 7230000, comision: 361500, transacciones: 89 },
    { nombre: 'Fashion Hub', ingresos: 6890000, comision: 344500, transacciones: 203 },
    { nombre: 'Sports World', ingresos: 5670000, comision: 283500, transacciones: 134 },
    { nombre: 'Home & Garden', ingresos: 4320000, comision: 216000, transacciones: 98 }
  ]

  const paymentMethods = [
    { metodo: 'Tarjeta de Crédito', porcentaje: 45, monto: 20354200 },
    { metodo: 'PSE', porcentaje: 28, monto: 12664929 },
    { metodo: 'Nequi', porcentaje: 15, monto: 6784784 },
    { metodo: 'Efectivo', porcentaje: 8, monto: 3618551 },
    { metodo: 'Transferencia', porcentaje: 4, monto: 1809426 }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatColor = (color: string) => {
    const colors = {
      green: 'bg-green-50 border-green-200',
      blue: 'bg-blue-50 border-blue-200',
      purple: 'bg-purple-50 border-purple-200',
      orange: 'bg-orange-50 border-orange-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getStatIconColor = (color: string) => {
    const colors = {
      green: 'text-green-600',
      blue: 'text-blue-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financiero</h1>
          <p className="text-muted-foreground">
            Monitorea ingresos, comisiones y métricas financieras de la plataforma
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select 
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="quarter">Este trimestre</option>
              <option value="year">Este año</option>
            </select>
          </div>
          
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {financialStats.map((stat, index) => (
          <div key={index} className={`p-6 rounded-lg border ${getStatColor(stat.color)}`}>
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg bg-white ${getStatIconColor(stat.color)}`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.changeType === 'increase' ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className={`text-2xl font-bold ${getStatIconColor(stat.color)}`}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Resumen General' },
            { id: 'charts', label: 'Gráficos y Análisis' },
            { id: 'transactions', label: 'Transacciones' },
            { id: 'reports', label: 'Reportes' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Stores */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Tiendas con Mejor Rendimiento</h2>
            <div className="space-y-4">
              {topStores.map((store, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{store.nombre}</h3>
                    <p className="text-sm text-gray-600">{store.transacciones} transacciones</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(store.ingresos)}</p>
                    <p className="text-sm text-green-600">+{formatCurrency(store.comision)} comisión</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods Distribution */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Distribución por Método de Pago</h2>
            <div className="space-y-4">
              {paymentMethods.map((method, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{method.metodo}</span>
                    <span className="text-gray-600">{method.porcentaje}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${method.porcentaje}%` }}
                    ></div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(method.monto)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'charts' && (
        <FinanzasCharts period={selectedPeriod} />
      )}

      {activeTab === 'transactions' && (
        <TransaccionesTable />
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg border p-8 text-center">
          <PieChart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Reportes Financieros</h3>
          <p className="text-gray-600 mb-6">
            Genera reportes detallados de ingresos, comisiones y métricas financieras
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <Button variant="outline" className="flex flex-col items-center p-6 h-auto">
              <BarChart3 className="h-8 w-8 mb-2" />
              <span>Reporte de Ingresos</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-6 h-auto">
              <TrendingUp className="h-8 w-8 mb-2" />
              <span>Análisis de Comisiones</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-6 h-auto">
              <PieChart className="h-8 w-8 mb-2" />
              <span>Reporte Consolidado</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}