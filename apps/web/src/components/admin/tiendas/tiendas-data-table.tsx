'use client'

import { useState } from 'react'
import { Button } from '@admin-griffe/ui'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Store,
  Users,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'
import Link from 'next/link'

// Types
interface Tienda {
  id: string
  nombre: string
  email: string
  telefono: string
  direccion: string
  ciudad: string
  estado: 'activa' | 'pendiente' | 'suspendida' | 'inactiva'
  fechaRegistro: string
  ultimaActividad: string
  productos: number
  pedidos: number
  ventas: number
  comision: number
  logo?: string
}

// Mock data
const mockTiendas: Tienda[] = [
  {
    id: '1',
    nombre: 'Boutique Elegance',
    email: 'contacto@elegance.com',
    telefono: '+57 300 123 4567',
    direccion: 'Calle 85 #15-20',
    ciudad: 'Bogotá',
    estado: 'activa',
    fechaRegistro: '2024-01-15',
    ultimaActividad: '2024-12-20',
    productos: 245,
    pedidos: 1250,
    ventas: 45000000,
    comision: 2250000
  },
  {
    id: '2',
    nombre: 'Fashion Store',
    email: 'info@fashionstore.co',
    telefono: '+57 301 987 6543',
    direccion: 'Carrera 13 #45-67',
    ciudad: 'Medellín',
    estado: 'activa',
    fechaRegistro: '2024-02-20',
    ultimaActividad: '2024-12-19',
    productos: 180,
    pedidos: 890,
    ventas: 32000000,
    comision: 1600000
  },
  {
    id: '3',
    nombre: 'Urban Style',
    email: 'ventas@urbanstyle.com',
    telefono: '+57 302 456 7890',
    direccion: 'Avenida 19 #123-45',
    ciudad: 'Cali',
    estado: 'pendiente',
    fechaRegistro: '2024-12-18',
    ultimaActividad: '2024-12-18',
    productos: 0,
    pedidos: 0,
    ventas: 0,
    comision: 0
  },
  {
    id: '4',
    nombre: 'Trendy Clothes',
    email: 'admin@trendy.co',
    telefono: '+57 303 789 0123',
    direccion: 'Calle 72 #8-15',
    ciudad: 'Barranquilla',
    estado: 'suspendida',
    fechaRegistro: '2024-03-10',
    ultimaActividad: '2024-11-30',
    productos: 95,
    pedidos: 340,
    ventas: 12000000,
    comision: 600000
  }
]

const estadoConfig = {
  activa: {
    label: 'Activa',
    icon: CheckCircle,
    className: 'bg-green-100 text-green-800 border-green-200'
  },
  pendiente: {
    label: 'Pendiente',
    icon: Clock,
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  suspendida: {
    label: 'Suspendida',
    icon: AlertCircle,
    className: 'bg-red-100 text-red-800 border-red-200'
  },
  inactiva: {
    label: 'Inactiva',
    icon: AlertCircle,
    className: 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function TiendasDataTable() {
  const [tiendas, setTiendas] = useState<Tienda[]>(mockTiendas)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const [selectedTiendas, setSelectedTiendas] = useState<string[]>([])

  // Filter logic
  const filteredTiendas = tiendas.filter(tienda => {
    const matchesSearch = tienda.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tienda.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tienda.ciudad.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterEstado === 'todos' || tienda.estado === filterEstado
    
    return matchesSearch && matchesFilter
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTiendas(filteredTiendas.map(t => t.id))
    } else {
      setSelectedTiendas([])
    }
  }

  const handleSelectTienda = (tiendaId: string, checked: boolean) => {
    if (checked) {
      setSelectedTiendas([...selectedTiendas, tiendaId])
    } else {
      setSelectedTiendas(selectedTiendas.filter(id => id !== tiendaId))
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar tiendas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos los estados</option>
            <option value="activa">Activas</option>
            <option value="pendiente">Pendientes</option>
            <option value="suspendida">Suspendidas</option>
            <option value="inactiva">Inactivas</option>
          </select>
        </div>

        {selectedTiendas.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Exportar ({selectedTiendas.length})
            </Button>
            <Button variant="outline" size="sm">
              Acciones masivas
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tiendas</p>
              <p className="text-2xl font-bold text-gray-900">{tiendas.length}</p>
            </div>
            <Store className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activas</p>
              <p className="text-2xl font-bold text-green-600">
                {tiendas.filter(t => t.estado === 'activa').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {tiendas.filter(t => t.estado === 'pendiente').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas Total</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(tiendas.reduce((sum, t) => sum + t.ventas, 0))}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTiendas.length === filteredTiendas.length && filteredTiendas.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tienda
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ventas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comisión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Actividad
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTiendas.map((tienda) => {
                const EstadoIcon = estadoConfig[tienda.estado].icon
                return (
                  <tr key={tienda.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedTiendas.includes(tienda.id)}
                        onChange={(e) => handleSelectTienda(tienda.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Store className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{tienda.nombre}</div>
                          <div className="text-sm text-gray-500">{tienda.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${estadoConfig[tienda.estado].className}`}>
                        <EstadoIcon className="w-3 h-3 mr-1" />
                        {estadoConfig[tienda.estado].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{tienda.ciudad}</div>
                      <div className="text-gray-500 text-xs">{tienda.direccion}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-gray-400 mr-1" />
                        {tienda.productos.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{formatCurrency(tienda.ventas)}</div>
                      <div className="text-gray-500 text-xs">{tienda.pedidos} pedidos</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                      {formatCurrency(tienda.comision)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(tienda.ultimaActividad)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/tiendas/${tienda.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/tiendas/${tienda.id}/editar`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredTiendas.length === 0 && (
          <div className="text-center py-12">
            <Store className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron tiendas</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || filterEstado !== 'todos' 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza agregando una nueva tienda'
              }
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredTiendas.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{filteredTiendas.length}</span> de{' '}
            <span className="font-medium">{tiendas.length}</span> tiendas
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
            <Button variant="outline" size="sm" disabled>
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}