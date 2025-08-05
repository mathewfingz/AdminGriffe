'use client'

import { useState } from 'react'
import { MetricsCard } from '@admin-griffe/ui'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Calendar, TrendingUp, ShoppingCart, DollarSign, Target, Zap } from 'lucide-react'

// Mock data para las métricas
const kpiData = {
  ventasHoy: {
    value: 2450000,
    change: 12.5,
    sparkline: [2100000, 2200000, 2300000, 2450000, 2400000, 2450000, 2500000]
  },
  pedidosPendientes: {
    value: 23,
    change: -8.2,
    sparkline: [28, 25, 30, 27, 24, 26, 23]
  },
  margen: {
    value: 34.5,
    change: 2.1,
    sparkline: [32.1, 33.2, 32.8, 34.1, 33.9, 34.2, 34.5]
  },
  aov: {
    value: 156000,
    change: 5.8,
    sparkline: [145000, 148000, 152000, 154000, 155000, 157000, 156000]
  },
  roas: {
    value: 4.2,
    change: 15.3,
    sparkline: [3.8, 3.9, 4.0, 4.1, 4.0, 4.1, 4.2]
  }
}

// Mock data para el gráfico de líneas
const chartData = [
  { date: '01/12', ventas: 1800000, pedidos: 18 },
  { date: '02/12', ventas: 2100000, pedidos: 22 },
  { date: '03/12', ventas: 1950000, pedidos: 19 },
  { date: '04/12', ventas: 2300000, pedidos: 25 },
  { date: '05/12', ventas: 2450000, pedidos: 28 },
  { date: '06/12', ventas: 2200000, pedidos: 24 },
  { date: '07/12', ventas: 2600000, pedidos: 30 },
  { date: '08/12', ventas: 2400000, pedidos: 26 },
  { date: '09/12', ventas: 2750000, pedidos: 32 },
  { date: '10/12', ventas: 2500000, pedidos: 27 },
  { date: '11/12', ventas: 2800000, pedidos: 35 },
  { date: '12/12', ventas: 2450000, pedidos: 23 }
]

// Mock data para el heatmap horario
const heatmapData = [
  { hour: '00:00', monday: 2, tuesday: 1, wednesday: 3, thursday: 2, friday: 4, saturday: 8, sunday: 6 },
  { hour: '01:00', monday: 1, tuesday: 1, wednesday: 2, thursday: 1, friday: 2, saturday: 5, sunday: 4 },
  { hour: '02:00', monday: 0, tuesday: 0, wednesday: 1, thursday: 0, friday: 1, saturday: 3, sunday: 2 },
  { hour: '03:00', monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 1, saturday: 2, sunday: 1 },
  { hour: '04:00', monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 1, sunday: 1 },
  { hour: '05:00', monday: 0, tuesday: 0, wednesday: 1, thursday: 1, friday: 1, saturday: 2, sunday: 1 },
  { hour: '06:00', monday: 1, tuesday: 2, wednesday: 2, thursday: 3, friday: 3, saturday: 4, sunday: 3 },
  { hour: '07:00', monday: 3, tuesday: 4, wednesday: 5, thursday: 6, friday: 7, saturday: 8, sunday: 5 },
  { hour: '08:00', monday: 8, tuesday: 9, wednesday: 10, thursday: 12, friday: 14, saturday: 15, sunday: 8 },
  { hour: '09:00', monday: 15, tuesday: 18, wednesday: 20, thursday: 22, friday: 25, saturday: 28, sunday: 12 },
  { hour: '10:00', monday: 22, tuesday: 25, wednesday: 28, thursday: 30, friday: 35, saturday: 40, sunday: 18 },
  { hour: '11:00', monday: 28, tuesday: 32, wednesday: 35, thursday: 38, friday: 42, saturday: 45, sunday: 25 },
  { hour: '12:00', monday: 35, tuesday: 38, wednesday: 42, thursday: 45, friday: 48, saturday: 50, sunday: 30 },
  { hour: '13:00', monday: 32, tuesday: 35, wednesday: 38, thursday: 40, friday: 45, saturday: 48, sunday: 28 },
  { hour: '14:00', monday: 28, tuesday: 30, wednesday: 32, thursday: 35, friday: 38, saturday: 42, sunday: 25 },
  { hour: '15:00', monday: 25, tuesday: 28, wednesday: 30, thursday: 32, friday: 35, saturday: 38, sunday: 22 },
  { hour: '16:00', monday: 22, tuesday: 25, wednesday: 28, thursday: 30, friday: 32, saturday: 35, sunday: 20 },
  { hour: '17:00', monday: 20, tuesday: 22, wednesday: 25, thursday: 28, friday: 30, saturday: 32, sunday: 18 },
  { hour: '18:00', monday: 18, tuesday: 20, wednesday: 22, thursday: 25, friday: 28, saturday: 30, sunday: 15 },
  { hour: '19:00', monday: 15, tuesday: 18, wednesday: 20, thursday: 22, friday: 25, saturday: 28, sunday: 12 },
  { hour: '20:00', monday: 12, tuesday: 15, wednesday: 18, thursday: 20, friday: 22, saturday: 25, sunday: 10 },
  { hour: '21:00', monday: 8, tuesday: 10, wednesday: 12, thursday: 15, friday: 18, saturday: 20, sunday: 8 },
  { hour: '22:00', monday: 5, tuesday: 6, wednesday: 8, thursday: 10, friday: 12, saturday: 15, sunday: 6 },
  { hour: '23:00', monday: 3, tuesday: 4, wednesday: 5, thursday: 6, friday: 8, saturday: 10, sunday: 4 }
]

