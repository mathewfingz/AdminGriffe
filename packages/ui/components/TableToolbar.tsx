'use client';

import React, { useState } from 'react';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface BulkAction {
  label: string;
  value: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

export interface TableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: {
    label: string;
    key: string;
    options: FilterOption[];
    value: string;
    onChange: (value: string) => void;
  }[];
  bulkActions?: BulkAction[];
  selectedCount?: number;
  onBulkAction?: (action: string) => void;
  onExport?: () => void;
  onImport?: () => void;
  className?: string;
}

export function TableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  filters = [],
  bulkActions = [],
  selectedCount = 0,
  onBulkAction,
  onExport,
  onImport,
  className = ''
}: TableToolbarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = filters.some(filter => filter.value !== '');

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left side - Search and filters */}
        <div className="flex items-center space-x-3 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-4 w-4 text-slate-400 hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter toggle */}
          {filters.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                inline-flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium
                ${hasActiveFilters 
                  ? 'bg-blue-50 text-blue-700 border-blue-300' 
                  : 'bg-white text-slate-700 hover:bg-slate-50'
                }
              `}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filtros
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {filters.filter(f => f.value !== '').length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          {/* Bulk actions */}
          {selectedCount > 0 && bulkActions.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">
                {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
              </span>
              <select
                onChange={(e) => {
                  if (e.target.value && onBulkAction) {
                    onBulkAction(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="text-sm border border-slate-300 rounded-md px-3 py-1.5"
                defaultValue=""
              >
                <option value="">Acciones</option>
                {bulkActions.map(action => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Export/Import */}
          <div className="flex items-center space-x-2">
            {onImport && (
              <button
                onClick={onImport}
                className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Importar
              </button>
            )}
            
            {onExport && (
              <button
                onClick={onExport}
                className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && filters.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-slate-900">Filtros</h4>
            <button
              onClick={() => {
                filters.forEach(filter => filter.onChange(''));
              }}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Limpiar todos
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filters.map(filter => (
              <div key={filter.key}>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {filter.label}
                </label>
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-md px-3 py-1.5"
                >
                  <option value="">Todos</option>
                  {filter.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                      {option.count !== undefined && ` (${option.count})`}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Filtros activos:</span>
          {filters
            .filter(filter => filter.value !== '')
            .map(filter => {
              const selectedOption = filter.options.find(opt => opt.value === filter.value);
              return (
                <span
                  key={filter.key}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {filter.label}: {selectedOption?.label}
                  <button
                    onClick={() => filter.onChange('')}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              );
            })}
        </div>
      )}
    </div>
  );
}