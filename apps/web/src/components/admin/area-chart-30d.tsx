'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subDays } from 'date-fns'
import { es } from 'date-fns/locale'

interface ChartData {
  date: string
  ventas: number
  pedidos: number
}

interface AreaChart30dProps {
  title?: string
  delay?: number
}

// Mock data generator
const generateMockData = (days: number): ChartData[] => {
  const data: ChartData[] = []
  const today = new Date()
  
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i)
    data.push({
      date: format(date, 'dd/MM'),
      ventas: Math.floor(Math.random() * 50000) + 10000,
      pedidos: Math.floor(Math.random() * 100) + 20,
    })
  }
  
  return data
}

export function AreaChart30d({ title = "Ventas y Pedidos", delay = 0 }: AreaChart30dProps) {
  const [period, setPeriod] = useState<30 | 90>(30)
  const data = generateMockData(period)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-lg border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setPeriod(30)}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              period === 30
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            30 días
          </button>
          <button
            onClick={() => setPeriod(90)}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              period === 90
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            90 días
          </button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorPedidos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number, name: string) => [
                name === 'ventas' ? `$${value.toLocaleString()}` : value,
                name === 'ventas' ? 'Ventas' : 'Pedidos'
              ]}
              labelFormatter={(label) => `Fecha: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="ventas"
              stroke="#3B82F6"
              fillOpacity={1}
              fill="url(#colorVentas)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="pedidos"
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#colorPedidos)"
              strokeWidth={2}
              yAxisId="right"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}