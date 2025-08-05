'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Store {
  id: string
  name: string
  ventas: number
  margen: number
  cambio: number
}

interface TopStoresTableProps {
  title?: string
  delay?: number
}

// Mock data
const mockStores: Store[] = [
  {
    id: '1',
    name: 'Tienda Fashion Central',
    ventas: 2450000,
    margen: 24.5,
    cambio: 12.3
  },
  {
    id: '2',
    name: 'Electronics Pro',
    ventas: 1890000,
    margen: 18.2,
    cambio: -3.1
  },
  {
    id: '3',
    name: 'Home & Garden',
    ventas: 1650000,
    margen: 31.8,
    cambio: 8.7
  },
  {
    id: '4',
    name: 'Sports World',
    ventas: 1420000,
    margen: 22.1,
    cambio: 15.2
  },
  {
    id: '5',
    name: 'Beauty Corner',
    ventas: 1180000,
    margen: 28.9,
    cambio: -1.8
  }
]

export function TopStoresTable({ title = "Top 5 Tiendas", delay = 0 }: TopStoresTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-lg border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      <div className="overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-0 text-sm font-medium text-gray-500 uppercase tracking-wider">
                Tienda
              </th>
              <th className="text-right py-3 px-0 text-sm font-medium text-gray-500 uppercase tracking-wider">
                Ventas COP
              </th>
              <th className="text-right py-3 px-0 text-sm font-medium text-gray-500 uppercase tracking-wider">
                Margen %
              </th>
              <th className="text-right py-3 px-0 text-sm font-medium text-gray-500 uppercase tracking-wider">
                Cambio
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {mockStores.map((store, index) => (
              <motion.tr
                key={store.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: delay + (index * 0.1) }}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-0">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-blue-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {store.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-0 text-right">
                  <div className="text-sm font-medium text-gray-900">
                    ${store.ventas.toLocaleString()}
                  </div>
                </td>
                <td className="py-4 px-0 text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {store.margen}%
                  </div>
                </td>
                <td className="py-4 px-0 text-right">
                  <div className="flex items-center justify-end">
                    {store.cambio > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        store.cambio > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {store.cambio > 0 ? '+' : ''}{store.cambio}%
                    </span>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}