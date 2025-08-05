'use client'

import { useEffect, useState, useMemo } from 'react'
import { Command } from 'cmdk'
import { 
  Search, 
  Store, 
  Package, 
  Users, 
  CreditCard, 
  BarChart3, 
  Settings, 
  HelpCircle,
  Plus,
  FileText,
  TrendingUp,
  Calendar,
  Bell,
  Download,
  Upload,
  Filter,
  Eye,
  Edit,
  Trash2,
  Copy,
  Share,
  Star,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  Zap,
  Shield,
  Database,
  Cpu,
  Activity
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CommandItem {
  id: string
  title: string
  description?: string
  icon: React.ReactNode
  action: () => void
  category: string
  keywords: string[]
  shortcut?: string
  badge?: string
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [recentCommands, setRecentCommands] = useState<string[]>([])

  // Mock data for dynamic content
  const mockStores = [
    { id: '1', name: 'Tienda Central', status: 'active' },
    { id: '2', name: 'Sucursal Norte', status: 'active' },
    { id: '3', name: 'Plaza Sur', status: 'active' },
    { id: '4', name: 'Mall Oeste', status: 'inactive' },
    { id: '5', name: 'Centro Comercial', status: 'active' },
    { id: '6', name: 'Tienda Online', status: 'active' }
  ]

  const mockUsers = [
    { id: '1', name: 'Ana García', email: 'ana@email.com', role: 'admin' },
    { id: '2', name: 'Carlos López', email: 'carlos@email.com', role: 'manager' },
    { id: '3', name: 'María Rodríguez', email: 'maria@email.com', role: 'employee' }
  ]

  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Dashboard',
      description: 'Ver panel principal de administración',
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => router.push('/admin'),
      category: 'Navegación',
      keywords: ['dashboard', 'inicio', 'panel', 'principal'],
      shortcut: 'Ctrl+D'
    },
    {
      id: 'nav-stores',
      title: 'Tiendas',
      description: 'Gestionar todas las tiendas',
      icon: <Store className="h-4 w-4" />,
      action: () => router.push('/admin/tiendas'),
      category: 'Navegación',
      keywords: ['tiendas', 'sucursales', 'locales'],
      shortcut: 'Ctrl+T'
    },
    {
      id: 'nav-orders',
      title: 'Pedidos',
      description: 'Ver y gestionar pedidos',
      icon: <Package className="h-4 w-4" />,
      action: () => router.push('/admin/pedidos'),
      category: 'Navegación',
      keywords: ['pedidos', 'órdenes', 'ventas'],
      shortcut: 'Ctrl+O'
    },
    {
      id: 'nav-users',
      title: 'Usuarios',
      description: 'Administrar usuarios del sistema',
      icon: <Users className="h-4 w-4" />,
      action: () => router.push('/admin/usuarios'),
      category: 'Navegación',
      keywords: ['usuarios', 'empleados', 'staff'],
      shortcut: 'Ctrl+U'
    },
    {
      id: 'nav-finance',
      title: 'Finanzas',
      description: 'Reportes financieros y pagos',
      icon: <CreditCard className="h-4 w-4" />,
      action: () => router.push('/admin/finanzas'),
      category: 'Navegación',
      keywords: ['finanzas', 'pagos', 'dinero', 'ingresos'],
      shortcut: 'Ctrl+F'
    },
    {
      id: 'nav-reports',
      title: 'Reportes',
      description: 'Análisis y reportes detallados',
      icon: <FileText className="h-4 w-4" />,
      action: () => router.push('/admin/reportes'),
      category: 'Navegación',
      keywords: ['reportes', 'análisis', 'estadísticas'],
      shortcut: 'Ctrl+R'
    },
    {
      id: 'nav-support',
      title: 'Soporte',
      description: 'Centro de ayuda y tickets',
      icon: <HelpCircle className="h-4 w-4" />,
      action: () => router.push('/admin/soporte'),
      category: 'Navegación',
      keywords: ['soporte', 'ayuda', 'tickets', 'problemas']
    },
    {
      id: 'nav-settings',
      title: 'Configuración',
      description: 'Ajustes del sistema',
      icon: <Settings className="h-4 w-4" />,
      action: () => router.push('/admin/configuracion'),
      category: 'Navegación',
      keywords: ['configuración', 'ajustes', 'settings']
    },

    // Quick Actions
    {
      id: 'action-new-store',
      title: 'Nueva Tienda',
      description: 'Crear una nueva tienda',
      icon: <Plus className="h-4 w-4" />,
      action: () => console.log('Nueva tienda'),
      category: 'Acciones Rápidas',
      keywords: ['nueva', 'crear', 'tienda', 'sucursal'],
      badge: 'Nuevo'
    },
    {
      id: 'action-new-user',
      title: 'Nuevo Usuario',
      description: 'Invitar un nuevo usuario',
      icon: <Plus className="h-4 w-4" />,
      action: () => console.log('Nuevo usuario'),
      category: 'Acciones Rápidas',
      keywords: ['nuevo', 'crear', 'usuario', 'invitar']
    },
    {
      id: 'action-export-data',
      title: 'Exportar Datos',
      description: 'Descargar reportes en Excel/CSV',
      icon: <Download className="h-4 w-4" />,
      action: () => console.log('Exportar datos'),
      category: 'Acciones Rápidas',
      keywords: ['exportar', 'descargar', 'excel', 'csv', 'datos']
    },
    {
      id: 'action-import-data',
      title: 'Importar Datos',
      description: 'Subir datos desde archivo',
      icon: <Upload className="h-4 w-4" />,
      action: () => console.log('Importar datos'),
      category: 'Acciones Rápidas',
      keywords: ['importar', 'subir', 'cargar', 'archivo']
    },

    // Stores
    ...mockStores.map(store => ({
      id: `store-${store.id}`,
      title: store.name,
      description: `Ver detalles de ${store.name}`,
      icon: <Store className="h-4 w-4" />,
      action: () => router.push(`/admin/tiendas/${store.id}`),
      category: 'Tiendas',
      keywords: ['tienda', store.name.toLowerCase(), 'sucursal'],
      badge: store.status === 'active' ? 'Activa' : 'Inactiva'
    })),

    // Users
    ...mockUsers.map(user => ({
      id: `user-${user.id}`,
      title: user.name,
      description: `${user.email} - ${user.role}`,
      icon: <Users className="h-4 w-4" />,
      action: () => router.push(`/admin/usuarios/${user.id}`),
      category: 'Usuarios',
      keywords: ['usuario', user.name.toLowerCase(), user.email, user.role],
      badge: user.role
    })),

    // System Actions
    {
      id: 'system-notifications',
      title: 'Notificaciones',
      description: 'Ver todas las notificaciones',
      icon: <Bell className="h-4 w-4" />,
      action: () => console.log('Notificaciones'),
      category: 'Sistema',
      keywords: ['notificaciones', 'alertas', 'avisos']
    },
    {
      id: 'system-activity',
      title: 'Registro de Actividad',
      description: 'Ver logs del sistema',
      icon: <Activity className="h-4 w-4" />,
      action: () => console.log('Actividad'),
      category: 'Sistema',
      keywords: ['actividad', 'logs', 'historial', 'registro']
    },
    {
      id: 'system-backup',
      title: 'Respaldo de Datos',
      description: 'Crear respaldo del sistema',
      icon: <Database className="h-4 w-4" />,
      action: () => console.log('Respaldo'),
      category: 'Sistema',
      keywords: ['respaldo', 'backup', 'copia', 'seguridad']
    },
    {
      id: 'system-performance',
      title: 'Rendimiento del Sistema',
      description: 'Monitorear performance',
      icon: <Cpu className="h-4 w-4" />,
      action: () => console.log('Performance'),
      category: 'Sistema',
      keywords: ['rendimiento', 'performance', 'velocidad', 'cpu']
    },

    // Quick Filters
    {
      id: 'filter-today',
      title: 'Ventas de Hoy',
      description: 'Filtrar datos del día actual',
      icon: <Calendar className="h-4 w-4" />,
      action: () => console.log('Filtro hoy'),
      category: 'Filtros Rápidos',
      keywords: ['hoy', 'día', 'actual', 'ventas']
    },
    {
      id: 'filter-week',
      title: 'Esta Semana',
      description: 'Datos de los últimos 7 días',
      icon: <Calendar className="h-4 w-4" />,
      action: () => console.log('Filtro semana'),
      category: 'Filtros Rápidos',
      keywords: ['semana', 'últimos', '7', 'días']
    },
    {
      id: 'filter-month',
      title: 'Este Mes',
      description: 'Datos del mes actual',
      icon: <Calendar className="h-4 w-4" />,
      action: () => console.log('Filtro mes'),
      category: 'Filtros Rápidos',
      keywords: ['mes', 'actual', 'mensual']
    }
  ], [router])

  const filteredCommands = useMemo(() => {
    if (!search) {
      // Show recent commands first when no search
      const recent = commands.filter(cmd => recentCommands.includes(cmd.id))
      const others = commands.filter(cmd => !recentCommands.includes(cmd.id))
      return [...recent, ...others]
    }

    return commands.filter(command => {
      const searchLower = search.toLowerCase()
      return (
        command.title.toLowerCase().includes(searchLower) ||
        command.description?.toLowerCase().includes(searchLower) ||
        command.keywords.some(keyword => keyword.includes(searchLower)) ||
        command.category.toLowerCase().includes(searchLower)
      )
    })
  }, [commands, search, recentCommands])

  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {}
    
    filteredCommands.forEach(command => {
      if (!groups[command.category]) {
        groups[command.category] = []
      }
      groups[command.category].push(command)
    })

    return groups
  }, [filteredCommands])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, onOpenChange])

  const runCommand = (command: CommandItem) => {
    // Add to recent commands
    setRecentCommands(prev => {
      const filtered = prev.filter(id => id !== command.id)
      return [command.id, ...filtered].slice(0, 5) // Keep only 5 recent
    })
    
    onOpenChange(false)
    command.action()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
        <Command className="rounded-xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center border-b border-gray-200 px-4">
            <Search className="mr-3 h-5 w-5 shrink-0 text-gray-400" />
            <Command.Input
              placeholder="Buscar comandos, páginas, usuarios..."
              value={search}
              onValueChange={setSearch}
              className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <div className="ml-3 flex items-center gap-1 text-xs text-gray-400">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-600">
                ESC
              </kbd>
            </div>
          </div>
          
          <Command.List className="max-h-96 overflow-y-auto p-2">
            <Command.Empty className="py-8 text-center">
              <Search className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No se encontraron resultados para "{search}"</p>
              <p className="text-xs text-gray-400 mt-1">Intenta con otros términos de búsqueda</p>
            </Command.Empty>

            {!search && recentCommands.length > 0 && (
              <Command.Group heading="Recientes">
                {commands
                  .filter(cmd => recentCommands.includes(cmd.id))
                  .slice(0, 3)
                  .map(command => (
                    <Command.Item
                      key={command.id}
                      onSelect={() => runCommand(command)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-gray-100 cursor-pointer transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-blue-600">
                        {command.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{command.title}</span>
                          {command.badge && (
                            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {command.badge}
                            </span>
                          )}
                          <Clock className="h-3 w-3 text-gray-400" />
                        </div>
                        {command.description && (
                          <p className="text-xs text-gray-500 truncate">{command.description}</p>
                        )}
                      </div>
                      {command.shortcut && (
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-600">
                          {command.shortcut}
                        </kbd>
                      )}
                    </Command.Item>
                  ))}
              </Command.Group>
            )}

            {Object.entries(groupedCommands).map(([category, commands]) => (
              <Command.Group key={category} heading={category}>
                {commands.map(command => (
                  <Command.Item
                    key={command.id}
                    onSelect={() => runCommand(command)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                      {command.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{command.title}</span>
                        {command.badge && (
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            command.badge === 'Activa' ? 'bg-green-100 text-green-800' :
                            command.badge === 'Inactiva' ? 'bg-gray-100 text-gray-800' :
                            command.badge === 'Nuevo' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {command.badge}
                          </span>
                        )}
                      </div>
                      {command.description && (
                        <p className="text-xs text-gray-500 truncate">{command.description}</p>
                      )}
                    </div>
                    {command.shortcut && (
                      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-600">
                        {command.shortcut}
                      </kbd>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            ))}
          </Command.List>

          <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <span>Usa ↑↓ para navegar, ↵ para seleccionar</span>
              <span>{filteredCommands.length} resultados</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  )
}