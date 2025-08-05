'use client'

import { useState } from 'react'
import { Button } from '@admin-griffe/ui'
import { 
  Shield, 
  UserCheck, 
  Users, 
  Headphones,
  Plus,
  Edit,
  Trash2,
  Settings,
  Eye,
  Lock,
  Unlock,
  Save,
  X
} from 'lucide-react'

interface Permission {
  id: string
  name: string
  description: string
  category: string
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  color: string
  icon: React.ReactNode
  isSystem: boolean
}

export function RoleEditor() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Mock permissions data
  const permissions: Permission[] = [
    // Dashboard
    { id: 'dashboard.view', name: 'Ver Dashboard', description: 'Acceso al panel principal', category: 'Dashboard' },
    { id: 'dashboard.analytics', name: 'Ver Analíticas', description: 'Acceso a métricas y reportes', category: 'Dashboard' },
    
    // Tiendas
    { id: 'stores.view', name: 'Ver Tiendas', description: 'Listar y ver detalles de tiendas', category: 'Tiendas' },
    { id: 'stores.create', name: 'Crear Tiendas', description: 'Registrar nuevas tiendas', category: 'Tiendas' },
    { id: 'stores.edit', name: 'Editar Tiendas', description: 'Modificar información de tiendas', category: 'Tiendas' },
    { id: 'stores.delete', name: 'Eliminar Tiendas', description: 'Eliminar tiendas del sistema', category: 'Tiendas' },
    { id: 'stores.approve', name: 'Aprobar Tiendas', description: 'Aprobar solicitudes de registro', category: 'Tiendas' },
    
    // Pedidos
    { id: 'orders.view', name: 'Ver Pedidos', description: 'Acceso a la gestión de pedidos', category: 'Pedidos' },
    { id: 'orders.edit', name: 'Editar Pedidos', description: 'Modificar estado y detalles', category: 'Pedidos' },
    { id: 'orders.cancel', name: 'Cancelar Pedidos', description: 'Cancelar pedidos en proceso', category: 'Pedidos' },
    
    // Finanzas
    { id: 'finance.view', name: 'Ver Finanzas', description: 'Acceso a reportes financieros', category: 'Finanzas' },
    { id: 'finance.transactions', name: 'Ver Transacciones', description: 'Historial de transacciones', category: 'Finanzas' },
    { id: 'finance.reports', name: 'Generar Reportes', description: 'Crear reportes financieros', category: 'Finanzas' },
    
    // Usuarios
    { id: 'users.view', name: 'Ver Usuarios', description: 'Listar usuarios del sistema', category: 'Usuarios' },
    { id: 'users.create', name: 'Crear Usuarios', description: 'Registrar nuevos usuarios', category: 'Usuarios' },
    { id: 'users.edit', name: 'Editar Usuarios', description: 'Modificar información de usuarios', category: 'Usuarios' },
    { id: 'users.delete', name: 'Eliminar Usuarios', description: 'Eliminar usuarios del sistema', category: 'Usuarios' },
    { id: 'users.roles', name: 'Gestionar Roles', description: 'Asignar y modificar roles', category: 'Usuarios' },
    
    // Sistema
    { id: 'system.settings', name: 'Configuración', description: 'Acceso a configuración del sistema', category: 'Sistema' },
    { id: 'system.logs', name: 'Ver Logs', description: 'Acceso a logs del sistema', category: 'Sistema' },
    { id: 'system.backup', name: 'Respaldos', description: 'Gestionar respaldos del sistema', category: 'Sistema' }
  ]

  // Mock roles data
  const [roles, setRoles] = useState<Role[]>([
    {
      id: '1',
      name: 'Super Administrador',
      description: 'Acceso completo al sistema',
      permissions: permissions.map(p => p.id),
      userCount: 2,
      color: 'bg-red-100 text-red-800',
      icon: <Shield className="h-4 w-4" />,
      isSystem: true
    },
    {
      id: '2',
      name: 'Administrador',
      description: 'Gestión de tiendas y usuarios',
      permissions: [
        'dashboard.view', 'dashboard.analytics',
        'stores.view', 'stores.create', 'stores.edit', 'stores.approve',
        'orders.view', 'orders.edit',
        'finance.view', 'finance.transactions', 'finance.reports',
        'users.view', 'users.create', 'users.edit'
      ],
      userCount: 5,
      color: 'bg-blue-100 text-blue-800',
      icon: <UserCheck className="h-4 w-4" />,
      isSystem: false
    },
    {
      id: '3',
      name: 'Soporte',
      description: 'Atención al cliente y soporte técnico',
      permissions: [
        'dashboard.view',
        'stores.view',
        'orders.view', 'orders.edit',
        'users.view'
      ],
      userCount: 8,
      color: 'bg-purple-100 text-purple-800',
      icon: <Headphones className="h-4 w-4" />,
      isSystem: false
    },
    {
      id: '4',
      name: 'Tienda',
      description: 'Gestión de su propia tienda',
      permissions: [
        'dashboard.view',
        'stores.view',
        'orders.view'
      ],
      userCount: 45,
      color: 'bg-green-100 text-green-800',
      icon: <Users className="h-4 w-4" />,
      isSystem: true
    }
  ])

  const getPermissionsByCategory = () => {
    const categories: { [key: string]: Permission[] } = {}
    permissions.forEach(permission => {
      if (!categories[permission.category]) {
        categories[permission.category] = []
      }
      categories[permission.category].push(permission)
    })
    return categories
  }

  const selectedRoleData = roles.find(role => role.id === selectedRole)

  const handleSaveRole = () => {
    // Simulate API call
    setIsEditing(false)
    // In real app, update the role in the backend
  }

  const handleCreateRole = () => {
    // Simulate creating new role
    setShowCreateForm(false)
    // In real app, create the role in the backend
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Editor de Roles y Permisos</h3>
            <p className="text-sm text-gray-600">Gestiona roles y permisos del sistema</p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Rol
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Roles List */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Roles del Sistema</h4>
          <div className="space-y-2">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedRole === role.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedRole(role.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${role.color}`}>
                      {role.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{role.name}</div>
                      <div className="text-sm text-gray-600">{role.userCount} usuarios</div>
                    </div>
                  </div>
                  {role.isSystem && (
                    <Lock className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-2">{role.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Role Details */}
        <div className="lg:col-span-2">
          {selectedRoleData ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${selectedRoleData.color}`}>
                    {selectedRoleData.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedRoleData.name}</h4>
                    <p className="text-sm text-gray-600">{selectedRoleData.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!selectedRoleData.isSystem && (
                    <>
                      {isEditing ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                            <X className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={handleSaveRole}>
                            <Save className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Role Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{selectedRoleData.userCount}</div>
                  <div className="text-sm text-gray-600">Usuarios</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{selectedRoleData.permissions.length}</div>
                  <div className="text-sm text-gray-600">Permisos</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedRoleData.isSystem ? 'Sistema' : 'Personalizado'}
                  </div>
                  <div className="text-sm text-gray-600">Tipo</div>
                </div>
              </div>

              {/* Permissions */}
              <div>
                <h5 className="font-medium text-gray-900 mb-4">Permisos Asignados</h5>
                <div className="space-y-4">
                  {Object.entries(getPermissionsByCategory()).map(([category, categoryPermissions]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <h6 className="font-medium text-gray-900 mb-3">{category}</h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {categoryPermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={permission.id}
                              checked={selectedRoleData.permissions.includes(permission.id)}
                              disabled={!isEditing || selectedRoleData.isSystem}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={permission.id} className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                              <div className="text-xs text-gray-600">{permission.description}</div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Selecciona un rol para ver sus detalles</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Crear Nuevo Rol</h3>
              <button onClick={() => setShowCreateForm(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Rol
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Moderador"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe las responsabilidades de este rol..."
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowCreateForm(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleCreateRole} className="flex-1">
                  Crear Rol
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}