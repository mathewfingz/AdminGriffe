import { Metadata } from 'next'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingBag,
  Download,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react'
import { Button } from '@admin-griffe/ui'
import { ReportesBI } from '@/components/admin/reportes/reportes-bi'
import { ReportesFilters } from '@/components/admin/reportes/reportes-filters'

export const metadata: Metadata = {
  title: 'Reportes - Admin Dashboard',
  description: 'Business Intelligence y reportes avanzados del sistema'
}

export default function ReportesPage() {
  // Mock data for summary cards
  const summaryData = [
    {
      title: 'Ingresos Totales',
      value: '$24.8M',
      change: '+12.5%',
      trend: 'up',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'bg-green-500'
    },
    {
      title: 'Tiendas Activas',
      value: '1,247',
      change: '+8.2%',
      trend: 'up',
      icon: <ShoppingBag className="h-6 w-6" />,
      color: 'bg-blue-500'
    },
    {
      title: 'Usuarios Registrados',
      value: '45,892',
      change: '+15.3%',
      trend: 'up',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-purple-500'
    },
    {
      title: 'Transacciones',
      value: '128,456',
      change: '+22.1%',
      trend: 'up',
      icon: <BarChart3 className="h-6 w-6" />,
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes y Analítica</h1>
          <p className="text-gray-600 mt-1">
            Business Intelligence y métricas avanzadas de la plataforma
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Período
          </Button>
          <Button variant="primary" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryData.map((item, index) => (
          <div key={index} className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">{item.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{item.value}</p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${
                    item.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs mes anterior</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${item.color} text-white`}>
                {item.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <ReportesFilters />

      {/* BI Dashboard */}
      <ReportesBI />

      {/* Quick Reports */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Reportes Rápidos</h2>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Personalizar
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Ventas por Categoría',
              description: 'Análisis de rendimiento por categorías de productos',
              lastUpdated: 'Hace 2 horas',
              status: 'ready'
            },
            {
              title: 'Comportamiento de Usuarios',
              description: 'Patrones de navegación y conversión',
              lastUpdated: 'Hace 1 hora',
              status: 'ready'
            },
            {
              title: 'Análisis Geográfico',
              description: 'Distribución de ventas por regiones',
              lastUpdated: 'Hace 30 min',
              status: 'ready'
            },
            {
              title: 'Tendencias de Pago',
              description: 'Preferencias de métodos de pago',
              lastUpdated: 'Generando...',
              status: 'processing'
            },
            {
              title: 'Retención de Clientes',
              description: 'Análisis de lealtad y retención',
              lastUpdated: 'Hace 4 horas',
              status: 'ready'
            },
            {
              title: 'Performance de Tiendas',
              description: 'Ranking y métricas de tiendas',
              lastUpdated: 'Hace 1 hora',
              status: 'ready'
            }
          ].map((report, index) => (
            <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{report.title}</h3>
                <div className={`w-2 h-2 rounded-full ${
                  report.status === 'ready' ? 'bg-green-500' : 'bg-yellow-500'
                }`}></div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{report.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{report.lastUpdated}</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={report.status === 'processing'}
                  className="flex items-center gap-1"
                >
                  <Download className="h-3 w-3" />
                  {report.status === 'processing' ? 'Generando...' : 'Descargar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduled Reports */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Reportes Programados</h2>
          <Button variant="primary" size="sm">
            Nuevo Reporte
          </Button>
        </div>
        
        <div className="space-y-4">
          {[
            {
              name: 'Reporte Mensual de Ventas',
              frequency: 'Mensual - Primer día del mes',
              recipients: 'admin@admingriffe.com, gerencia@admingriffe.com',
              nextRun: '01 Feb 2024, 09:00 AM',
              status: 'active'
            },
            {
              name: 'Análisis Semanal de Performance',
              frequency: 'Semanal - Lunes',
              recipients: 'equipo@admingriffe.com',
              nextRun: '22 Jan 2024, 08:00 AM',
              status: 'active'
            },
            {
              name: 'Reporte Trimestral Ejecutivo',
              frequency: 'Trimestral',
              recipients: 'ceo@admingriffe.com, cfo@admingriffe.com',
              nextRun: '01 Apr 2024, 10:00 AM',
              status: 'paused'
            }
          ].map((report, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900">{report.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {report.status === 'active' ? 'Activo' : 'Pausado'}
                    </span>
                  </div>
                  
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Frecuencia:</span> {report.frequency}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Destinatarios:</span> {report.recipients}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Próxima ejecución:</span> {report.nextRun}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className={report.status === 'active' ? 'text-yellow-600' : 'text-green-600'}
                  >
                    {report.status === 'active' ? 'Pausar' : 'Activar'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}