'use client'

import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { Search, FileText, ShoppingCart, Users, BarChart3, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CommandItem {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  href: string
  category: string
}

const commands: CommandItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Global',
    description: 'Ver métricas generales',
    icon: <BarChart3 className="w-4 h-4" />,
    href: '/admin/dashboard',
    category: 'Navegación'
  },
  {
    id: 'dashboard-tienda',
    title: 'Dashboard Tienda',
    description: 'Ver métricas de la tienda seleccionada',
    icon: <BarChart3 className="w-4 h-4" />,
    href: '/admin/dashboard-tienda',
    category: 'Navegación'
  },
  {
    id: 'pedidos-tienda',
    title: 'Pedidos Tienda',
    description: 'Gestionar pedidos de la tienda',
    icon: <ShoppingCart className="w-4 h-4" />,
    href: '/admin/pedidos-tienda',
    category: 'Vista Tienda'
  },
  {
    id: 'productos-tienda',
    title: 'Productos Tienda',
    description: 'Gestionar productos de la tienda',
    icon: <FileText className="w-4 h-4" />,
    href: '/admin/productos-tienda',
    category: 'Vista Tienda'
  },
  {
    id: 'clientes-tienda',
    title: 'Clientes Tienda',
    description: 'Gestionar clientes de la tienda',
    icon: <Users className="w-4 h-4" />,
    href: '/admin/clientes-tienda',
    category: 'Vista Tienda'
  },
  {
    id: 'contenido-tienda',
    title: 'Contenido Tienda',
    description: 'Gestionar contenido de la tienda',
    icon: <FileText className="w-4 h-4" />,
    href: '/admin/contenido-tienda',
    category: 'Vista Tienda'
  },
  {
    id: 'finanzas-tienda',
    title: 'Finanzas Tienda',
    description: 'Ver finanzas de la tienda',
    icon: <BarChart3 className="w-4 h-4" />,
    href: '/admin/finanzas-tienda',
    category: 'Vista Tienda'
  },
  {
    id: 'analitica-tienda',
    title: 'Analítica Tienda',
    description: 'Ver analíticas de la tienda',
    icon: <BarChart3 className="w-4 h-4" />,
    href: '/admin/analitica-tienda',
    category: 'Vista Tienda'
  },
  {
    id: 'marketing-tienda',
    title: 'Marketing Tienda',
    description: 'Gestionar marketing de la tienda',
    icon: <BarChart3 className="w-4 h-4" />,
    href: '/admin/marketing-tienda',
    category: 'Vista Tienda'
  },
  {
    id: 'descuentos-tienda',
    title: 'Descuentos Tienda',
    description: 'Gestionar descuentos de la tienda',
    icon: <Settings className="w-4 h-4" />,
    href: '/admin/descuentos-tienda',
    category: 'Vista Tienda'
  }
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-[20vh]">
      <Command className="mx-auto max-w-lg w-full bg-white rounded-lg shadow-2xl border">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Command.Input
            placeholder="Buscar páginas y comandos..."
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500"
          />
        </div>
        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-gray-500">
            No se encontraron resultados.
          </Command.Empty>
          
          {['Navegación', 'Vista Tienda'].map((category) => (
            <Command.Group key={category} heading={category} className="mb-2">
              {commands
                .filter((cmd) => cmd.category === category)
                .map((cmd) => (
                  <Command.Item
                    key={cmd.id}
                    value={cmd.title}
                    onSelect={() => handleSelect(cmd.href)}
                    className="flex items-center gap-2 px-2 py-2 text-sm rounded-md cursor-pointer hover:bg-gray-100 aria-selected:bg-gray-100"
                  >
                    {cmd.icon}
                    <div>
                      <div className="font-medium">{cmd.title}</div>
                      <div className="text-xs text-gray-500">{cmd.description}</div>
                    </div>
                  </Command.Item>
                ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command>
      <div 
        className="fixed inset-0 -z-10" 
        onClick={() => setOpen(false)}
      />
    </div>
  )
}