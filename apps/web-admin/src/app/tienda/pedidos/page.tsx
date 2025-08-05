'use client'

import { useState } from 'react'
import { Button } from '@admin-griffe/ui'
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Package,
  Clock,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  User,
  Calendar,
  DollarSign,
  Truck,
  MapPin
} from 'lucide-react'
import Link from 'next/link'

// Mock data para pedidos
const mockPedidos = [
  {
    id: 'PED-001',
    cliente: {
      nombre: 'María González',
      email: 'maria@email.com',
      telefono: '+57 300 123 4567'
    },
    productos: [
      { nombre: 'Camiseta Básica', cantidad: 2, precio: 45000 },
      { nombre: 'Jeans Clásicos', cantidad: 1, precio: 89000 }
    ],
    total: 179000,
    estado: 'pendiente',
    metodoPago: 'tarjeta',
    direccion: 'Calle 123 #45-67, Bogotá',
    fecha: '2024-01-15T10:30:00Z',
    fechaEntrega: '2024-01-18T00:00:00Z',
    notas: 'Entregar en horario de oficina'
  },
  {
    id: 'PED-002',
    cliente: {
      nombre: 'Carlos Rodríguez',
      email: 'carlos@email.com',
      telefono: '+57 301 234 5678'
    },
    productos: [
      { nombre: 'Zapatillas Deportivas', cantidad: 1, precio: 120000 }
    ],
    total: 120000,
    estado: 'procesando',
    metodoPago: 'efectivo',
    direccion: 'Carrera 45 #12-34, Medellín',
    fecha: '2024-01-15T09:15:00Z',
    fechaEntrega: '2024-01-17T00:00:00Z',
    notas: ''
  },
  {
    id: 'PED-003',
    cliente: {
      nombre: 'Ana Martínez',
      email: 'ana@email.com',
      telefono: '+57 302 345 6789'
    },
    productos: [
      { nombre: 'Chaqueta de Cuero', cantidad: 1, precio: 250000 },
      { nombre: 'Gorra Deportiva', cantidad: 2, precio: 35000 }
    ],
    total: 320000,
    estado: 'enviado',
    metodoPago: 'transferencia',
    direccion: 'Avenida 68 #23-45, Cali',
    fecha: '2024-01-15T08:45:00Z',
    fechaEntrega: '2024-01-16T00:00:00Z',
    notas: 'Llamar antes de entregar'
  },
  {
    id: 'PED-004',
    cliente: {
      nombre: 'Luis Pérez',
      email: 'luis@email.com',
      telefono: '+57 303 456 7890'
    },
    productos: [
      { nombre: 'Camiseta Básica', cantidad: 3, precio: 45000 },
      { nombre: 'Jeans Clásicos', cantidad: 2, precio: 89000 }
    ],
    total: 313000,
    estado: 'entregado',
    metodoPago: 'tarjeta',
    direccion: 'Calle 85 #15-30, Barranquilla',
    fecha: '2024-01-14T16:20:00Z',
    fechaEntrega: '2024-01-15T00:00:00Z',
    notas: ''
  },
  {
    id: 'PED-005',
    cliente: {
      nombre: 'Sofia Herrera',
      email: 'sofia@email.com',
      telefono: '+57 304 567 8901'
    },
    productos: [
      { nombre: 'Gorra Deportiva', cantidad: 1, precio: 35000 }
    ],
    total: 35000,
    estado: 'cancelado',
    metodoPago: 'tarjeta',
    direccion: 'Carrera 7 #45-12, Bucaramanga',
    fecha: '2024-01-14T14:10:00Z',
    fechaEntrega: null,
    notas: 'Cliente canceló por cambio de talla'
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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getEstadoConfig = (estado: string) => {
  const configs = {
    pendiente: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
    procesando: { label: 'Procesando', className: 'bg-blue-100 text-blue-800', icon: Package },
    enviado: { label: 'Enviado', className: 'bg-purple-100 text-purple-800', icon: Truck },
    entregado: { label: 'Entregado', className: 'bg-green-100 text-green-800', icon: CheckCircle },
    cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-800', icon: AlertCircle }
  }
  return configs[estado as keyof typeof configs] || configs.pendiente
}

const getMetodoPagoLabel = (metodo: string) => {
  const metodos = {
    tarjeta: 'Tarjeta',
    efectivo: 'Efectivo',
    transferencia: 'Transferencia'
  }
  return metodos[metodo as keyof typeof metodos] || metodo
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState(mockPedidos)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [selectedPedidos, setSelectedPedidos] = useState<string[]>([])

  // Filter logic
  const filteredPedidos = pedidos.filter(pedido => {
    const matchesSearch = pedido.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pedido.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pedido.cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEstado = filterEstado === 'todos' || pedido.estado === filterEstado
    
    return matchesSearch && matchesEstado
  })

  const estados = [...new Set(pedidos.map(p => p.estado))]

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPedidos(filteredPedidos.map(p => p.id))
    } else {
      setSelectedPedidos([])
    }
  }

  const handleSelectPedido = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedPedidos([...selectedPedidos, id])
    } else {
      setSelectedPedidos(selectedPedidos.filter(pid => pid !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-600">Gestiona todos los pedidos de tu tienda</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Package className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pedidos</p>
              <p className="text-2xl font-bold text-blue-600">{pedidos.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {pedidos.filter(p => p.estado === 'pendiente').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Procesando</p>
              <p className="text-2xl font-bold text-blue-600">
                {pedidos.filter(p => p.estado === 'procesando').length}
              </p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Entregados</p>
              <p className="text-2xl font-bold text-green-600">
                {pedidos.filter(p => p.estado === 'entregado').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas Total</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(pedidos.filter(p => p.estado !== 'cancelado').reduce((sum, p) => sum + p.total, 0))}
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
                placeholder="Buscar pedidos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
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
            {selectedPedidos.length > 0 && (
              <Button variant="outline" size="sm">
                Acciones ({selectedPedidos.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedPedidos.length === filteredPedidos.length && filteredPedidos.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pedido
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPedidos.map((pedido) => {
                const estadoConfig = getEstadoConfig(pedido.estado)
                const EstadoIcon = estadoConfig.icon
                
                return (
                  <tr key={pedido.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedPedidos.includes(pedido.id)}
                        onChange={(e) => handleSelectPedido(pedido.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{pedido.id}</div>
                        <div className="text-sm text-gray-500">{getMetodoPagoLabel(pedido.metodoPago)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-8 w-8 flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{pedido.cliente.nombre}</div>
                          <div className="text-sm text-gray-500">{pedido.cliente.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {pedido.productos.length} producto{pedido.productos.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {pedido.productos.slice(0, 2).map(p => p.nombre).join(', ')}
                        {pedido.productos.length > 2 && '...'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(pedido.total)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoConfig.className}`}>
                        <EstadoIcon className="w-3 h-3 mr-1" />
                        {estadoConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                        {formatDate(pedido.fecha)}
                      </div>
                      {pedido.fechaEntrega && (
                        <div className="text-xs text-gray-500 mt-1">
                          Entrega: {new Date(pedido.fechaEntrega).toLocaleDateString('es-CO')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/tienda/pedidos/${pedido.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
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

        {filteredPedidos.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay pedidos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Los pedidos aparecerán aquí cuando los clientes realicen compras.
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredPedidos.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{filteredPedidos.length}</span> de{' '}
            <span className="font-medium">{pedidos.length}</span> pedidos
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