'use client'

import { useState } from 'react'
import { Button } from '@admin-griffe/ui'
import { 
  Filter, 
  Calendar, 
  MapPin, 
  ShoppingBag, 
  Users,
  X,
  ChevronDown
} from 'lucide-react'

export function ReportesFilters() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState({
    dateRange: 'last-30-days',
    regions: [] as string[],
    categories: [] as string[],
    storeTypes: [] as string[],
    userSegments: [] as string[]
  })

  const dateRanges = [
    { value: 'today', label: 'Hoy' },
    { value: 'yesterday', label: 'Ayer' },
    { value: 'last-7-days', label: 'Últimos 7 días' },
    { value: 'last-30-days', label: 'Últimos 30 días' },
    { value: 'last-90-days', label: 'Últimos 90 días' },
    { value: 'this-month', label: 'Este mes' },
    { value: 'last-month', label: 'Mes anterior' },
    { value: 'this-quarter', label: 'Este trimestre' },
    { value: 'this-year', label: 'Este año' },
    { value: 'custom', label: 'Personalizado' }
  ]

  const regions = [
    'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena', 
    'Bucaramanga', 'Pereira', 'Manizales', 'Ibagué', 'Otras'
  ]

  const categories = [
    'Moda y Accesorios', 'Tecnología', 'Hogar y Jardín', 'Deportes y Fitness',
    'Belleza y Cuidado Personal', 'Libros y Medios', 'Juguetes y Niños',
    'Automóviles', 'Salud y Bienestar', 'Otros'
  ]

  const storeTypes = [
    'Premium', 'Estándar', 'Básico', 'Nuevo', 'Verificado', 'Destacado'
  ]

  const userSegments = [
    'Nuevos (0-30 días)', 'Regulares (1-6 meses)', 'Leales (6+ meses)',
    'VIP (Alto valor)', 'Inactivos', 'Reactivados'
  ]

  const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
    if (filterType === 'dateRange') {
      setFilters(prev => ({ ...prev, [filterType]: value }))
    } else {
      setFilters(prev => {
        const currentValues = prev[filterType] as string[]
        const newValues = currentValues.includes(value)
          ? currentValues.filter(v => v !== value)
          : [...currentValues, value]
        return { ...prev, [filterType]: newValues }
      })
    }
  }

  const clearFilters = () => {
    setFilters({
      dateRange: 'last-30-days',
      regions: [],
      categories: [],
      storeTypes: [],
      userSegments: []
    })
  }

  const getActiveFiltersCount = () => {
    return filters.regions.length + 
           filters.categories.length + 
           filters.storeTypes.length + 
           filters.userSegments.length +
           (filters.dateRange !== 'last-30-days' ? 1 : 0)
  }

  const FilterSection = ({ 
    title, 
    icon, 
    options, 
    selectedValues, 
    filterType 
  }: {
    title: string
    icon: React.ReactNode
    options: string[]
    selectedValues: string[]
    filterType: keyof typeof filters
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="font-medium text-gray-900">{title}</h4>
        {selectedValues.length > 0 && (
          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            {selectedValues.length}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedValues.includes(option)}
              onChange={() => handleFilterChange(filterType, option)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{option}</span>
          </label>
        ))}
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-lg border">
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Filtros de Reportes</h3>
          {getActiveFiltersCount() > 0 && (
            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
              {getActiveFiltersCount()} activos
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {getActiveFiltersCount() > 0 && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpiar
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2"
          >
            {isExpanded ? 'Ocultar' : 'Mostrar'} Filtros
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Período:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {dateRanges.map((range) => (
            <Button
              key={range.value}
              variant={filters.dateRange === range.value ? 'primary' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange('dateRange', range.value)}
              className="text-xs"
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="p-6 space-y-6">
          <FilterSection
            title="Regiones"
            icon={<MapPin className="h-4 w-4 text-gray-500" />}
            options={regions}
            selectedValues={filters.regions}
            filterType="regions"
          />
          
          <FilterSection
            title="Categorías"
            icon={<ShoppingBag className="h-4 w-4 text-gray-500" />}
            options={categories}
            selectedValues={filters.categories}
            filterType="categories"
          />
          
          <FilterSection
            title="Tipos de Tienda"
            icon={<ShoppingBag className="h-4 w-4 text-gray-500" />}
            options={storeTypes}
            selectedValues={filters.storeTypes}
            filterType="storeTypes"
          />
          
          <FilterSection
            title="Segmentos de Usuario"
            icon={<Users className="h-4 w-4 text-gray-500" />}
            options={userSegments}
            selectedValues={filters.userSegments}
            filterType="userSegments"
          />
          
          {/* Custom Date Range */}
          {filters.dateRange === 'custom' && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                Rango Personalizado
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de fin
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Apply Filters */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={clearFilters}>
              Restablecer
            </Button>
            <Button variant="primary">
              Aplicar Filtros
            </Button>
          </div>
        </div>
      )}

      {/* Active Filters Summary */}
      {getActiveFiltersCount() > 0 && !isExpanded && (
        <div className="p-4 bg-blue-50 border-t">
          <div className="flex flex-wrap gap-2">
            {filters.dateRange !== 'last-30-days' && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Período: {dateRanges.find(r => r.value === filters.dateRange)?.label}
                <button onClick={() => handleFilterChange('dateRange', 'last-30-days')}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filters.regions.map((region) => (
              <span key={region} className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {region}
                <button onClick={() => handleFilterChange('regions', region)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            
            {filters.categories.map((category) => (
              <span key={category} className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                {category}
                <button onClick={() => handleFilterChange('categories', category)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            
            {filters.storeTypes.map((type) => (
              <span key={type} className="inline-flex items-center gap-1 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                {type}
                <button onClick={() => handleFilterChange('storeTypes', type)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            
            {filters.userSegments.map((segment) => (
              <span key={segment} className="inline-flex items-center gap-1 bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full">
                {segment}
                <button onClick={() => handleFilterChange('userSegments', segment)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}