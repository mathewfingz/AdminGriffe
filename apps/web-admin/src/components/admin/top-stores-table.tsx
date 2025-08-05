'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Store, Filter, Search, MoreHorizontal, Eye, Edit, ArrowUpDown } from 'lucide-react'
import { useState, useMemo } from 'react'

interface Store {
  id: string
  name: string
  sales: number
  margin: number
  change: number
  status: 'active' | 'inactive'
  location: string
  orders: number
  avgOrderValue: number
  category: 'mall' | 'street' | 'online'
}

// Mock data with more details
const mockStores: Store[] = [
  {
    id: '1',
    name: 'Tienda Central',
    sales: 125000,
    margin: 23.5,
    change: 12.3,
    status: 'active',
    location: 'Centro Histórico',
    orders: 2500,
    avgOrderValue: 50,
    category: 'street'
  },
  {
    id: '2',
    name: 'Sucursal Norte',
    sales: 98000,
    margin: 19.2,
    change: -5.1,
    status: 'active',
    location: 'Zona Norte',
    orders: 1960,
    avgOrderValue: 50,
    category: 'mall'
  },
  {
    id: '3',
    name: 'Plaza Sur',
    sales: 87500,
    margin: 21.8,
    change: 8.7,
    status: 'active',
    location: 'Plaza Sur',
    orders: 1750,
    avgOrderValue: 50,
    category: 'mall'
  },
  {
    id: '4',
    name: 'Mall Oeste',
    sales: 76200,
    margin: 18.4,
    change: -2.3,
    status: 'inactive',
    location: 'Mall Oeste',
    orders: 1524,
    avgOrderValue: 50,
    category: 'mall'
  },
  {
    id: '5',
    name: 'Centro Comercial',
    sales: 65800,
    margin: 16.9,
    change: 15.2,
    status: 'active',
    location: 'Centro Comercial',
    orders: 1316,
    avgOrderValue: 50,
    category: 'mall'
  },
  {
    id: '6',
    name: 'Tienda Online',
    sales: 89300,
    margin: 28.1,
    change: 22.4,
    status: 'active',
    location: 'Digital',
    orders: 1786,
    avgOrderValue: 50,
    category: 'online'
  },
  {
    id: '7',
    name: 'Sucursal Este',
    sales: 72100,
    margin: 20.3,
    change: 3.8,
    status: 'active',
    location: 'Zona Este',
    orders: 1442,
    avgOrderValue: 50,
    category: 'street'
  }
]

type SortField = 'name' | 'sales' | 'margin' | 'change' | 'orders'
type SortDirection = 'asc' | 'desc'

interface TopStoresTableProps {
  limit?: number
  showFilters?: boolean
  showActions?: boolean
  onStoreClick?: (store: Store) => void
}

export function TopStoresTable({ 
  limit = 5, 
  showFilters = false,
  showActions = false,
  onStoreClick
}: TopStoresTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'mall' | 'street' | 'online'>('all')
  const [sortField, setSortField] = useState<SortField>('sales')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showMenu, setShowMenu] = useState<string | null>(null)

  const filteredAndSortedStores = useMemo(() => {
    let filtered = mockStores.filter(store => {
      const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           store.location.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || store.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || store.category === categoryFilter
      
      return matchesSearch && matchesStatus && matchesCategory
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = (bValue as string).toLowerCase()
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered.slice(0, limit)
  }, [searchTerm, statusFilter, categoryFilter, sortField, sortDirection, limit])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-400" />
    return <ArrowUpDown className={`w-3 h-3 ${sortDirection === 'desc' ? 'rotate-180' : ''} text-blue-600`} />
  }

  const getCategoryBadge = (category: Store['category']) => {
    const styles = {
      mall: 'bg-purple-100 text-purple-800',
      street: 'bg-blue-100 text-blue-800',
      online: 'bg-green-100 text-green-800'
    }
    
    const labels = {
      mall: 'Mall',
      street: 'Calle',
      online: 'Online'
    }
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[category]}`}>
        {labels[category]}
      </span>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white rounded-xl border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {limit === mockStores.length ? 'Todas las Tiendas' : `Top ${limit} Tiendas`}
          </h3>
          <span className="text-sm text-gray-500">({filteredAndSortedStores.length})</span>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
          Ver todas
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
          {/* Search */}
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tiendas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>
          
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas las categorías</option>
            <option value="mall">Mall</option>
            <option value="street">Calle</option>
            <option value="online">Online</option>
          </select>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-600 text-sm">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                >
                  Tienda
                  {getSortIcon('name')}
                </button>
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">
                <button
                  onClick={() => handleSort('sales')}
                  className="flex items-center gap-1 hover:text-gray-900 transition-colors ml-auto"
                >
                  Ventas
                  {getSortIcon('sales')}
                </button>
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">
                <button
                  onClick={() => handleSort('orders')}
                  className="flex items-center gap-1 hover:text-gray-900 transition-colors ml-auto"
                >
                  Pedidos
                  {getSortIcon('orders')}
                </button>
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">
                <button
                  onClick={() => handleSort('margin')}
                  className="flex items-center gap-1 hover:text-gray-900 transition-colors ml-auto"
                >
                  Margen
                  {getSortIcon('margin')}
                </button>
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-600 text-sm">
                <button
                  onClick={() => handleSort('change')}
                  className="flex items-center gap-1 hover:text-gray-900 transition-colors ml-auto"
                >
                  Cambio
                  {getSortIcon('change')}
                </button>
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Estado</th>
              {showActions && (
                <th className="text-center py-3 px-4 font-medium text-gray-600 text-sm">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedStores.map((store, index) => (
              <motion.tr
                key={store.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  onStoreClick ? 'cursor-pointer' : ''
                }`}
                onClick={() => onStoreClick?.(store)}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                      <Store className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{store.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-2">
                        {store.location}
                        {getCategoryBadge(store.category)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="font-semibold text-gray-900">
                    ${store.sales.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    ${store.avgOrderValue} promedio
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="font-medium text-gray-900">
                    {store.orders.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    este mes
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className={`font-medium ${
                    store.margin > 20 ? 'text-green-600' : 
                    store.margin > 15 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {store.margin}%
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {store.change > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span
                      className={`font-medium ${
                        store.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {store.change > 0 ? '+' : ''}{store.change}%
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span
                    className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                      store.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {store.status === 'active' ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                {showActions && (
                  <td className="py-4 px-4 text-center relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(showMenu === store.id ? null : store.id)
                      }}
                      className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {showMenu === store.id && (
                      <div className="absolute top-full right-4 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                          <Eye className="w-3 h-3" />
                          Ver detalles
                        </button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                          <Edit className="w-3 h-3" />
                          Editar
                        </button>
                      </div>
                    )}
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedStores.length === 0 && (
        <div className="text-center py-8">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No se encontraron tiendas</p>
        </div>
      )}
    </motion.div>
  )
}