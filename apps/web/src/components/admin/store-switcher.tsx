'use client'

import { useState } from 'react'
import { Check, ChevronDown, Store } from 'lucide-react'
import { useStore } from '@/contexts/store-context'

export function StoreSwitcher() {
  const { selectedStore, stores, setSelectedStore } = useStore()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Store className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-900">
          {selectedStore?.name || 'Seleccionar tienda'}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-1">
                Tiendas disponibles
              </div>
              {stores.map((store) => (
                <button
                  key={store.id}
                  onClick={() => {
                    setSelectedStore(store)
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center justify-between px-2 py-2 text-sm rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      store.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{store.name}</div>
                      <div className="text-xs text-gray-500">{store.domain}</div>
                    </div>
                  </div>
                  {selectedStore?.id === store.id && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}