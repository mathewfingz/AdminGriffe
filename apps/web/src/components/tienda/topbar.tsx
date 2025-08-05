'use client'

import { Search, Bell, User, ChevronDown, Store } from 'lucide-react'
import { CommandPalette } from '@/components/admin/command-palette'
import { useStore } from '@/contexts/store-context'

export function TiendaTopbar() {
  const { selectedStore } = useStore()

  return (
    <>
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        {/* Left side - Store Switcher */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Store className="w-4 h-4" />
              <span>{selectedStore?.name || 'Seleccionar tienda'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {/* Store dropdown would go here */}
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-500 bg-gray-50 rounded-lg">
            <Search className="w-4 h-4" />
            <span>Buscar productos, pedidos...</span>
            <div className="ml-auto flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded">
                ⌘
              </kbd>
              <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded">
                K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right side - Notifications & User */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Juan Pérez</p>
              <p className="text-xs text-gray-500">Administrador</p>
            </div>
            <button className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Command Palette - Se activa globalmente con ⌘K */}
      <CommandPalette />
    </>
  )
}