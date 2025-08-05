import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | AdminGriffe',
  description: 'Panel de control para tiendas',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm border-r">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900">Mi Tienda</h1>
            <p className="text-sm text-gray-500">Panel de Control</p>
          </div>
          <nav className="mt-6">
            <div className="px-6 py-2">
              <a href="/dashboard" className="block text-gray-700 hover:text-gray-900">
                Resumen
              </a>
            </div>
            <div className="px-6 py-2">
              <a href="/dashboard/products" className="block text-gray-700 hover:text-gray-900">
                Productos
              </a>
            </div>
            <div className="px-6 py-2">
              <a href="/dashboard/orders" className="block text-gray-700 hover:text-gray-900">
                Pedidos
              </a>
            </div>
            <div className="px-6 py-2">
              <a href="/dashboard/customers" className="block text-gray-700 hover:text-gray-900">
                Clientes
              </a>
            </div>
            <div className="px-6 py-2">
              <a href="/dashboard/analytics" className="block text-gray-700 hover:text-gray-900">
                Analíticas
              </a>
            </div>
            <div className="px-6 py-2">
              <a href="/dashboard/settings" className="block text-gray-700 hover:text-gray-900">
                Configuración
              </a>
            </div>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <header className="bg-white shadow-sm border-b">
            <div className="px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Dashboard de Tienda
              </h2>
              <div className="flex items-center space-x-4">
                <button className="text-gray-500 hover:text-gray-700">
                  Notificaciones
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                  Perfil
                </button>
              </div>
            </div>
          </header>
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}