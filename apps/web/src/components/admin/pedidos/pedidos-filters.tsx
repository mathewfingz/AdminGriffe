'use client'

import { useState } from 'react'
import { Button } from '@admin-griffe/ui'
import { X, Filter, RotateCcw } from 'lucide-react'

interface PedidosFiltersProps {
  onClose: () => void
}

export function PedidosFilters({ onClose }: PedidosFiltersProps) {
  const [filters, setFilters] = useState({
    estado: '',
    tienda: '',
    prioridad: '',
    metodoPago: '',
    fechaDesde: '',
    fechaHasta: '',
    montoMinimo: '',
    montoMaximo: ''
  })

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    setFilters({
      estado: '',
      tienda: '',
      prioridad: '',
      metodoPago: '',
      fechaDesde: '',
      fechaHasta: '',
      montoMinimo: '',
      montoMaximo: ''
    })
  }

  const handleApply = () => {
    // In real app, this would apply the filters
    console.log('Applying filters:', filters)
    onClose()
  }

  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Filtros Avanzados</h2>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Estado */}
        <div>
          <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            id="estado"
            value={filters.estado}
            onChange={(e) => handleFilterChange('estado', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmado">Confirmado</option>
            <option value="preparando">En Preparación</option>
            <option value="enviado">Enviado</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        {/* Tienda */}
        <div>
          <label htmlFor="tienda" className="block text-sm font-medium text-gray-700 mb-2">
            Tienda
          </label>
          <select
            id="tienda"
            value={filters.tienda}
            onChange={(e) => handleFilterChange('tienda', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las tiendas</option>
            <option value="1">Boutique Elegance</option>
            <option value="2">Tech Store</option>
            <option value="3">Fashion Hub</option>
            <option value="4">Sports World</option>
            <option value="5">Home & Garden</option>
          </select>
        </div>

        {/* Prioridad */}
        <div>
          <label htmlFor="prioridad" className="block text-sm font-medium text-gray-700 mb-2">
            Prioridad
          </label>
          <select
            id="prioridad"
            value={filters.prioridad}
            onChange={(e) => handleFilterChange('prioridad', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las prioridades</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </div>

        {/* Método de Pago */}
        <div>
          <label htmlFor="metodoPago" className="block text-sm font-medium text-gray-700 mb-2">
            Método de Pago
          </label>
          <select
            id="metodoPago"
            value={filters.metodoPago}
            onChange={(e) => handleFilterChange('metodoPago', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los métodos</option>
            <option value="tarjeta">Tarjeta de Crédito</option>
            <option value="pse">PSE</option>
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="nequi">Nequi</option>
            <option value="daviplata">Daviplata</option>
          </select>
        </div>

        {/* Fecha Desde */}
        <div>
          <label htmlFor="fechaDesde" className="block text-sm font-medium text-gray-700 mb-2">
            Fecha Desde
          </label>
          <input
            type="date"
            id="fechaDesde"
            value={filters.fechaDesde}
            onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Fecha Hasta */}
        <div>
          <label htmlFor="fechaHasta" className="block text-sm font-medium text-gray-700 mb-2">
            Fecha Hasta
          </label>
          <input
            type="date"
            id="fechaHasta"
            value={filters.fechaHasta}
            onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Monto Mínimo */}
        <div>
          <label htmlFor="montoMinimo" className="block text-sm font-medium text-gray-700 mb-2">
            Monto Mínimo
          </label>
          <input
            type="number"
            id="montoMinimo"
            value={filters.montoMinimo}
            onChange={(e) => handleFilterChange('montoMinimo', e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Monto Máximo */}
        <div>
          <label htmlFor="montoMaximo" className="block text-sm font-medium text-gray-700 mb-2">
            Monto Máximo
          </label>
          <input
            type="number"
            id="montoMaximo"
            value={filters.montoMaximo}
            onChange={(e) => handleFilterChange('montoMaximo', e.target.value)}
            placeholder="1000000"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Limpiar Filtros
        </Button>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleApply}>
            Aplicar Filtros
          </Button>
        </div>
      </div>
    </div>
  )
}