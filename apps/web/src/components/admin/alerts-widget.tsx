'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  Package, 
  CreditCard, 
  Webhook, 
  X, 
  Filter,
  CheckCircle,
  Clock,
  TrendingDown,
  Users,
  ShoppingCart,
  Server,
  Bell,
  BellOff,
  Eye,
  Trash2
} from 'lucide-react'
import { useState, useMemo } from 'react'

interface Alert {
  id: string
  type: 'stock' | 'payment' | 'webhook' | 'order' | 'user' | 'system'
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  read: boolean
  actionRequired: boolean
  storeId?: string
  storeName?: string
}

// Mock data with more variety
const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'stock',
    title: 'Stock crítico',
    message: 'Producto "Camisa Azul Talla M" tiene solo 2 unidades disponibles en Tienda Central',
    severity: 'critical',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    read: false,
    actionRequired: true,
    storeId: '1',
    storeName: 'Tienda Central'
  },
  {
    id: '2',
    type: 'payment',
    title: 'Pago fallido',
    message: 'Error en el procesamiento del pago #12345 por $125.000',
    severity: 'high',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    read: false,
    actionRequired: true,
    storeId: '2',
    storeName: 'Sucursal Norte'
  },
  {
    id: '3',
    type: 'order',
    title: 'Pedido cancelado',
    message: 'El cliente canceló el pedido #ORD-2024-001 después de 2 horas',
    severity: 'medium',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1 hour ago
    read: false,
    actionRequired: false,
    storeId: '1',
    storeName: 'Tienda Central'
  },
  {
    id: '4',
    type: 'webhook',
    title: 'Sincronización fallida',
    message: 'Error en la sincronización con el proveedor de pagos Stripe',
    severity: 'medium',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: true,
    actionRequired: false
  },
  {
    id: '5',
    type: 'user',
    title: 'Nuevo usuario registrado',
    message: 'Se registró un nuevo usuario: maria.garcia@email.com',
    severity: 'low',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    read: true,
    actionRequired: false
  },
  {
    id: '6',
    type: 'system',
    title: 'Mantenimiento programado',
    message: 'Mantenimiento del sistema programado para mañana a las 2:00 AM',
    severity: 'low',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    read: false,
    actionRequired: false
  },
  {
    id: '7',
    type: 'stock',
    title: 'Restock completado',
    message: 'Se completó el restock de 50 unidades de "Pantalón Negro Talla L"',
    severity: 'low',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    read: true,
    actionRequired: false,
    storeId: '3',
    storeName: 'Plaza Sur'
  }
]

type AlertFilter = 'all' | 'unread' | 'actionRequired' | Alert['type']

interface AlertsWidgetProps {
  showFilters?: boolean
  maxAlerts?: number
  autoRefresh?: boolean
}

