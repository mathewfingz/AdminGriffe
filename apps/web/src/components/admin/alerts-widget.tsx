'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Package, CreditCard, Zap, ChevronRight } from 'lucide-react'

interface Alert {
  id: string
  type: 'stock' | 'payment' | 'webhook'
  title: string
  description: string
  count: number
  severity: 'high' | 'medium' | 'low'
}

interface AlertsWidgetProps {
  title?: string
  delay?: number
}

// Mock data
const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'stock',
    title: 'Stock Crítico',
    description: 'Productos con menos de 5 unidades',
    count: 12,
    severity: 'high'
  },
  {
    id: '2',
    type: 'payment',
    title: 'Pagos Vencidos',
    description: 'Facturas pendientes de pago',
    count: 3,
    severity: 'medium'
  },
  {
    id: '3',
    type: 'webhook',
    title: 'Webhooks Fallidos',
    description: 'Integraciones con errores',
    count: 7,
    severity: 'medium'
  }
]

const getAlertIcon = (type: Alert['type']) => {
  switch (type) {
    case 'stock':
      return <Package className="w-5 h-5" />
    case 'payment':
      return <CreditCard className="w-5 h-5" />
    case 'webhook':
      return <Zap className="w-5 h-5" />
    default:
      return <AlertTriangle className="w-5 h-5" />
  }
}

const getSeverityColor = (severity: Alert['severity']) => {
  switch (severity) {
    case 'high':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'medium':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'low':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

export function AlertsWidget({ title = "Alertas del Sistema", delay = 0 }: AlertsWidgetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-lg border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Ver todas
        </button>
      </div>
      
      <div className="space-y-4">
        {mockAlerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: delay + (index * 0.1) }}
            className={`border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer ${getSeverityColor(alert.severity)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium truncate">
                      {alert.title}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white">
                      {alert.count}
                    </span>
                  </div>
                  <p className="text-xs opacity-75 mt-1">
                    {alert.description}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0">
                <ChevronRight className="w-4 h-4 opacity-50" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {mockAlerts.length === 0 && (
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500">No hay alertas activas</p>
        </div>
      )}
    </motion.div>
  )
}