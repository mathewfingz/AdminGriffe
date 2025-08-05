'use client'

import { useState } from 'react'
import { Button } from '@admin-griffe/ui'
import { 
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  RefreshCw,
  FileText,
  Mail,
  Clock
} from 'lucide-react'

// Mock data para reportes
const mockData = {
  ventas: {
    total: 15750000,
    cambio: 12.5,
    datos: [
      { fecha: '2024-01-01', ventas: 850000 },
      { fecha: '2024-01-02', ventas: 920000 },
      { fecha: '2024-01-03', ventas: 780000 },
      { fecha: '2024-01-04', ventas: 1100000 },
      { fecha: '2024-01-05', ventas: 950000 },
      { fecha: '2024-01-06', ventas: 1200000 },
      { fecha: '2024-01-07', ventas: 1050000 }
    ]
  },
  pedidos: {
    total: 156,
    cambio: 8.3,
    completados: 142,
    pendientes: 14
  },
  productos: {
    masVendidos: [
      { nombre: 'Camiseta Básica', ventas: 45, ingresos: 1350000 },
      { nombre: 'Jeans Slim Fit', ventas: 32, ingresos: 2560000 },
      { nombre: 'Zapatillas Deportivas', ventas: 28, ingresos: 2800000 },
      { nombre: 'Chaqueta Denim', ventas: 22, ingresos: 1980000 },
      { nombre: 'Vestido Casual', ventas: 18, ingresos: 1440000 }
    ],
    categorias: [
      { categoria: 'Ropa', porcentaje: 65, ventas: 3250000 },
      { categoria: 'Calzado', porcentaje: 25, ventas: 1250000 },
      { categoria: 'Accesorios', porcentaje: 10, ventas: 500000 }
    ]
  },
  clientes: {
    nuevos: 23,
    recurrentes: 89,
    topClientes: [
      { nombre: 'María González', pedidos: 8, total: 1250000 },
      { nombre: 'Carlos Rodríguez', pedidos: 5, total: 680000 },
      { nombre: 'Ana Martínez', pedidos: 12, total: 2100000 }
    ]
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount)
}

export default function ReportesTiendaPage() {
  const [periodo, setPeriodo] = useState('7d')
  const [tipoReporte, setTipoReporte] = useState('ventas')

  const periodos = [
    { value: '7d', label: 'Últimos 7 días' },
    { value: '30d', label: 'Últimos 30 días' },
    { value: '90d', label: 'Últimos 3 meses' },
    { value: '1y', label: 'Último año' }
  ]

  const tiposReporte = [
    { value: 'ventas', label: 'Ventas', icon: DollarSign },
    { value: 'pedidos', label: 'Pedidos', icon: ShoppingCart },
    { value: 'productos', label: 'Productos', icon: Package },
    { value: 'clientes', label: 'Clientes', icon: Users }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600">Analiza el rendimiento de tu tienda</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            Programar
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Período
              </label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
              >
                {periodos.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de reporte
              </label>
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={tipoReporte}
                onChange={(e) => setTipoReporte(e.target.value)}
              >
                {tiposReporte.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha personalizada
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="date"
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Más filtros
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(mockData.ventas.total)}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+{mockData.ventas.cambio}%</span>
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pedidos</p>
              <p className="text-2xl font-bold text-gray-900">{mockData.pedidos.total}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+{mockData.pedidos.cambio}%</span>
              </div>
            </div>
            <ShoppingCart className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Nuevos Clientes</p>
              <p className="text-2xl font-bold text-gray-900">{mockData.clientes.nuevos}</p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+15.3%</span>
              </div>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Productos Vendidos</p>
              <p className="text-2xl font-bold text-gray-900">
                {mockData.productos.masVendidos.reduce((sum, p) => sum + p.ventas, 0)}
              </p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+7.2%</span>
              </div>
            </div>
            <Package className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Ventas por día</h3>
            <LineChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Gráfico de ventas diarias</p>
            </div>
          </div>
        </div>

        {/* Categories Chart */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Ventas por categoría</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {mockData.productos.categorias.map((categoria, index) => (
              <div key={categoria.categoria} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    index === 0 ? 'bg-blue-500' : 
                    index === 1 ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm text-gray-900">{categoria.categoria}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{categoria.porcentaje}%</div>
                  <div className="text-xs text-gray-500">{formatCurrency(categoria.ventas)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Productos más vendidos</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {mockData.productos.masVendidos.map((producto, index) => (
                <div key={producto.nombre} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                      <div className="text-xs text-gray-500">{producto.ventas} unidades</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(producto.ingresos)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Mejores clientes</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {mockData.clientes.topClientes.map((cliente, index) => (
                <div key={cliente.nombre} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-gray-600">{index + 1}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{cliente.nombre}</div>
                      <div className="text-xs text-gray-500">{cliente.pedidos} pedidos</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(cliente.total)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reports */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Reportes rápidos</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Reporte de ventas mensual
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Inventario bajo stock
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Análisis de clientes
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Productos sin ventas
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Reporte de devoluciones
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Análisis de rentabilidad
            </Button>
          </div>
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Reportes programados</h3>
            <Button size="sm">
              <Clock className="w-4 h-4 mr-2" />
              Nuevo
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-900">Reporte semanal de ventas</div>
                <div className="text-xs text-gray-500">Cada lunes a las 9:00 AM</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Activo
                </span>
                <Button variant="outline" size="sm">
                  Editar
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <div className="text-sm font-medium text-gray-900">Análisis mensual de productos</div>
                <div className="text-xs text-gray-500">Primer día de cada mes a las 8:00 AM</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Activo
                </span>
                <Button variant="outline" size="sm">
                  Editar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}