// Mock sugerencias de IA
const aiSuggestions = [
  {
    id: 1,
    type: 'optimization',
    title: 'Optimizar horarios de publicación',
    description: 'Tus ventas son 40% más altas entre 10:00-14:00. Considera programar promociones en este horario.',
    priority: 'high'
  },
  {
    id: 2,
    type: 'inventory',
    title: 'Stock bajo en productos populares',
    description: '3 productos con alta demanda tienen menos de 10 unidades en inventario.',
    priority: 'medium'
  },
  {
    id: 3,
    type: 'marketing',
    title: 'Oportunidad de retargeting',
    description: '156 usuarios abandonaron el carrito en las últimas 24h. Envía un email de recuperación.',
    priority: 'high'
  },
  {
    id: 4,
    type: 'finance',
    title: 'Margen mejorado',
    description: 'Tu margen ha aumentado 2.1% esta semana. Mantén la estrategia de precios actual.',
    priority: 'low'
  }
]

export default function TiendaDashboard() {
  const [dateRange, setDateRange] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('ventas')

  const getIntensityColor = (value: number) => {
    if (value === 0) return 'bg-gray-100'
    if (value <= 5) return 'bg-blue-100'
    if (value <= 15) return 'bg-blue-200'
    if (value <= 25) return 'bg-blue-300'
    if (value <= 35) return 'bg-blue-400'
    if (value <= 45) return 'bg-blue-500'
    return 'bg-blue-600'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      case 'low': return 'border-l-green-500 bg-green-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getPriorityIcon = (type: string) => {
    switch (type) {
      case 'optimization': return <TrendingUp className="w-4 h-4" />
      case 'inventory': return <ShoppingCart className="w-4 h-4" />
      case 'marketing': return <Target className="w-4 h-4" />
      case 'finance': return <DollarSign className="w-4 h-4" />
      default: return <Zap className="w-4 h-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Tienda</h1>
          <p className="text-gray-600">Resumen de rendimiento y métricas clave</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1d">Último día</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </select>
          <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Calendar className="w-4 h-4" />
            Personalizar
          </button>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricsCard
          title="Ventas HOY"
          value={kpiData.ventasHoy.value}
          change={{
            value: kpiData.ventasHoy.change,
            type: kpiData.ventasHoy.change > 0 ? 'increase' : 'decrease',
            period: 'ayer'
          }}
          format="currency"
          sparklineData={kpiData.ventasHoy.sparkline}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <MetricsCard
          title="Pedidos Pendientes"
          value={kpiData.pedidosPendientes.value}
          change={{
            value: Math.abs(kpiData.pedidosPendientes.change),
            type: kpiData.pedidosPendientes.change > 0 ? 'increase' : 'decrease',
            period: 'ayer'
          }}
          format="number"
          sparklineData={kpiData.pedidosPendientes.sparkline}
          icon={<ShoppingCart className="w-5 h-5" />}
        />
        <MetricsCard
          title="Margen"
          value={kpiData.margen.value}
          change={{
            value: kpiData.margen.change,
            type: kpiData.margen.change > 0 ? 'increase' : 'decrease',
            period: 'semana pasada'
          }}
          format="percentage"
          sparklineData={kpiData.margen.sparkline}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <MetricsCard
          title="AOV"
          value={kpiData.aov.value}
          change={{
            value: kpiData.aov.change,
            type: kpiData.aov.change > 0 ? 'increase' : 'decrease',
            period: 'mes pasado'
          }}
          format="currency"
          sparklineData={kpiData.aov.sparkline}
          icon={<Target className="w-5 h-5" />}
        />
        <MetricsCard
          title="ROAS"
          value={kpiData.roas.value}
          change={{
            value: kpiData.roas.change,
            type: kpiData.roas.change > 0 ? 'increase' : 'decrease',
            period: 'mes pasado'
          }}
          format="number"
          sparklineData={kpiData.roas.sparkline}
          icon={<Zap className="w-5 h-5" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Tendencia de Ventas</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedMetric('ventas')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedMetric === 'ventas' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Ventas
              </button>
              <button
                onClick={() => setSelectedMetric('pedidos')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedMetric === 'pedidos' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Pedidos
              </button>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => 
                    selectedMetric === 'ventas' 
                      ? `$${(value / 1000000).toFixed(1)}M`
                      : value.toString()
                  }
                />
                <Tooltip 
                  formatter={(value) => [
                    selectedMetric === 'ventas' 
                      ? `$${value.toLocaleString('es-CO')}` 
                      : value,
                    selectedMetric === 'ventas' ? 'Ventas' : 'Pedidos'
                  ]}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey={selectedMetric} 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad por Horario</h3>
          <div className="space-y-1">
            {/* Days header */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="text-xs text-gray-500 text-center"></div>
              <div className="text-xs text-gray-500 text-center">L</div>
              <div className="text-xs text-gray-500 text-center">M</div>
              <div className="text-xs text-gray-500 text-center">X</div>
              <div className="text-xs text-gray-500 text-center">J</div>
              <div className="text-xs text-gray-500 text-center">V</div>
              <div className="text-xs text-gray-500 text-center">S</div>
              <div className="text-xs text-gray-500 text-center">D</div>
            </div>
            {/* Heatmap grid */}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {heatmapData.map((row) => (
                <div key={row.hour} className="grid grid-cols-8 gap-1">
                  <div className="text-xs text-gray-500 text-right pr-2 py-1">
                    {row.hour.slice(0, 2)}
                  </div>
                  <div className={`w-4 h-4 rounded-sm ${getIntensityColor(row.monday)}`} title={`Lunes ${row.hour}: ${row.monday} pedidos`}></div>
                  <div className={`w-4 h-4 rounded-sm ${getIntensityColor(row.tuesday)}`} title={`Martes ${row.hour}: ${row.tuesday} pedidos`}></div>
                  <div className={`w-4 h-4 rounded-sm ${getIntensityColor(row.wednesday)}`} title={`Miércoles ${row.hour}: ${row.wednesday} pedidos`}></div>
                  <div className={`w-4 h-4 rounded-sm ${getIntensityColor(row.thursday)}`} title={`Jueves ${row.hour}: ${row.thursday} pedidos`}></div>
                  <div className={`w-4 h-4 rounded-sm ${getIntensityColor(row.friday)}`} title={`Viernes ${row.hour}: ${row.friday} pedidos`}></div>
                  <div className={`w-4 h-4 rounded-sm ${getIntensityColor(row.saturday)}`} title={`Sábado ${row.hour}: ${row.saturday} pedidos`}></div>
                  <div className={`w-4 h-4 rounded-sm ${getIntensityColor(row.sunday)}`} title={`Domingo ${row.hour}: ${row.sunday} pedidos`}></div>
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
              <span>Menos</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-gray-100"></div>
                <div className="w-3 h-3 rounded-sm bg-blue-100"></div>
                <div className="w-3 h-3 rounded-sm bg-blue-200"></div>
                <div className="w-3 h-3 rounded-sm bg-blue-300"></div>
                <div className="w-3 h-3 rounded-sm bg-blue-400"></div>
                <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                <div className="w-3 h-3 rounded-sm bg-blue-600"></div>
              </div>
              <span>Más</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Suggestions Widget */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Sugerencias de IA</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver todas
          </button>
        </div>
        <div className="space-y-3">
          {aiSuggestions.map((suggestion) => (
            <div 
              key={suggestion.id}
              className={`p-4 rounded-lg border-l-4 ${getPriorityColor(suggestion.priority)}`}
            >
              <div className="flex items-start gap-3">
                <div className="text-gray-600 mt-0.5">
                  {getPriorityIcon(suggestion.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{suggestion.title}</h4>
                  <p className="text-sm text-gray-600">{suggestion.description}</p>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Actuar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}