export function AlertsWidget({ 
  showFilters = false, 
  maxAlerts = 5,
  autoRefresh = false 
}: AlertsWidgetProps) {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [filter, setFilter] = useState<AlertFilter>('all')
  const [showActions, setShowActions] = useState<string | null>(null)

  const getIcon = (type: Alert['type']) => {
    switch (type) {
      case 'stock':
        return <Package className="w-4 h-4" />
      case 'payment':
        return <CreditCard className="w-4 h-4" />
      case 'webhook':
        return <Webhook className="w-4 h-4" />
      case 'order':
        return <ShoppingCart className="w-4 h-4" />
      case 'user':
        return <Users className="w-4 h-4" />
      case 'system':
        return <Server className="w-4 h-4" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-100 border-red-200'
      case 'high':
        return 'text-red-600 bg-red-50 border-red-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-100'
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-100'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-100'
    }
  }

  const getSeverityBadge = (severity: Alert['severity']) => {
    const colors = {
      critical: 'bg-red-500 text-white',
      high: 'bg-red-400 text-white',
      medium: 'bg-yellow-400 text-white',
      low: 'bg-blue-400 text-white'
    }
    
    const labels = {
      critical: 'Crítico',
      high: 'Alto',
      medium: 'Medio',
      low: 'Bajo'
    }
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors[severity]}`}>
        {labels[severity]}
      </span>
    )
  }

  const filteredAlerts = useMemo(() => {
    let filtered = alerts

    switch (filter) {
      case 'unread':
        filtered = alerts.filter(alert => !alert.read)
        break
      case 'actionRequired':
        filtered = alerts.filter(alert => alert.actionRequired)
        break
      case 'all':
        break
      default:
        filtered = alerts.filter(alert => alert.type === filter)
    }

    return filtered.slice(0, maxAlerts)
  }, [alerts, filter, maxAlerts])

  const dismissAlert = (id: string) => {
    setAlerts(alerts.filter(alert => alert.id !== id))
  }

  const markAsRead = (id: string) => {
    setAlerts(alerts.map(alert => 
      alert.id === id ? { ...alert, read: true } : alert
    ))
  }

  const markAllAsRead = () => {
    setAlerts(alerts.map(alert => ({ ...alert, read: true })))
  }

  const clearAllRead = () => {
    setAlerts(alerts.filter(alert => !alert.read))
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (minutes < 60) {
      return `hace ${minutes} min`
    } else if (hours < 24) {
      return `hace ${hours}h`
    } else {
      return `hace ${days}d`
    }
  }

  const unreadCount = alerts.filter(alert => !alert.read).length
  const actionRequiredCount = alerts.filter(alert => alert.actionRequired && !alert.read).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            {actionRequiredCount > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Alertas del Sistema</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                {unreadCount}
              </span>
            )}
            {actionRequiredCount > 0 && (
              <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                {actionRequiredCount} requieren acción
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Marcar todas como leídas
            </button>
          )}
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Ver todas
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
          {[
            { key: 'all', label: 'Todas', count: alerts.length },
            { key: 'unread', label: 'No leídas', count: unreadCount },
            { key: 'actionRequired', label: 'Requieren acción', count: actionRequiredCount },
            { key: 'stock', label: 'Stock', count: alerts.filter(a => a.type === 'stock').length },
            { key: 'payment', label: 'Pagos', count: alerts.filter(a => a.type === 'payment').length },
            { key: 'order', label: 'Pedidos', count: alerts.filter(a => a.type === 'order').length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as AlertFilter)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filter === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label} {count > 0 && `(${count})`}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        <AnimatePresence>
          {filteredAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {filter === 'all' ? 'No hay alertas' : `No hay alertas ${filter === 'unread' ? 'no leídas' : 'de este tipo'}`}
              </p>
            </motion.div>
          ) : (
            filteredAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`relative p-4 rounded-lg border transition-all hover:shadow-sm ${
                  alert.read 
                    ? 'bg-gray-50 border-gray-200' 
                    : alert.severity === 'critical'
                    ? 'bg-red-50 border-red-200 shadow-sm'
                    : 'bg-white border-gray-300 shadow-sm'
                }`}
                onClick={() => !alert.read && markAsRead(alert.id)}
              >
                {alert.actionRequired && !alert.read && (
                  <div className="absolute top-2 right-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                  </div>
                )}
                
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                      {getIcon(alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${alert.read ? 'text-gray-600' : 'text-gray-900'}`}>
                          {alert.title}
                        </h4>
                        {getSeverityBadge(alert.severity)}
                        {!alert.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className={`text-sm ${alert.read ? 'text-gray-500' : 'text-gray-700'} mb-2`}>
                        {alert.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>{formatTime(alert.timestamp)}</span>
                          {alert.storeName && (
                            <span className="text-blue-600">• {alert.storeName}</span>
                          )}
                        </div>
                        {alert.actionRequired && !alert.read && (
                          <span className="text-xs text-orange-600 font-medium">
                            Requiere acción
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowActions(showActions === alert.id ? null : alert.id)
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        dismissAlert(alert.id)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {showActions === alert.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-gray-200"
                  >
                    <div className="flex gap-2">
                      {alert.actionRequired && (
                        <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                          Resolver
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(alert.id)
                        }}
                        className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        {alert.read ? 'Marcar como no leída' : 'Marcar como leída'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {alerts.filter(a => a.read).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={clearAllRead}
            className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            Limpiar alertas leídas
          </button>
        </div>
      )}
    </motion.div>
  )
}