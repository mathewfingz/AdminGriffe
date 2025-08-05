'use client'

import { useState } from 'react'
import { Button } from '@admin-griffe/ui'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit,
  Users,
  UserPlus,
  Star,
  ShoppingCart,
  Calendar,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'

// Mock data para clientes
const mockClientes = [
  {
    id: 1,
    nombre: 'María González',
    email: 'maria@email.com',
    telefono: '+57 300 123 4567',
    ciudad: 'Bogotá',
    fechaRegistro: '2024-01-10T00:00:00Z',
    ultimaCompra: '2024-01-15T10:30:00Z',
    totalPedidos: 8,
    totalGastado: 1250000,
    estado: 'activo',
    segmento: 'premium',
    calificacion: 4.8
  },
  {
    id: 2,
    nombre: 'Carlos Rodríguez',
    email: 'carlos@email.com',
    telefono: '+57 301 234 5678',
    ciudad: 'Medellín',
    fechaRegistro: '2024-01-08T00:00:00Z',
    ultimaCompra: '2024-01-15T09:15:00Z',
    totalPedidos: 5,
    totalGastado: 680000,
    estado: 'activo',
    segmento: 'regular',
    calificacion: 4.5
  },
  {
    id: 3,
    nombre: 'Ana Martínez',
    email: 'ana@email.com',
    telefono: '+57 302 345 6789',
    ciudad: 'Cali',
    fechaRegistro: '2024-01-05T00:00:00Z',
    ultimaCompra: '2024-01-15T08:45:00Z',
    totalPedidos: 12,
    totalGastado: 2100000,
    estado: 'activo',
    segmento: 'vip',
    calificacion: 5.0
  },
  {
    id: 4,
    nombre: 'Luis Pérez',
    email: 'luis@email.com',
    telefono: '+57 303 456 7890',
    ciudad: 'Barranquilla',
    fechaRegistro: '2024-01-03T00:00:00Z',
    ultimaCompra: '2024-01-14T16:20:00Z',
    totalPedidos: 3,
    totalGastado: 450000,
    estado: 'activo',
    segmento: 'nuevo',
    calificacion: 4.2
  },
  {
    id: 5,
    nombre: 'Sofia Herrera',
    email: 'sofia@email.com',
    telefono: '+57 304 567 8901',
    ciudad: 'Bucaramanga',
    fechaRegistro: '2024-01-01T00:00:00Z',
    ultimaCompra: '2023-12-20T00:00:00Z',
    totalPedidos: 2,
    totalGastado: 180000,
    estado: 'inactivo',
    segmento: 'nuevo',
    calificacion: 4.0
  },
  {
    id: 6,
    nombre: 'Diego Morales',
    email: 'diego@email.com',
    telefono: '+57 305 678 9012',
    ciudad: 'Cartagena',
    fechaRegistro: '2023-12-15T00:00:00Z',
    ultimaCompra: '2024-01-12T00:00:00Z',
    totalPedidos: 15,
    totalGastado: 3200000,
    estado: 'activo',
    segmento: 'vip',
    calificacion: 4.9
  }
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const getSegmentoConfig = (segmento: string) => {
  const configs = {
    nuevo: { label: 'Nuevo', className: 'bg-blue-100 text-blue-800' },
    regular: { label: 'Regular', className: 'bg-gray-100 text-gray-800' },
    premium: { label: 'Premium', className: 'bg-purple-100 text-purple-800' },
    vip: { label: 'VIP', className: 'bg-yellow-100 text-yellow-800' }
  }
  return configs[segmento as keyof typeof configs] || configs.nuevo
}

const getEstadoConfig = (estado: string) => {
  const configs = {
    activo: { label: 'Activo', className: 'bg-green-100 text-green-800' },
    inactivo: { label: 'Inactivo', className: 'bg-red-100 text-red-800' }
  }
  return configs[estado as keyof typeof configs] || configs.activo
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState(mockClientes)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSegmento, setFilterSegmento] = useState('todos')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [selectedClientes, setSelectedClientes] = useState<number[]>([])

  // Filter logic
  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.ciudad.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSegmento = filterSegmento === 'todos' || cliente.segmento === filterSegmento
    const matchesEstado = filterEstado === 'todos' || cliente.estado === filterEstado
    
    return matchesSearch && matchesSegmento && matchesEstado
  })

  const segmentos = [...new Set(clientes.map(c => c.segmento))]
  const estados = [...new Set(clientes.map(c => c.estado))]

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClientes(filteredClientes.map(c => c.id))
    } else {
      setSelectedClientes([])
    }
  }

  const handleSelectCliente = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedClientes([...selectedClientes, id])
    } else {
      setSelectedClientes(selectedClientes.filter(cid => cid !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600">Gestiona tu base de clientes</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            Enviar Email
          </Button>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clientes</p>
              <p className="text-2xl font-bold text-blue-600">{clientes.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes Activos</p>
              <p className="text-2xl font-bold text-green-600">
                {clientes.filter(c => c.estado === 'activo').length}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes VIP</p>
              <p className="text-2xl font-bold text-yellow-600">
                {clientes.filter(c => c.segmento === 'vip').length}
              </p>
            </div>
            <Star className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(clientes.reduce((sum, c) => sum + c.totalGastado, 0))}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterSegmento}
              onChange={(e) => setFilterSegmento(e.target.value)}
            >
              <option value="todos">Todos los segmentos</option>
              {segmentos.map(segmento => (
                <option key={segmento} value={segmento}>{getSegmentoConfig(segmento).label}</option>
              ))}
            </select>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              {estados.map(estado => (
                <option key={estado} value={estado}>{getEstadoConfig(estado).label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            {selectedClientes.length > 0 && (
              <Button variant="outline" size="sm">
                Acciones ({selectedClientes.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedClientes.length === filteredClientes.length && filteredClientes.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedidos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Gastado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Segmento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Compra
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClientes.map((cliente) => {
                const segmentoConfig = getSegmentoConfig(cliente.segmento)
                const estadoConfig = getEstadoConfig(cliente.estado)
                
                return (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedClientes.includes(cliente.id)}
                        onChange={(e) => handleSelectCliente(cliente.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {cliente.nombre.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{cliente.nombre}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Star className="w-3 h-3 text-yellow-400 mr-1" />
                            {cliente.calificacion}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <Mail className="w-3 h-3 text-gray-400 mr-1" />
                          {cliente.email}
                        </div>
                        <div className="flex items-center mb-1">
                          <Phone className="w-3 h-3 text-gray-400 mr-1" />
                          {cliente.telefono}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 text-gray-400 mr-1" />
                          {cliente.ciudad}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <ShoppingCart className="w-4 h-4 text-gray-400 mr-1" />
                        {cliente.totalPedidos}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(cliente.totalGastado)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${segmentoConfig.className}`}>
                        {segmentoConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoConfig.className}`}>
                        {estadoConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                        {formatDate(cliente.ultimaCompra)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/tienda/clientes/${cliente.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/tienda/clientes/${cliente.id}/editar`}>
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

        {filteredClientes.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay clientes</h3>
            <p className="mt-1 text-sm text-gray-500">
              Los clientes aparecerán aquí cuando realicen su primera compra.
            </p>
            <div className="mt-6">
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Nuevo Cliente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredClientes.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{filteredClientes.length}</span> de{' '}
            <span className="font-medium">{clientes.length}</span> clientes
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