import { Metadata } from 'next'
import { Button } from '@admin-griffe/ui'
import { 
  Headphones, 
  Plus, 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  TrendingUp,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  MessageCircle,
  User,
  Calendar,
  Tag,
  ArrowUpDown
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Soporte | Admin Dashboard',
  description: 'Gestión de tickets y soporte al cliente'
}

interface Ticket {
  id: string
  titulo: string
  descripcion: string
  cliente: {
    nombre: string
    email: string
    tienda?: string
  }
  categoria: 'tecnico' | 'facturacion' | 'general' | 'producto'
  prioridad: 'baja' | 'media' | 'alta' | 'critica'
  estado: 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado'
  asignado?: string
  fechaCreacion: string
  ultimaRespuesta: string
  respuestas: number
}

export default function SoportePage() {
  // Mock tickets data
  const tickets: Ticket[] = [
    {
      id: 'TK-001',
      titulo: 'Error al procesar pago',
      descripcion: 'El sistema no procesa los pagos con tarjeta de crédito',
      cliente: {
        nombre: 'María González',
        email: 'maria@fashionstore.com',
        tienda: 'Fashion Store'
      },
      categoria: 'tecnico',
      prioridad: 'alta',
      estado: 'en_progreso',
      asignado: 'Carlos Rodríguez',
      fechaCreacion: '2024-01-20 09:30',
      ultimaRespuesta: '2024-01-20 14:15',
      respuestas: 3
    },
    {
      id: 'TK-002',
      titulo: 'Consulta sobre comisiones',
      descripcion: 'Necesito información sobre el cálculo de comisiones',
      cliente: {
        nombre: 'Luis Hernández',
        email: 'luis@techworld.com',
        tienda: 'Tech World'
      },
      categoria: 'facturacion',
      prioridad: 'media',
      estado: 'abierto',
      fechaCreacion: '2024-01-20 11:45',
      ultimaRespuesta: '2024-01-20 11:45',
      respuestas: 1
    },
    {
      id: 'TK-003',
      titulo: 'Problema con inventario',
      descripcion: 'Los productos no se actualizan correctamente en el inventario',
      cliente: {
        nombre: 'Ana Martínez',
        email: 'ana@beautycenter.com',
        tienda: 'Beauty Center'
      },
      categoria: 'producto',
      prioridad: 'media',
      estado: 'resuelto',
      asignado: 'Patricia Silva',
      fechaCreacion: '2024-01-19 16:20',
      ultimaRespuesta: '2024-01-20 10:30',
      respuestas: 5
    },
    {
      id: 'TK-004',
      titulo: 'Solicitud de nueva funcionalidad',
      descripcion: 'Me gustaría tener reportes más detallados',
      cliente: {
        nombre: 'Roberto Díaz',
        email: 'roberto@sportsgear.com',
        tienda: 'Sports Gear'
      },
      categoria: 'general',
      prioridad: 'baja',
      estado: 'abierto',
      fechaCreacion: '2024-01-20 08:15',
      ultimaRespuesta: '2024-01-20 08:15',
      respuestas: 1
    }
  ]

  const getCategoriaColor = (categoria: Ticket['categoria']) => {
    switch (categoria) {
      case 'tecnico':
        return 'bg-red-100 text-red-800'
      case 'facturacion':
        return 'bg-blue-100 text-blue-800'
      case 'producto':
        return 'bg-green-100 text-green-800'
      case 'general':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPrioridadColor = (prioridad: Ticket['prioridad']) => {
    switch (prioridad) {
      case 'critica':
        return 'bg-red-100 text-red-800'
      case 'alta':
        return 'bg-orange-100 text-orange-800'
      case 'media':
        return 'bg-yellow-100 text-yellow-800'
      case 'baja':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoColor = (estado: Ticket['estado']) => {
    switch (estado) {
      case 'abierto':
        return 'bg-blue-100 text-blue-800'
      case 'en_progreso':
        return 'bg-yellow-100 text-yellow-800'
      case 'resuelto':
        return 'bg-green-100 text-green-800'
      case 'cerrado':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoIcon = (estado: Ticket['estado']) => {
    switch (estado) {
      case 'abierto':
        return <AlertCircle className="h-4 w-4" />
      case 'en_progreso':
        return <Clock className="h-4 w-4" />
      case 'resuelto':
        return <CheckCircle className="h-4 w-4" />
      case 'cerrado':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  // Statistics
  const totalTickets = tickets.length
  const ticketsAbiertos = tickets.filter(t => t.estado === 'abierto').length
  const ticketsEnProgreso = tickets.filter(t => t.estado === 'en_progreso').length
  const ticketsResueltos = tickets.filter(t => t.estado === 'resuelto').length
  const tiempoRespuestaPromedio = '2.5h'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Soporte</h1>
          <p className="text-gray-600">Gestión de tickets y atención al cliente</p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Ticket
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Headphones className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600">+12%</span>
            <span className="text-gray-600 ml-1">vs mes anterior</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Abiertos</p>
              <p className="text-2xl font-bold text-blue-600">{ticketsAbiertos}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Requieren atención
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Progreso</p>
              <p className="text-2xl font-bold text-yellow-600">{ticketsEnProgreso}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Siendo atendidos
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resueltos</p>
              <p className="text-2xl font-bold text-green-600">{ticketsResueltos}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Últimas 24h
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tiempo Promedio</p>
              <p className="text-2xl font-bold text-purple-600">{tiempoRespuestaPromedio}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Primera respuesta
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg border">
        {/* Table Header */}
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar tickets..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="todos">Todos los estados</option>
                <option value="abierto">Abiertos</option>
                <option value="en_progreso">En Progreso</option>
                <option value="resuelto">Resueltos</option>
                <option value="cerrado">Cerrados</option>
              </select>
              
              <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="todas">Todas las categorías</option>
                <option value="tecnico">Técnico</option>
                <option value="facturacion">Facturación</option>
                <option value="producto">Producto</option>
                <option value="general">General</option>
              </select>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 p-1 rounded">
                    Ticket
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asignado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Actividad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-blue-600">{ticket.id}</span>
                        {ticket.respuestas > 1 && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            {ticket.respuestas}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-gray-900 mt-1">{ticket.titulo}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{ticket.descripcion}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {ticket.cliente.nombre.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{ticket.cliente.nombre}</div>
                          <div className="text-sm text-gray-500">{ticket.cliente.email}</div>
                        </div>
                      </div>
                      {ticket.cliente.tienda && (
                        <div className="text-xs text-gray-500 mt-1">{ticket.cliente.tienda}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoriaColor(ticket.categoria)}`}>
                      {ticket.categoria.charAt(0).toUpperCase() + ticket.categoria.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadColor(ticket.prioridad)}`}>
                      {ticket.prioridad.charAt(0).toUpperCase() + ticket.prioridad.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getEstadoIcon(ticket.estado)}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(ticket.estado)}`}>
                        {ticket.estado.replace('_', ' ').charAt(0).toUpperCase() + ticket.estado.replace('_', ' ').slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ticket.asignado ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{ticket.asignado}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Sin asignar</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {ticket.ultimaRespuesta}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-900" title="Ver ticket">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900" title="Responder">
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {tickets.length} de {tickets.length} tickets
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
            <Button variant="outline" size="sm">
              1
            </Button>
            <Button variant="outline" size="sm" disabled>
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}