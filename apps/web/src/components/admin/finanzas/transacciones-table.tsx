'use client'

import { useState } from 'react'
import { Button } from '@admin-griffe/ui'
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  MoreHorizontal,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

interface Transaction {
  id: string
  fecha: string
  tienda: string
  cliente: string
  metodo: string
  monto: number
  comision: number
  estado: 'completada' | 'pendiente' | 'fallida' | 'reembolsada'
  referencia: string
}

interface TransaccionesTableProps {
  period: string
}

export function TransaccionesTable({ period }: TransaccionesTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('todas')
  const [sortField, setSortField] = useState<keyof Transaction>('fecha')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Mock transactions data
  const transactions: Transaction[] = [
    {
      id: '1',
      fecha: '2024-01-15 14:30',
      tienda: 'Fashion Store',
      cliente: 'María González',
      metodo: 'Tarjeta de Crédito',
      monto: 125000,
      comision: 6250,
      estado: 'completada',
      referencia: 'TXN-2024-001'
    },
    {
      id: '2',
      fecha: '2024-01-15 13:45',
      tienda: 'Tech World',
      cliente: 'Carlos Rodríguez',
      metodo: 'PSE',
      monto: 89000,
      comision: 4450,
      estado: 'completada',
      referencia: 'TXN-2024-002'
    },
    {
      id: '3',
      fecha: '2024-01-15 12:20',
      tienda: 'Beauty Corner',
      cliente: 'Ana Martínez',
      metodo: 'Nequi',
      monto: 67500,
      comision: 3375,
      estado: 'pendiente',
      referencia: 'TXN-2024-003'
    },
    {
      id: '4',
      fecha: '2024-01-15 11:15',
      tienda: 'Sports Zone',
      cliente: 'Luis Hernández',
      metodo: 'Tarjeta de Débito',
      monto: 156000,
      comision: 7800,
      estado: 'fallida',
      referencia: 'TXN-2024-004'
    },
    {
      id: '5',
      fecha: '2024-01-15 10:30',
      tienda: 'Home & Garden',
      cliente: 'Patricia Silva',
      metodo: 'Efectivo',
      monto: 234000,
      comision: 11700,
      estado: 'reembolsada',
      referencia: 'TXN-2024-005'
    },
    {
      id: '6',
      fecha: '2024-01-14 16:45',
      tienda: 'Kids World',
      cliente: 'Roberto Díaz',
      metodo: 'Tarjeta de Crédito',
      monto: 98000,
      comision: 4900,
      estado: 'completada',
      referencia: 'TXN-2024-006'
    }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getStatusIcon = (status: Transaction['estado']) => {
    switch (status) {
      case 'completada':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pendiente':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'fallida':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'reembolsada':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
    }
  }

  const getStatusBadge = (status: Transaction['estado']) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium"
    switch (status) {
      case 'completada':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'pendiente':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'fallida':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'reembolsada':
        return `${baseClasses} bg-blue-100 text-blue-800`
    }
  }

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredTransactions = transactions
    .filter(transaction => {
      const matchesSearch = 
        transaction.tienda.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.referencia.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = selectedStatus === 'todas' || transaction.estado === selectedStatus
      
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      return 0
    })

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar por tienda, cliente o referencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todas">Todos los estados</option>
            <option value="completada">Completadas</option>
            <option value="pendiente">Pendientes</option>
            <option value="fallida">Fallidas</option>
            <option value="reembolsada">Reembolsadas</option>
          </select>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transacciones</p>
              <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monto Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.monto, 0))}
              </p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowUpDown className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Comisiones</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(filteredTransactions.reduce((sum, t) => sum + t.comision, 0))}
              </p>
            </div>
            <div className="p-2 bg-purple-100 rounded-lg">
              <ArrowUpDown className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tasa Éxito</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((filteredTransactions.filter(t => t.estado === 'completada').length / filteredTransactions.length) * 100)}%
              </p>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('fecha')}
                >
                  <div className="flex items-center gap-1">
                    Fecha
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('tienda')}
                >
                  <div className="flex items-center gap-1">
                    Tienda
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('monto')}
                >
                  <div className="flex items-center gap-1">
                    Monto
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Comisión
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{transaction.fecha.split(' ')[0]}</div>
                      <div className="text-gray-500">{transaction.fecha.split(' ')[1]}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{transaction.tienda}</div>
                    <div className="text-sm text-gray-500">{transaction.referencia}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.cliente}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.metodo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(transaction.monto)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(transaction.comision)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transaction.estado)}
                      <span className={getStatusBadge(transaction.estado)}>
                        {transaction.estado.charAt(0).toUpperCase() + transaction.estado.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
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
        
        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No se encontraron transacciones</div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Mostrando {filteredTransactions.length} de {transactions.length} transacciones
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
  )
}