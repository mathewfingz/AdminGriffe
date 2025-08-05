'use client'

import { useState } from 'react'
import { Button } from '@admin-griffe/ui'
import { BarChart3, LineChart, PieChart, TrendingUp } from 'lucide-react'

interface FinanzasChartsProps {
  period: string
}

export function FinanzasCharts({ period }: FinanzasChartsProps) {
  const [selectedChart, setSelectedChart] = useState('revenue')

  // Mock chart data
  const revenueData = [
    { month: 'Ene', ingresos: 3200000, comisiones: 160000 },
    { month: 'Feb', ingresos: 3800000, comisiones: 190000 },
    { month: 'Mar', ingresos: 4200000, comisiones: 210000 },
    { month: 'Abr', ingresos: 3900000, comisiones: 195000 },
    { month: 'May', ingresos: 4500000, comisiones: 225000 },
    { month: 'Jun', ingresos: 5100000, comisiones: 255000 }
  ]

  const transactionData = [
    { day: 'Lun', transacciones: 45 },
    { day: 'Mar', transacciones: 52 },
    { day: 'Mié', transacciones: 38 },
    { day: 'Jue', transacciones: 61 },
    { day: 'Vie', transacciones: 73 },
    { day: 'Sáb', transacciones: 89 },
    { day: 'Dom', transacciones: 34 }
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const RevenueChart = () => {
    const maxValue = Math.max(...revenueData.map(d => d.ingresos))
    
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Ingresos y Comisiones</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Ingresos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Comisiones</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          {revenueData.map((data, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{data.month}</span>
                <div className="flex gap-4">
                  <span className="text-blue-600">{formatCurrency(data.ingresos)}</span>
                  <span className="text-green-600">{formatCurrency(data.comisiones)}</span>
                </div>
              </div>
              
              <div className="space-y-1">
                {/* Ingresos bar */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${(data.ingresos / maxValue) * 100}%` }}
                  ></div>
                </div>
                
                {/* Comisiones bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(data.comisiones / (maxValue * 0.05)) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const TransactionChart = () => {
    const maxTransactions = Math.max(...transactionData.map(d => d.transacciones))
    
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Transacciones por Día</h3>
          <TrendingUp className="h-5 w-5 text-green-500" />
        </div>
        
        <div className="flex items-end justify-between h-64 gap-2">
          {transactionData.map((data, index) => (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className="w-full flex flex-col justify-end h-48">
                <div 
                  className="bg-purple-500 rounded-t transition-all duration-300 hover:bg-purple-600 cursor-pointer"
                  style={{ height: `${(data.transacciones / maxTransactions) * 100}%` }}
                  title={`${data.transacciones} transacciones`}
                ></div>
              </div>
              <div className="mt-2 text-sm font-medium text-gray-600">{data.day}</div>
              <div className="text-xs text-gray-500">{data.transacciones}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const PaymentMethodsChart = () => {
    const paymentMethods = [
      { name: 'Tarjeta', value: 45, color: 'bg-blue-500' },
      { name: 'PSE', value: 28, color: 'bg-green-500' },
      { name: 'Nequi', value: 15, color: 'bg-purple-500' },
      { name: 'Efectivo', value: 8, color: 'bg-orange-500' },
      { name: 'Otros', value: 4, color: 'bg-gray-500' }
    ]

    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-6">Métodos de Pago</h3>
        
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-48 h-48">
            {/* Simple pie chart representation */}
            <div className="w-full h-full rounded-full bg-gradient-to-r from-blue-500 via-green-500 via-purple-500 via-orange-500 to-gray-500"></div>
            <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">100%</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {paymentMethods.map((method, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded ${method.color}`}></div>
                <span className="text-sm font-medium">{method.name}</span>
              </div>
              <span className="text-sm text-gray-600">{method.value}%</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const GrowthChart = () => {
    const growthData = [
      { period: 'Q1 2023', growth: 15 },
      { period: 'Q2 2023', growth: 23 },
      { period: 'Q3 2023', growth: 18 },
      { period: 'Q4 2023', growth: 31 },
      { period: 'Q1 2024', growth: 28 }
    ]

    const maxGrowth = Math.max(...growthData.map(d => d.growth))

    return (
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-semibold mb-6">Crecimiento Trimestral</h3>
        
        <div className="space-y-4">
          {growthData.map((data, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{data.period}</span>
                <span className="text-green-600 font-semibold">+{data.growth}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${(data.growth / maxGrowth) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Chart Selection */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'revenue', label: 'Ingresos', icon: <BarChart3 className="h-4 w-4" /> },
          { id: 'transactions', label: 'Transacciones', icon: <LineChart className="h-4 w-4" /> },
          { id: 'payments', label: 'Métodos de Pago', icon: <PieChart className="h-4 w-4" /> },
          { id: 'growth', label: 'Crecimiento', icon: <TrendingUp className="h-4 w-4" /> }
        ].map((chart) => (
          <Button
            key={chart.id}
            variant={selectedChart === chart.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedChart(chart.id)}
            className="flex items-center gap-2 whitespace-nowrap"
          >
            {chart.icon}
            {chart.label}
          </Button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {selectedChart === 'revenue' && (
          <>
            <RevenueChart />
            <GrowthChart />
          </>
        )}
        
        {selectedChart === 'transactions' && (
          <>
            <TransactionChart />
            <PaymentMethodsChart />
          </>
        )}
        
        {selectedChart === 'payments' && (
          <>
            <PaymentMethodsChart />
            <RevenueChart />
          </>
        )}
        
        {selectedChart === 'growth' && (
          <>
            <GrowthChart />
            <TransactionChart />
          </>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <h4 className="text-lg font-semibold mb-2">Proyección Mensual</h4>
          <p className="text-3xl font-bold">{formatCurrency(5800000)}</p>
          <p className="text-blue-100 text-sm">Basado en tendencia actual</p>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <h4 className="text-lg font-semibold mb-2">Eficiencia de Comisiones</h4>
          <p className="text-3xl font-bold">5.2%</p>
          <p className="text-green-100 text-sm">Promedio de la plataforma</p>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <h4 className="text-lg font-semibold mb-2">ROI de Tiendas</h4>
          <p className="text-3xl font-bold">127%</p>
          <p className="text-purple-100 text-sm">Retorno promedio anual</p>
        </div>
      </div>
    </div>
  )
}