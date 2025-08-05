import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard | AdminGriffe',
  description: 'Panel de administración de AdminGriffe',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-sm">
          <div className="p-6">
            <h1 className="text-xl font-bold text-gray-900">AdminGriffe</h1>
            <p className="text-sm text-gray-500">Panel de Administración</p>
          </div>
          <nav className="mt-6">
            <div className="px-6 py-2">
              <a href="/admin" className="block text-gray-700 hover:text-gray-900">
                Dashboard
              </a>
            </div>
            <div className="px-6 py-2">
              <a href="/admin/stores" className="block text-gray-700 hover:text-gray-900">
                Tiendas
              </a>
            </div>
            <div className="px-6 py-2">
              <a href="/admin/users" className="block text-gray-700 hover:text-gray-900">
                Usuarios
              </a>
            </div>
            <div className="px-6 py-2">
              <a href="/admin/settings" className="block text-gray-700 hover:text-gray-900">
                Configuración
              </a>
            </div>
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1">
          <header className="bg-white shadow-sm">
            <div className="px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Dashboard de Administración
              </h2>
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