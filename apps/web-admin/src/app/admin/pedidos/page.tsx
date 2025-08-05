'use client'

import { useState } from 'react'
import { Button } from '@admin-griffe/ui'
import { Plus, Filter, Download, Search, Calendar } from 'lucide-react'
import { PedidosKanbanBoard } from '@/components/admin/pedidos/pedidos-kanban-board'
import { PedidosFilters } from '@/components/admin/pedidos/pedidos-filters'

export default function PedidosPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Mock stats
  const stats = [
    {
      title: 'Pedidos Pendientes',
      value: '24',
      change: '+12%',
      changeType: 'increase' as const,
      color: 'yellow'
    },
    {
      title: 'En Preparación',
      value: '18',
      change: '+8%',
      changeType: 'increase' as const,
      color: 'blue'
    },
    {
      title: 'Enviados Hoy',
      value: '32',
      change: '+15%',
      changeType: 'increase' as const,
      color: 'green'
    },
    {
      title: 'Completados',
      value: '156',
      change: '+23%',
      changeType: 'increase' as const,
      color: 'purple'
    }
  ]

  const getStatColor = (color: string) => {
    const colors = {
      yellow: 'bg-yellow-50 border-yellow-200',
      blue: 'bg-blue-50 border-blue-200',
      green: 'bg-green-50 border-green-200',
      purple: 'bg-purple-50 border-purple-200'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getStatTextColor = (color: string) => {
    const colors = {
      yellow: 'text-yellow-600',
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Pedidos</h1>
          <p className="text-muted-foreground">
            Administra y da seguimiento a todos los pedidos de las tiendas
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Pedido
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className={`p-6 rounded-lg border ${getStatColor(stat.color)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold ${getStatTextColor(stat.color)}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`text-sm font-medium ${
                stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.change}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and View Toggle */}
      <div className="flex items-center justify-between bg-white rounded-lg border p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar pedidos por ID, cliente o tienda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Vista:</span>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 text-sm font-medium ${
                viewMode === 'kanban'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-sm font-medium ${
                viewMode === 'table'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Tabla
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <PedidosFilters onClose={() => setShowFilters(false)} />
      )}

      {/* Main Content */}
      {viewMode === 'kanban' ? (
        <PedidosKanbanBoard searchTerm={searchTerm} />
      ) : (
        <div className="bg-white rounded-lg border p-6">
          <p className="text-center text-gray-500">Vista de tabla en desarrollo...</p>
        </div>
      )}
    </div>
  )
}