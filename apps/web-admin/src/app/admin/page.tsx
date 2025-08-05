import { KpiCard } from '@/components/admin/kpi-card'
import { AreaChart30d } from '@/components/admin/area-chart-30d'
import { TopStoresTable } from '@/components/admin/top-stores-table'
import { AlertsWidget } from '@/components/admin/alerts-widget'
import { 
  DollarSign, 
  Store, 
  ShoppingCart, 
  Users, 
  Percent 
} from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard Global
        </h1>
        <p className="text-gray-600 mt-1">
          Vista general del rendimiento de todas las tiendas
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KpiCard
          title="Ventas Totales"
          value="$12.4M"
          change={15.3}
          changeLabel="vs mes anterior"
          icon={<DollarSign className="w-6 h-6 text-blue-600" />}
          delay={0}
        />
        <KpiCard
          title="Tiendas Activas"
          value="247"
          change={8.1}
          changeLabel="nuevas este mes"
          icon={<Store className="w-6 h-6 text-green-600" />}
          delay={0.1}
        />
        <KpiCard
          title="Pedidos Globales"
          value="18,429"
          change={-2.4}
          changeLabel="vs mes anterior"
          icon={<ShoppingCart className="w-6 h-6 text-purple-600" />}
          delay={0.2}
        />
        <KpiCard
          title="Clientes"
          value="94,832"
          change={12.7}
          changeLabel="activos"
          icon={<Users className="w-6 h-6 text-orange-600" />}
          delay={0.3}
        />
        <KpiCard
          title="Comisión Total"
          value="$890K"
          change={18.9}
          changeLabel="este mes"
          icon={<Percent className="w-6 h-6 text-red-600" />}
          delay={0.4}
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-2">
          <AreaChart30d 
            title="Ventas y Pedidos - Últimos 30 días"
            delay={0.5}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TopStoresTable 
            title="Top 5 Tiendas por Ventas"
            delay={0.6}
          />
        </div>
        <div>
          <AlertsWidget 
            title="Alertas del Sistema"
            delay={0.7}
          />
        </div>
      </div>
    </div>
  )
}