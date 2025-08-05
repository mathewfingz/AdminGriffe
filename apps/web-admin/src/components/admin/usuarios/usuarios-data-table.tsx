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
  Shield,
  UserX,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  ArrowUpDown
} from 'lucide-react'

interface User {
  id: string
  nombre: string
  email: string
  telefono: string
  rol: 'admin' | 'tienda' | 'cliente' | 'soporte'
  estado: 'activo' | 'inactivo' | 'suspendido' | 'pendiente'
  fechaRegistro: string
  ultimaActividad: string
  tienda?: string
  verificado: boolean
}

export function UsuariosDataTable() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('todos')
  const [selectedStatus, setSelectedStatus] = useState('todos')
  const [sortField, setSortField] = useState<keyof User>('fechaRegistro')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Mock users data
  const users: User[] = [
    {
      id: '1',
      nombre: 'María González',
      email: 'maria.gonzalez@email.com',
      telefono: '+57 300 123 4567',
      rol: 'tienda',
      estado: 'activo',
      fechaRegistro: '2024-01-15',
      ultimaActividad: '2024-01-20 14:30',
      tienda: 'Fashion Store',
      verificado: true
    },
    {
      id: '2',
      nombre: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@email.com',
      telefono: '+57 301 234 5678',
      rol: 'admin',
      estado: 'activo',
      fechaRegistro: '2023-12-10',
      ultimaActividad: '2024-01-20 16:45',
      verificado: true
    },
    {
      id: '3',
      nombre: 'Ana Martínez',
      email: 'ana.martinez@email.com',
      telefono: '+57 302 345 6789',
      rol: 'cliente',
      estado: 'activo',
      fechaRegistro: '2024-01-18',
      ultimaActividad: '2024-01-20 12:15',
      verificado: true
    },
    {
      id: '4',
      nombre: 'Luis Hernández',
      email: 'luis.hernandez@email.com',
      telefono: '+57 303 456 7890',
      rol: 'tienda',
      estado: 'suspendido',
      fechaRegistro: '2024-01-12',
      ultimaActividad: '2024-01-19 09:20',
      tienda: 'Tech World',
      verificado: false
    },
    {
      id: '5',
      nombre: 'Patricia Silva',
      email: 'patricia.silva@email.com',
      telefono: '+57 304 567 8901',
      rol: 'soporte',
      estado: 'activo',
      fechaRegistro: '2023-11-20',
      ultimaActividad: '2024-01-20 17:30',
      verificado: true
    },
    {
      id: '6',
      nombre: 'Roberto Díaz',
      email: 'roberto.diaz@email.com',
      telefono: '+57 305 678 9012',
      rol: 'cliente',
      estado: 'inactivo',
      fechaRegistro: '2024-01-05',
      ultimaActividad: '2024-01-15 11:45',
      verificado: true
    }
  ]

  const getRoleColor = (role: User['rol']) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800'
      case 'tienda':
        return 'bg-blue-100 text-blue-800'
      case 'soporte':
        return 'bg-purple-100 text-purple-800'
      case 'cliente':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: User['estado']) => {
    switch (status) {
      case 'activo':
        return 'bg-green-100 text-green-800'
      case 'inactivo':
        return 'bg-gray-100 text-gray-800'
      case 'suspendido':
        return 'bg-red-100 text-red-800'
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: User['rol']) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />
      case 'tienda':
        return <UserCheck className="h-4 w-4" />
      case 'soporte':
        return <UserCheck className="h-4 w-4" />
      case 'cliente':
        return <UserCheck className="h-4 w-4" />
      default:
        return <UserCheck className="h-4 w-4" />
    }
  }

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredUsers = users
    .filter(user => {
      const matchesSearch = 
        user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.tienda && user.tienda.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesRole = selectedRole === 'todos' || user.rol === selectedRole
      const matchesStatus = selectedStatus === 'todos' || user.estado === selectedStatus
      
      return matchesSearch && matchesRole && matchesStatus
    })
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return 0
    })

  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos los roles</option>
              <option value="admin">Administradores</option>
              <option value="tienda">Tiendas</option>
              <option value="soporte">Soporte</option>
              <option value="cliente">Clientes</option>
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
              <option value="suspendido">Suspendidos</option>
              <option value="pendiente">Pendientes</option>
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

      {/* Summary Stats */}
      <div className="p-6 border-b bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{filteredUsers.length}</div>
            <div className="text-sm text-gray-600">Total Usuarios</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredUsers.filter(u => u.estado === 'activo').length}
            </div>
            <div className="text-sm text-gray-600">Activos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {filteredUsers.filter(u => u.verificado).length}
            </div>
            <div className="text-sm text-gray-600">Verificados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {filteredUsers.filter(u => u.rol === 'tienda').length}
            </div>
            <div className="text-sm text-gray-600">Tiendas</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('nombre')}
              >
                <div className="flex items-center gap-1">
                  Usuario
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('rol')}
              >
                <div className="flex items-center gap-1">
                  Rol
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('fechaRegistro')}
              >
                <div className="flex items-center gap-1">
                  Registro
                  <ArrowUpDown className="h-3 w-3" />
                </div>
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
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.nombre.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium text-gray-900">{user.nombre}</div>
                        {user.verificado && (
                          <UserCheck className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      {user.tienda && (
                        <div className="text-sm text-gray-500">{user.tienda}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Mail className="h-3 w-3 text-gray-400" />
                      {user.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Phone className="h-3 w-3 text-gray-400" />
                      {user.telefono}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(user.rol)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.rol)}`}>
                      {user.rol.charAt(0).toUpperCase() + user.rol.slice(1)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.estado)}`}>
                    {user.estado.charAt(0).toUpperCase() + user.estado.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-gray-900">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    {new Date(user.fechaRegistro).toLocaleDateString('es-ES')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.ultimaActividad}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <button className="text-blue-600 hover:text-blue-900" title="Ver detalles">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900" title="Editar">
                      <Edit className="h-4 w-4" />
                    </button>
                    {user.estado === 'activo' ? (
                      <button className="text-yellow-600 hover:text-yellow-900" title="Suspender">
                        <UserX className="h-4 w-4" />
                      </button>
                    ) : (
                      <button className="text-green-600 hover:text-green-900" title="Activar">
                        <UserCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button className="text-red-600 hover:text-red-900" title="Eliminar">
                      <Trash2 className="h-4 w-4" />
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
      
      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No se encontraron usuarios</div>
        </div>
      )}

      {/* Pagination */}
      <div className="px-6 py-4 border-t flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Mostrando {filteredUsers.length} de {users.length} usuarios
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