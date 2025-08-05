'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, MoreHorizontal, Eye } from 'lucide-react'
import { useState } from 'react'

interface KpiCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  delay?: number
  trend?: 'up' | 'down' | 'neutral'
  subtitle?: string
  onClick?: () => void
  showActions?: boolean
  loading?: boolean
}

export function KpiCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon,
  delay = 0,
  trend,
  subtitle,
  onClick,
  showActions = false,
  loading = false
}: KpiCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const isPositive = change && change > 0
  const isNegative = change && change < 0

  // Determine trend based on change if not explicitly provided
  const finalTrend = trend || (isPositive ? 'up' : isNegative ? 'down' : 'neutral')

  const getTrendColor = () => {
    switch (finalTrend) {
      case 'up':
        return 'text-green-600 bg-green-50'
      case 'down':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getIconBackground = () => {
    switch (finalTrend) {
      case 'up':
        return 'bg-green-50'
      case 'down':
        return 'bg-red-50'
      default:
        return 'bg-blue-50'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 relative group ${
        onClick ? 'cursor-pointer hover:border-blue-300' : ''
      } ${loading ? 'animate-pulse' : ''}`}
      onClick={onClick}
    >
      {/* Actions Menu */}
      {showActions && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
          
          {showMenu && (
            <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
                <Eye className="w-3 h-3" />
                Ver detalles
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {loading && <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />}
          </div>
          
          {subtitle && (
            <p className="text-xs text-gray-500 mb-2">{subtitle}</p>
          )}
          
          <p className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            {loading ? '---' : value}
          </p>
          
          {change !== undefined && !loading && (
            <div className="flex items-center">
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTrendColor()}`}>
                {isPositive && <TrendingUp className="w-3 h-3 mr-1" />}
                {isNegative && <TrendingDown className="w-3 h-3 mr-1" />}
                <span>
                  {change > 0 ? '+' : ''}{change}%
                </span>
              </div>
              {changeLabel && (
                <span className="text-xs text-gray-500 ml-2">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className={`w-14 h-14 ${getIconBackground()} rounded-xl flex items-center justify-center transition-colors`}>
              {icon}
            </div>
          </div>
        )}
      </div>

      {/* Hover effect overlay */}
      {onClick && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </motion.div>
  )
}