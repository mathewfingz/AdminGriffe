import { Metadata } from 'next'
import { 
  UserPlus, 
  Users, 
  Shield, 
  Search,
  Filter,
  Download,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@admin-griffe/ui'
import { UsuariosDataTable } from '@/components/admin/usuarios/usuarios-data-table'
import { RoleEditor } from '@/components/admin/usuarios/role-editor'

export const metadata: Metadata = {
  title: 'Gestión de Usuarios - Admin Dashboard',
  description: 'Administración de usuarios, roles y permisos del sistema'
}

export default function UsuariosPage() {
  // Mock data for summary cards
  const summaryData = [
    {
      title: 'Total Usuarios',
      value: '45,892',
      change: '+12.5%',
      trend: 'up',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Usuarios Activos',
      value: '38,247',
      change: '+8.2%',
      trend: 'up',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-green-500'
    },
    {
      title: 'Nuevos (30 días)',
      value: '2,156',
      change: '+15.3%',
      trend: 'up',
      icon: <UserPlus className="h-6 w-6" />,
      color: 'bg-purple-500'
    },
    {
      title: 'Administradores',
      value: '24',
      change: '+2',
      trend: 'up',
      icon: <Shield className="h-6 w-6" />,
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </Button>
          <Button variant="primary" size="sm" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryData.map((item, index) => (
          <div key={index} className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{item.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{item.value}</p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${
                    item.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs mes anterior</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${item.color} text-white`}>
                {item.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="flex items-center gap-2 justify-start p-4 h-auto">
            <UserPlus className="h-5 w-5 text-blue-500" />
            <div className="text-left">
              <div className="font-medium">Invitar Usuario</div>
              <div className="text-sm text-gray-500">Enviar invitación por email</div>
            </div>
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2 justify-start p-4 h-auto">
            <Shield className="h-5 w-5 text-green-500" />
            <div className="text-left">
              <div className="font-medium">Gestionar Roles</div>
              <div className="text-sm text-gray-500">Configurar permisos</div>
            </div>
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2 justify-start p-4 h-auto">
            <Users className="h-5 w-5 text-purple-500" />
            <div className="text-left">
              <div className="font-medium">Usuarios Inactivos</div>
              <div className="text-sm text-gray-500">Revisar y reactivar</div>
            </div>
          </Button>
          
          <Button variant="outline" className="flex items-center gap-2 justify-start p-4 h-auto">
            <Download className="h-5 w-5 text-orange-500" />
            <div className="text-left">
              <div className="font-medium">Reporte de Actividad</div>
              <div className="text-sm text-gray-500">Descargar logs</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Role Management */}
      <RoleEditor />

      {/* Users Data Table */}
      <UsuariosDataTable />

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Actividad Reciente</h2>
          <Button variant="outline" size="sm">
            Ver Todo
          </Button>
        </div>
        
        <div className="space-y-4">
          {[
            {
              user: 'María González',
              action: 'Creó una nueva tienda',
              details: 'Fashion Store - Bogotá',
              time: 'Hace 2 horas',
              type: 'create'
            },
            {
              user: 'Carlos Rodríguez',
              action: 'Actualizó su perfil',
              details: 'Cambió información de contacto',
              time: 'Hace 4 horas',
              type: 'update'
            },
            {
              user: 'Ana Martínez',
              action: 'Inició sesión',
              details: 'Desde dispositivo móvil',
              time: 'Hace 6 horas',
              type: 'login'
            },
            {
              user: 'Luis Hernández',
              action: 'Cambió contraseña',
              details: 'Por motivos de seguridad',
              time: 'Hace 8 horas',
              type: 'security'
            },
            {
              user: 'Patricia Silva',
              action: 'Se registró en la plataforma',
              details: 'Usuario nuevo verificado',
              time: 'Hace 12 horas',
              type: 'register'
            }
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
              <div className={`w-2 h-2 rounded-full ${
                activity.type === 'create' ? 'bg-green-500' :
                activity.type === 'update' ? 'bg-blue-500' :
                activity.type === 'login' ? 'bg-purple-500' :
                activity.type === 'security' ? 'bg-orange-500' :
                'bg-gray-500'
              }`}></div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{activity.user}</span>
                  <span className="text-gray-600">{activity.action}</span>
                </div>
                <p className="text-sm text-gray-500">{activity.details}</p>
              </div>
              
              <div className="text-sm text-gray-500">{activity.time}</div>
              
              <button className="text-gray-400 hover:text-gray-600">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}