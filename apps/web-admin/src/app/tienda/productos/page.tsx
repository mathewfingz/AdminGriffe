'use client'

import { useState } from 'react'
import { Button } from '@admin-griffe/ui'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react'
import Link from 'next/link'

// Mock data para productos
const mockProductos = [
  {
    id: 1,
    nombre: 'Camiseta Básica Blanca',
    categoria: 'Ropa',
    precio: 45000,
    stock: 23,
    estado: 'activo',
    ventas: 45,
    imagen: '/placeholder-product.jpg',
    fechaCreacion: '2024-01-10',
    sku: 'CAM-001'
  },
  {
    id: 2,
    nombre: 'Jeans Clásicos Azules',
    categoria: 'Ropa',
    precio: 89000,
    stock: 15,
    estado: 'activo',
    ventas: 32,
    imagen: '/placeholder-product.jpg',
    fechaCreacion: '2024-01-08',
    sku: 'JEA-002'
  },
  {
    id: 3,
    nombre: 'Zapatillas Deportivas',
    categoria: 'Calzado',
    precio: 120000,
    stock: 8,
    estado: 'stock_bajo',
    ventas: 28,
    imagen: '/placeholder-product.jpg',
    fechaCreacion: '2024-01-05',
    sku: 'ZAP-003'
  },
  {
    id: 4,
    nombre: 'Chaqueta de Cuero',
    categoria: 'Ropa',
    precio: 250000,
    stock: 0,
    estado: 'agotado',
    ventas: 12,
    imagen: '/placeholder-product.jpg',
    fechaCreacion: '2024-01-03',
    sku: 'CHA-004'
  },
  {
    id: 5,
    nombre: 'Gorra Deportiva',
    categoria: 'Accesorios',
    precio: 35000,
    stock: 45,
    estado: 'activo',
    ventas: 67,
    imagen: '/placeholder-product.jpg',
    fechaCreacion: '2024-01-01',
    sku: 'GOR-005'
  }
]

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount)
}

const getEstadoConfig = (estado: string) => {
  const configs = {
    activo: { label: 'Activo', className: 'bg-green-100 text-green-800', icon: CheckCircle },
    stock_bajo: { label: 'Stock Bajo', className: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
    agotado: { label: 'Agotado', className: 'bg-red-100 text-red-800', icon: Minus },
    inactivo: { label: 'Inactivo', className: 'bg-gray-100 text-gray-800', icon: Clock }
  }
  return configs[estado as keyof typeof configs] || configs.activo
}

export default function ProductosPage() {
  const [productos, setProductos] = useState(mockProductos)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState('todas')
  const [filterEstado, setFilterEstado] = useState('todos')
  const [selectedProductos, setSelectedProductos] = useState<number[]>([])

  // Filter logic
  const filteredProductos = productos.filter(producto => {
    const matchesSearch = producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         producto.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategoria = filterCategoria === 'todas' || producto.categoria === filterCategoria
    const matchesEstado = filterEstado === 'todos' || producto.estado === filterEstado
    
    return matchesSearch && matchesCategoria && matchesEstado
  })

  const categorias = [...new Set(productos.map(p => p.categoria))]
  const estados = [...new Set(productos.map(p => p.estado))]

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProductos(filteredProductos.map(p => p.id))
    } else {
      setSelectedProductos([])
    }
  }

  const handleSelectProducto = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedProductos([...selectedProductos, id])
    } else {
      setSelectedProductos(selectedProductos.filter(pid => pid !== id))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600">Gestiona tu catálogo de productos</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Package className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Link href="/tienda/productos/nuevo">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Productos</p>
              <p className="text-2xl font-bold text-blue-600">{productos.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activos</p>
              <p className="text-2xl font-bold text-green-600">
                {productos.filter(p => p.estado === 'activo').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-yellow-600">
                {productos.filter(p => p.estado === 'stock_bajo').length}
              </p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Inventario</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(productos.reduce((sum, p) => sum + (p.precio * p.stock), 0))}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
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
                placeholder="Buscar productos..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
            >
              <option value="todas">Todas las categorías</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
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
            {selectedProductos.length > 0 && (
              <Button variant="outline" size="sm">
                Acciones ({selectedProductos.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedProductos.length === filteredProductos.length && filteredProductos.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ventas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProductos.map((producto) => {
                const estadoConfig = getEstadoConfig(producto.estado)
                const EstadoIcon = estadoConfig.icon
                
                return (
                  <tr key={producto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedProductos.includes(producto.id)}
                        onChange={(e) => handleSelectProducto(producto.id, e.target.checked)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Package className="h-5 w-5 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                          <div className="text-sm text-gray-500">SKU: {producto.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {producto.categoria}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(producto.precio)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <span className={`font-medium ${producto.stock <= 10 ? 'text-red-600' : 'text-gray-900'}`}>
                        {producto.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoConfig.className}`}>
                        <EstadoIcon className="w-3 h-3 mr-1" />
                        {estadoConfig.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                        {producto.ventas}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/tienda/productos/${producto.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/tienda/productos/${producto.id}/editar`}>
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

        {filteredProductos.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay productos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Comienza creando tu primer producto.
            </p>
            <div className="mt-6">
              <Link href="/tienda/productos/nuevo">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Producto
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredProductos.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{filteredProductos.length}</span> de{' '}
            <span className="font-medium">{productos.length}</span> productos
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