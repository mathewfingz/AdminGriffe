'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ChevronRight } from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
  isActive?: boolean
  children?: NavItem[]
}

export function TiendaSidebar() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['catalogo'])

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const navigationItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/tienda/dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v3H8V5z" />
        </svg>
      ),
      isActive: pathname === '/tienda/dashboard'
    },
    {
      title: 'Catálogo',
      href: '/tienda/catalogo',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      isActive: pathname.startsWith('/tienda/catalogo'),
      children: [
        {
          title: 'Productos',
          href: '/tienda/catalogo/productos',
          icon: null,
          isActive: pathname === '/tienda/catalogo/productos'
        },
        {
          title: 'Categorías',
          href: '/tienda/catalogo/categorias',
          icon: null,
          isActive: pathname === '/tienda/catalogo/categorias'
        },
        {
          title: 'Inventario',
          href: '/tienda/catalogo/inventario',
          icon: null,
          isActive: pathname === '/tienda/catalogo/inventario'
        },
        {
          title: 'Órdenes de compra',
          href: '/tienda/catalogo/ordenes-compra',
          icon: null,
          isActive: pathname === '/tienda/catalogo/ordenes-compra'
        }
      ]
    },
    {
      title: 'Pedidos',
      href: '/tienda/pedidos',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      isActive: pathname === '/tienda/pedidos'
    },
    {
      title: 'Clientes',
      href: '/tienda/clientes',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      isActive: pathname === '/tienda/clientes'
    },
    {
      title: 'Finanzas',
      href: '/tienda/finanzas',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      isActive: pathname === '/tienda/finanzas'
    },
    {
      title: 'Marketing',
      href: '/tienda/marketing',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      isActive: pathname === '/tienda/marketing'
    },
    {
      title: 'Analítica',
      href: '/tienda/analitica',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      isActive: pathname === '/tienda/analitica'
    },
    {
      title: 'Ajustes',
      href: '/tienda/ajustes',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      isActive: pathname === '/tienda/ajustes'
    }
  ]

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.title.toLowerCase())

    return (
      <div key={item.href}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.title.toLowerCase())}
            className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              item.isActive
                ? 'bg-[#FAFAFA] text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-700 hover:bg-[#FAFAFA] hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              {item.title}
            </div>
            <ChevronRight 
              className={`w-3 h-3 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`} 
            />
          </button>
        ) : (
          <Link
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              level > 0 ? 'ml-6' : ''
            } ${
              item.isActive
                ? 'bg-[#FAFAFA] text-blue-600 border-r-2 border-blue-600'
                : 'text-gray-700 hover:bg-[#FAFAFA] hover:text-gray-900'
            }`}
          >
            {item.icon}
            {item.title}
          </Link>
        )}
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-64 h-full bg-[#EBEBEB] border-r border-gray-200">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900 font-manrope">AdminGriffe</h1>
        <p className="text-sm text-gray-600 mt-1">Vista Tienda</p>
      </div>

      <nav className="mt-6 px-4">
        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Tienda
        </div>
        <div className="space-y-1">
          {navigationItems.map(item => renderNavItem(item))}
        </div>
      </nav>
    </div>
  )
}