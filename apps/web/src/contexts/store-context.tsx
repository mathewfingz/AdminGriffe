'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface Store {
  id: string
  name: string
  domain: string
  status: 'active' | 'inactive'
}

interface StoreContextType {
  selectedStore: Store | null
  stores: Store[]
  setSelectedStore: (store: Store) => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

// Mock stores data
const mockStores: Store[] = [
  { id: '1', name: 'Tienda Principal', domain: 'principal.com', status: 'active' },
  { id: '2', name: 'Tienda Secundaria', domain: 'secundaria.com', status: 'active' },
  { id: '3', name: 'Tienda Beta', domain: 'beta.com', status: 'inactive' },
]

export function StoreProvider({ children }: { children: ReactNode }) {
  const [selectedStore, setSelectedStore] = useState<Store | null>(mockStores[0])
  const [stores] = useState<Store[]>(mockStores)

  return (
    <StoreContext.Provider value={{ selectedStore, stores, setSelectedStore }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}