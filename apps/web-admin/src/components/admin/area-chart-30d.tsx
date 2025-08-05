'use client'

import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Download, Maximize2, Calendar } from 'lucide-react'

// Mock data generator with more realistic patterns
const generateMockData = (days: number) => {
  const data = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // More realistic patterns with weekly cycles
    const dayOfWeek = date.getDay()
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1
    const baseValue = 1000 + Math.sin(i / 7) * 200 // Weekly pattern
    const seasonalTrend = Math.sin(i / 30) * 100 // Monthly trend
    const randomVariation = Math.random() * 200 - 100
    
    const finalValue = (baseValue + seasonalTrend + randomVariation) * weekendMultiplier
    
    data.push({
      date: date.toISOString().split('T')[0],
      sales: Math.round(Math.max(finalValue, 200)),
      orders: Math.round(Math.max(finalValue / 50, 5)),
      day: date.getDate(),
      month: date.getMonth() + 1,
      dayOfWeek: date.getDay(),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6
    })
  }
  
  return data
}

interface AreaChart30dProps {
  className?: string
  showControls?: boolean
  defaultMetric?: 'sales' | 'orders'
  defaultPeriod?: 30 | 90
}

export function AreaChart30d({ 
  className = '',
  showControls = true,
  defaultMetric = 'sales',
  defaultPeriod = 30
}: AreaChart30dProps) {
  const [period, setPeriod] = useState<30 | 90>(defaultPeriod)
  const [metric, setMetric] = useState<'sales' | 'orders'>(defaultMetric)
  const [showAverage, setShowAverage] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const data = useMemo(() => generateMockData(period), [period])

  // Calculate statistics
  const stats = useMemo(() => {
    const values = data.map(d => d[metric])
    const total = values.reduce((sum, val) => sum + val, 0)
    const average = total / values.length
    const max = Math.max(...values)
    const min = Math.min(...values)
    
    // Calculate trend (last 7 days vs previous 7 days)
    const recent = values.slice(-7).reduce((sum, val) => sum + val, 0) / 7
    const previous = values.slice(-14, -7).reduce((sum, val) => sum + val, 0) / 7
    const trend = ((recent - previous) / previous) * 100
    
    return { total, average, max, min, trend }
  }, [data, metric])

  const formatValue = (value: number) => {
    if (metric === 'sales') {
      return `$${value.toLocaleString()}`
    }
    return value.toString()
  }

  const formatCompactValue = (value: number) => {
    if (metric === 'sales') {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
      if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
      return `$${value}`
    }
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toString()
  }

  const exportData = () => {
    const csvContent = [
      ['Fecha', metric === 'sales' ? 'Ventas' : 'Pedidos'],
      ...data.map(d => [d.date, d[metric]])
    ].map(row => row.join(',')).join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${metric}-${period}d.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={`bg-white rounded-xl border border-gray-200 p-6 ${className} ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {metric === 'sales' ? 'Ventas' : 'Pedidos'}
            </h3>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              stats.trend > 0 
                ? 'bg-green-50 text-green-700' 
                : stats.trend < 0 
                ? 'bg-red-50 text-red-700'
                : 'bg-gray-50 text-gray-700'
            }`}>
              {stats.trend > 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : stats.trend < 0 ? (
                <TrendingDown className="w-3 h-3" />
              ) : null}
              {stats.trend > 0 ? '+' : ''}{stats.trend.toFixed(1)}%
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            Últimos {period} días • Promedio: {formatCompactValue(stats.average)}
          </p>
          
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              Total: <span className="font-semibold text-gray-900">{formatCompactValue(stats.total)}</span>
            </span>
            <span className="text-gray-600">
              Máx: <span className="font-semibold text-gray-900">{formatCompactValue(stats.max)}</span>
            </span>
            <span className="text-gray-600">
              Mín: <span className="font-semibold text-gray-900">{formatCompactValue(stats.min)}</span>
            </span>
          </div>
        </div>
        
        {showControls && (
          <div className="flex items-center gap-2">
            {/* Actions */}
            <div className="flex gap-1">
              <button
                onClick={() => setShowAverage(!showAverage)}
                className={`p-2 rounded-lg transition-colors ${
                  showAverage ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Mostrar promedio"
              >
                <Calendar className="w-4 h-4" />
              </button>
              <button
                onClick={exportData}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                title="Exportar datos"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                title="Pantalla completa"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
            
            {/* Metric selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMetric('sales')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  metric === 'sales'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Ventas
              </button>
              <button
                 onClick={() => setMetric('orders')}
                 className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                   metric === 'orders'
                     ? 'bg-white text-gray-900 shadow-sm'
                     : 'text-gray-600 hover:text-gray-900'
                 }`}
               >
                 Pedidos
               </button>
            </div>
            
            {/* Period selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPeriod(30)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  period === 30
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                30d
              </button>
              <button
                onClick={() => setPeriod(90)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  period === 90
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                90d
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-80'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getDate()}/${date.getMonth() + 1}`
              }}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={formatCompactValue}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                padding: '12px'
              }}
              formatter={(value: number) => [
                formatValue(value), 
                metric === 'sales' ? 'Ventas' : 'Pedidos'
              ]}
              labelFormatter={(label) => {
                const date = new Date(label)
                return date.toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })
              }}
            />
            {showAverage && (
               <ReferenceLine 
                 y={stats.average} 
                 stroke="#6B7280" 
                 strokeDasharray="5 5"
                 label={{ value: "Promedio", position: "top" }}
               />
             )}
            <Area
              type="monotone"
              dataKey={metric}
              stroke={metric === 'sales' ? '#3B82F6' : '#10B981'}
              strokeWidth={2}
              fillOpacity={1}
              fill={metric === 'sales' ? 'url(#colorSales)' : 'url(#colorOrders)'}
              dot={false}
              activeDot={{ 
                r: 4, 
                stroke: metric === 'sales' ? '#3B82F6' : '#10B981',
                strokeWidth: 2,
                fill: 'white'
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {isFullscreen && (
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  )
}