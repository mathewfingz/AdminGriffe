'use client'

import { useState } from 'react'
import { Button } from '@admin-griffe/ui'
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  MessageSquare, 
  Clock, 
  MapPin, 
  User,
  Store,
  Package,
  Truck,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface Pedido {
  id: string
  numero: string
  cliente: {
    nombre: string
    email: string
    telefono: string
  }
  tienda: {
    nombre: string
    id: string
  }
  productos: {
    nombre: string
    cantidad: number
    precio: number
  }[]
  total: number
  estado: 'pendiente' | 'confirmado' | 'preparando' | 'enviado' | 'entregado' | 'cancelado'
  fechaCreacion: string
  fechaEntrega?: string
  direccionEntrega: string
  metodoPago: string
  notas?: string
  prioridad: 'baja' | 'media' | 'alta'
}

interface KanbanColumn {
  id: string
  title: string
  color: string
  icon: React.ReactNode
  pedidos: Pedido[]
}

// Mock data
const mockPedidos: Pedido[] = [
  {
    id: '1',
    numero: 'PED-2024-001',
    cliente: {
      nombre: 'María González',
      email: 'maria@email.com',
      telefono: '+57 300 123 4567'
    },
    tienda: {
      nombre: 'Boutique Elegance',
      id: '1'
    },
    productos: [
      { nombre: 'Vestido Floral', cantidad: 1, precio: 120000 },
      { nombre: 'Zapatos Negros', cantidad: 1, precio: 80000 }
    ],
    total: 200000,
    estado: 'pendiente',
    fechaCreacion: '2024-01-15T10:30:00Z',
    direccionEntrega: 'Calle 85 #15-20, Bogotá',
    metodoPago: 'Tarjeta de Crédito',
    prioridad: 'alta'
  },
  {
    id: '2',
    numero: 'PED-2024-002',
    cliente: {
      nombre: 'Carlos Rodríguez',
      email: 'carlos@email.com',
      telefono: '+57 301 234 5678'
    },
    tienda: {
      nombre: 'Tech Store',
      id: '2'
    },
    productos: [
      { nombre: 'Smartphone', cantidad: 1, precio: 800000 }
    ],
    total: 800000,
    estado: 'confirmado',
    fechaCreacion: '2024-01-15T09:15:00Z',
    direccionEntrega: 'Carrera 15 #85-40, Medellín',
    metodoPago: 'PSE',
    prioridad: 'media'
  },
  {
    id: '3',
    numero: 'PED-2024-003',
    cliente: {
      nombre: 'Ana Martínez',
      email: 'ana@email.com',
      telefono: '+57 302 345 6789'
    },
    tienda: {
      nombre: 'Fashion Hub',
      id: '3'
    },
    productos: [
      { nombre: 'Jeans', cantidad: 2, precio: 90000 },
      { nombre: 'Camiseta', cantidad: 3, precio: 45000 }
    ],
    total: 315000,
    estado: 'preparando',
    fechaCreacion: '2024-01-14T16:45:00Z',
    direccionEntrega: 'Avenida 68 #25-10, Cali',
    metodoPago: 'Efectivo',
    prioridad: 'baja'
  },
  {
    id: '4',
    numero: 'PED-2024-004',
    cliente: {
      nombre: 'Luis Herrera',
      email: 'luis@email.com',
      telefono: '+57 303 456 7890'
    },
    tienda: {
      nombre: 'Sports World',
      id: '4'
    },
    productos: [
      { nombre: 'Tenis Deportivos', cantidad: 1, precio: 250000 }
    ],
    total: 250000,
    estado: 'enviado',
    fechaCreacion: '2024-01-14T11:20:00Z',
    fechaEntrega: '2024-01-16T14:00:00Z',
    direccionEntrega: 'Calle 100 #50-25, Barranquilla',
    metodoPago: 'Transferencia',
    prioridad: 'media'
  }
]

