'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { 
  BarChart3, 
  ShoppingCart, 
  FileText, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Megaphone, 
  Percent,
  ChevronRight,
  Image as ImageIcon,
  Store,
  Package,
  CreditCard,
  PieChart,
  UserCheck,
  Headphones,
  Settings
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  isActive?: boolean
}

interface NavGroup {
  title: string
  items: NavItem[]
  isCollapsible?: boolean
}

export function Sidebar() {
  const pathname = usePathname()
  const [isStoreViewCollapsed, setIsStoreViewCollapsed] = useState(false)

  const navigationGroups: NavGroup[] = [
    {
      title: 'Principal',
      items: [
        {
          title: 'Dashboard',
          href: '/admin',
          icon: <BarChart3 className="w-4 h-4" />,
          isActive: pathname === '/admin' || pathname === '/admin/dashboard'
        }
      ]
    },
    {
      title: 'Gestión',
      items: [
        {
          title: 'Tiendas',
          href: '/admin/tiendas',
          icon: <Store className="w-4 h-4" />,
          isActive: pathname.startsWith('/admin/tiendas')
        },
        {
          title: 'Pedidos',
          href: '/admin/pedidos',
          icon: <Package className="w-4 h-4" />,
          isActive: pathname === '/admin/pedidos'
        },
        {
          title: 'Finanzas',
          href: '/admin/finanzas',
          icon: <CreditCard className="w-4 h-4" />,
          isActive: pathname === '/admin/finanzas'
        },
        {
          title: 'Reportes',
          href: '/admin/reportes',
          icon: <PieChart className="w-4 h-4" />,
          isActive: pathname === '/admin/reportes'
        }
      ]
    },
    {
      title: 'Administración',
      items: [
        {
          title: 'Usuarios',
          href: '/admin/usuarios',
          icon: <UserCheck className="w-4 h-4" />,
          isActive: pathname === '/admin/usuarios'
        },
        {
          title: 'Soporte',
          href: '/admin/soporte',
          icon: <Headphones className="w-4 h-4" />,
          isActive: pathname === '/admin/soporte'
        },
        {
          title: 'Configuración',
          href: '/admin/configuracion',
          icon: <Settings className="w-4 h-4" />,
          isActive: pathname === '/admin/configuracion'
        }
      ]
    }
  ]

  return (
    <div className="w-64 h-full bg-[#EBEBEB] border-r border-gray-200">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <Image
            src="/nova-haven-logo.svg"
            width={32}
            height={32}
            className="w-8 h-8"
            alt="Nova Haven Admin Logo"
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-manrope">AdminGriffe</h1>
            <p className="text-sm text-gray-600 mt-1">Panel de Administración</p>
          </div>
        </div>
      </div>

      <nav className="mt-6 px-4">
        {navigationGroups.map((group) => (
          <div key={group.title} className="mb-6">
            {group.isCollapsible ? (
              <button
                onClick={() => setIsStoreViewCollapsed(!isStoreViewCollapsed)}
                className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
              >
                {group.title}
                <ChevronRight 
                  className={`w-3 h-3 transition-transform ${
                    isStoreViewCollapsed ? '' : 'rotate-90'
                  }`} 
                />
              </button>
            ) : (
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {group.title}
              </div>
            )}
            
            {(!group.isCollapsible || !isStoreViewCollapsed) && (
              <div className="mt-2 space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      item.isActive
                        ? 'bg-[#FAFAFA] text-blue-600 border-r-2 border-blue-600'
                        : 'text-gray-700 hover:bg-[#FAFAFA] hover:text-gray-900'
                    }`}
                  >
                    {item.icon}
                    {item.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}