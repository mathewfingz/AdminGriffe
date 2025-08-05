import { Metadata } from 'next'
import { Button } from '@admin-griffe/ui'
import { 
  ShoppingCart, 
  Package, 
  Users, 
  TrendingUp, 
  DollarSign,
  Eye,
  Plus,
  BarChart3,
  Calendar,
  Clock,
  Star,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Dashboard | Mi Tienda',
  description: 'Panel de control de mi tienda'
}

// Mock data para el dashboard
const mockData = {
  stats: {
    ventasHoy: 2450000,
    pedidosHoy: 23,
    productosActivos: 156,
    clientesNuevos: 8,
    ventasMes: 45600000,
    pedidosMes: 342,
    calificacionPromedio: 4.8,
    inventarioBajo: 12
  },
  recentOrders: [
    {
      id: 'PED-001',
      cliente: 'María González',
      productos: 3,
      total: 125000,
      estado: 'pendiente',
      fecha: '2024-01-15T10:30:00Z'
    },
    {
      id: 'PED-002',
      cliente: 'Carlos Rodríguez',
      productos: 1,
      total: 89000,
      estado: 'procesando',
      fecha: '2024-01-15T09:15:00Z'
    },
    {
      id: 'PED-003',
      cliente: 'Ana Martínez',
      productos: 2,
      total: 156000,
      estado: 'enviado',
      fecha: '2024-01-15T08:45:00Z'
    },
    {
      id: 'PED-004',
      cliente: 'Luis Pérez',
      productos: 4,
      total: 234000,
      estado: 'entregado',
      fecha: '2024-01-14T16:20:00Z'
    }
  ],
  topProducts: [
    {
      id: 1,
      nombre: 'Camiseta Básica',
      ventas: 45,
      ingresos: 1350000,
      stock: 23
    },
    {
      id: 2,
      nombre: 'Jeans Clásicos',
      ventas: 32,
      ingresos: 2560000,
      stock: 15
    },
    {
      id: 3,
      nombre: 'Zapatillas Deportivas',
      ventas: 28,
      ingresos: 3360000,
      stock: 8
    }
  ]
}

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
    enviado: { label: 'Enviado', className: 'bg-purple-100 text-purple-800', icon: TrendingUp },
    entregado: { label: 'Entregado', className: 'bg-green-100 text-green-800', icon: CheckCircle }
  }
  return configs[estado as keyof typeof configs] || configs.pendiente
}

export default function TiendaDashboard() {
  const { stats, recentOrders, topProducts } = mockData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Bienvenido de vuelta, aquí tienes un resumen de tu tienda</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Ver Reportes
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas Hoy</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.ventasHoy)}</p>
              <p className="text-xs text-gray-500 mt-1">{stats.pedidosHoy} pedidos</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Productos Activos</p>
              <p className="text-2xl font-bold text-blue-600">{stats.productosActivos}</p>
              <p className="text-xs text-red-500 mt-1">{stats.inventarioBajo} con stock bajo</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes Nuevos</p>
              <p className="text-2xl font-bold text-purple-600">{stats.clientesNuevos}</p>
              <p className="text-xs text-gray-500 mt-1">Este mes</p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Calificación</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.calificacionPromedio}</p>
              <p className="text-xs text-gray-500 mt-1">Promedio</p>
            </div>
            <Star className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Monthly Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Resumen del Mes</h2>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Ver Detalles
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Ventas Totales</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stats.ventasMes)}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Pedidos Totales</p>
              <p className="text-xl font-bold text-blue-600">{stats.pedidosMes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alertas</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">Stock Bajo</p>
                <p className="text-xs text-red-600">{stats.inventarioBajo} productos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800">Pedidos Pendientes</p>
                <p className="text-xs text-yellow-600">{recentOrders.filter(o => o.estado === 'pendiente').length} por procesar</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pedidos Recientes</h2>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Ver Todos
            </Button>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const estadoConfig = getEstadoConfig(order.estado)
              const EstadoIcon = estadoConfig.icon
              
              return (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{order.id}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${estadoConfig.className}`}>
                        <EstadoIcon className="w-3 h-3 mr-1" />
                        {estadoConfig.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{order.cliente}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.fecha)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-gray-500">{order.productos} productos</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Productos Más Vendidos</h2>
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Ver Análisis
            </Button>
          </div>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.nombre}</p>
                    <p className="text-sm text-gray-600">{product.ventas} ventas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatCurrency(product.ingresos)}</p>
                  <p className="text-xs text-gray-500">Stock: {product.stock}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}