const columns: Omit<KanbanColumn, 'pedidos'>[] = [
  {
    id: 'pendiente',
    title: 'Pendientes',
    color: 'bg-yellow-50 border-yellow-200',
    icon: <Clock className="h-5 w-5 text-yellow-600" />
  },
  {
    id: 'confirmado',
    title: 'Confirmados',
    color: 'bg-blue-50 border-blue-200',
    icon: <CheckCircle className="h-5 w-5 text-blue-600" />
  },
  {
    id: 'preparando',
    title: 'En Preparación',
    color: 'bg-orange-50 border-orange-200',
    icon: <Package className="h-5 w-5 text-orange-600" />
  },
  {
    id: 'enviado',
    title: 'Enviados',
    color: 'bg-purple-50 border-purple-200',
    icon: <Truck className="h-5 w-5 text-purple-600" />
  },
  {
    id: 'entregado',
    title: 'Entregados',
    color: 'bg-green-50 border-green-200',
    icon: <CheckCircle className="h-5 w-5 text-green-600" />
  }
]

interface PedidosKanbanBoardProps {
  searchTerm: string
}

export function PedidosKanbanBoard({ searchTerm }: PedidosKanbanBoardProps) {
  const [pedidos] = useState<Pedido[]>(mockPedidos)

  // Filter pedidos based on search term
  const filteredPedidos = pedidos.filter(pedido =>
    pedido.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pedido.tienda.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group pedidos by status
  const kanbanColumns: KanbanColumn[] = columns.map(column => ({
    ...column,
    pedidos: filteredPedidos.filter(pedido => pedido.estado === column.id)
  }))

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

  const getPriorityColor = (prioridad: string) => {
    const colors = {
      alta: 'bg-red-100 text-red-800',
      media: 'bg-yellow-100 text-yellow-800',
      baja: 'bg-green-100 text-green-800'
    }
    return colors[prioridad as keyof typeof colors] || colors.media
  }

  const PedidoCard = ({ pedido }: { pedido: Pedido }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{pedido.numero}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(pedido.prioridad)}`}>
              {pedido.prioridad.charAt(0).toUpperCase() + pedido.prioridad.slice(1)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cliente */}
      <div className="flex items-center gap-2 mb-2">
        <User className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-600">{pedido.cliente.nombre}</span>
      </div>

      {/* Tienda */}
      <div className="flex items-center gap-2 mb-2">
        <Store className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-600">{pedido.tienda.nombre}</span>
      </div>

      {/* Dirección */}
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-600 truncate">{pedido.direccionEntrega}</span>
      </div>

      {/* Productos */}
      <div className="mb-3">
        <p className="text-xs text-gray-500 mb-1">Productos:</p>
        <div className="space-y-1">
          {pedido.productos.slice(0, 2).map((producto, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-600 truncate">
                {producto.cantidad}x {producto.nombre}
              </span>
              <span className="text-gray-900 font-medium">
                {formatCurrency(producto.precio * producto.cantidad)}
              </span>
            </div>
          ))}
          {pedido.productos.length > 2 && (
            <p className="text-xs text-gray-500">
              +{pedido.productos.length - 2} productos más
            </p>
          )}
        </div>
      </div>

      {/* Total */}
      <div className="flex justify-between items-center mb-3 pt-2 border-t border-gray-100">
        <span className="text-sm font-medium text-gray-600">Total:</span>
        <span className="text-lg font-bold text-gray-900">
          {formatCurrency(pedido.total)}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatDate(pedido.fechaCreacion)}</span>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3 w-3" />
          <span>2</span>
        </div>
      </div>

      {/* Fecha de entrega si está enviado */}
      {pedido.fechaEntrega && (
        <div className="mt-2 p-2 bg-purple-50 rounded text-xs">
          <div className="flex items-center gap-1">
            <Truck className="h-3 w-3 text-purple-600" />
            <span className="text-purple-700">
              Entrega: {formatDate(pedido.fechaEntrega)}
            </span>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex gap-6 overflow-x-auto pb-4">
      {kanbanColumns.map((column) => (
        <div key={column.id} className="flex-shrink-0 w-80">
          {/* Column Header */}
          <div className={`rounded-lg border p-4 mb-4 ${column.color}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {column.icon}
                <h2 className="font-semibold text-gray-900">{column.title}</h2>
              </div>
              <span className="bg-white px-2 py-1 rounded-full text-sm font-medium text-gray-600">
                {column.pedidos.length}
              </span>
            </div>
          </div>

          {/* Column Content */}
          <div className="space-y-4 min-h-[400px]">
            {column.pedidos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No hay pedidos en esta etapa</p>
              </div>
            ) : (
              column.pedidos.map((pedido) => (
                <PedidoCard key={pedido.id} pedido={pedido} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}