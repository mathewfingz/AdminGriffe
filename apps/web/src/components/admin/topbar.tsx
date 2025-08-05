'use client'

import { Search, Bell, User } from 'lucide-react'
import { StoreSwitcher } from './store-switcher'

export function Topbar() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <StoreSwitcher />
      </div>

      <div className="flex items-center gap-4">
        {/* Search trigger for Command Palette */}
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors">
          <Search className="w-4 h-4" />
          <span>Buscar...</span>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-gray-500">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User menu */}
        <button className="flex items-center gap-2 p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium">Admin User</div>
            <div className="text-xs text-gray-500">admin@admingriffe.com</div>
          </div>
        </button>
      </div>
    </header>
  )
}