'use client';

import React from 'react';

export interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period?: string;
  };
  sparklineData?: number[];
  icon?: React.ReactNode;
  format?: 'currency' | 'number' | 'percentage';
  className?: string;
}

export function MetricsCard({
  title,
  value,
  change,
  sparklineData = [],
  icon,
  format = 'number',
  className = ''
}: MetricsCardProps) {
  const formatValue = (val: string | number) => {
    const numValue = typeof val === 'string' ? parseFloat(val) : val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(numValue);
      case 'percentage':
        return `${numValue.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('es-CO').format(numValue);
    }
  };

  const getChangeColor = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      default:
        return 'text-slate-600';
    }
  };

  const getChangeIcon = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        );
      case 'decrease':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
          </svg>
        );
      default:
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
    }
  };

  // Simple sparkline SVG generator
  const generateSparkline = (data: number[]) => {
    if (data.length < 2) return null;

    const width = 60;
    const height = 20;
    const padding = 2;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((value - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="text-blue-500">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className={`bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {icon && (
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              {icon}
            </div>
          )}
          <h3 className="text-sm font-medium text-slate-600">{title}</h3>
        </div>
        
        {sparklineData.length > 0 && (
          <div className="flex items-center">
            {generateSparkline(sparklineData)}
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mb-2">
        <p className="text-2xl font-bold text-slate-900">
          {formatValue(value)}
        </p>
      </div>

      {/* Change indicator */}
      {change && (
        <div className="flex items-center space-x-1">
          <div className={`flex items-center space-x-1 ${getChangeColor(change.type)}`}>
            {getChangeIcon(change.type)}
            <span className="text-sm font-medium">
              {Math.abs(change.value)}%
            </span>
          </div>
          {change.period && (
            <span className="text-sm text-slate-500">
              vs {change.period}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Preset configurations for common metrics
export const MetricsPresets = {
  sales: {
    title: 'Ventas',
    format: 'currency' as const,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    )
  },
  orders: {
    title: 'Pedidos',
    format: 'number' as const,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    )
  },
  conversion: {
    title: 'Conversión',
    format: 'percentage' as const,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  customers: {
    title: 'Clientes',
    format: 'number' as const,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
      </svg>
    )
  },
  aov: {
    title: 'Ticket Promedio',
    format: 'currency' as const,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  }
};