'use client';

import React from 'react';

export interface StockBadgeProps {
  stock: number;
  minStock?: number;
  lowStock?: number;
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StockBadge({
  stock,
  minStock = 0,
  lowStock = 10,
  showIcon = true,
  showText = true,
  size = 'md',
  className = ''
}: StockBadgeProps) {
  const getStockStatus = () => {
    if (stock <= minStock) {
      return {
        status: 'out-of-stock',
        label: 'Sin stock',
        color: 'bg-red-100 text-red-800 border-red-200',
        iconColor: 'text-red-600'
      };
    } else if (stock <= lowStock) {
      return {
        status: 'low-stock',
        label: 'Stock bajo',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        iconColor: 'text-yellow-600'
      };
    } else {
      return {
        status: 'in-stock',
        label: 'En stock',
        color: 'bg-green-100 text-green-800 border-green-200',
        iconColor: 'text-green-600'
      };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-3 py-2 text-sm';
      default:
        return 'px-2.5 py-1.5 text-xs';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'lg':
        return 'w-5 h-5';
      default:
        return 'w-4 h-4';
    }
  };

  const stockInfo = getStockStatus();

  const getStockIcon = () => {
    switch (stockInfo.status) {
      case 'out-of-stock':
        return (
          <svg className={`${getIconSize()} ${stockInfo.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'low-stock':
        return (
          <svg className={`${getIconSize()} ${stockInfo.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return (
          <svg className={`${getIconSize()} ${stockInfo.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
    }
  };

  const formatStock = (value: number) => {
    return new Intl.NumberFormat('es-CO').format(value);
  };

  return (
    <span className={`
      inline-flex items-center font-medium border rounded-full
      ${stockInfo.color}
      ${getSizeClasses()}
      ${className}
    `}>
      {showIcon && (
        <span className="mr-1">
          {getStockIcon()}
        </span>
      )}
      
      {showText && (
        <span>
          {formatStock(stock)} unidades
        </span>
      )}
      
      {!showText && (
        <span>
          {formatStock(stock)}
        </span>
      )}
    </span>
  );
}

// Utility function to get stock status without rendering
export function getStockStatus(stock: number, minStock = 0, lowStock = 10) {
  if (stock <= minStock) {
    return 'out-of-stock';
  } else if (stock <= lowStock) {
    return 'low-stock';
  } else {
    return 'in-stock';
  }
}

// Preset configurations for different stock scenarios
export const StockPresets = {
  product: {
    minStock: 0,
    lowStock: 10,
    showIcon: true,
    showText: true
  },
  variant: {
    minStock: 0,
    lowStock: 5,
    showIcon: true,
    showText: false
  },
  warehouse: {
    minStock: 0,
    lowStock: 20,
    showIcon: true,
    showText: true
  }
};

// Component for displaying multiple stock levels (e.g., different warehouses)
export interface MultiStockBadgeProps {
  stocks: Array<{
    label: string;
    stock: number;
    minStock?: number;
    lowStock?: number;
  }>;
  className?: string;
}

export function MultiStockBadge({ stocks, className = '' }: MultiStockBadgeProps) {
  const totalStock = stocks.reduce((sum, item) => sum + item.stock, 0);
  const hasLowStock = stocks.some(item => 
    getStockStatus(item.stock, item.minStock, item.lowStock) === 'low-stock'
  );
  const hasOutOfStock = stocks.some(item => 
    getStockStatus(item.stock, item.minStock, item.lowStock) === 'out-of-stock'
  );

  const overallStatus = hasOutOfStock ? 'out-of-stock' : hasLowStock ? 'low-stock' : 'in-stock';

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Overall status */}
      <StockBadge 
        stock={totalStock} 
        minStock={0}
        lowStock={stocks.reduce((sum, item) => sum + (item.lowStock || 10), 0)}
        showText={false}
      />
      
      {/* Individual stocks */}
      <div className="space-y-1">
        {stocks.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <span className="text-slate-600">{item.label}</span>
            <StockBadge 
              stock={item.stock}
              minStock={item.minStock}
              lowStock={item.lowStock}
              size="sm"
              showIcon={false}
              showText={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}