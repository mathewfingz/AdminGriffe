export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard de Administración</h1>
        <p className="text-gray-600">Bienvenido al panel de control de AdminGriffe</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Tiendas</h3>
          <p className="text-2xl font-bold text-gray-900">24</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Usuarios Activos</h3>
          <p className="text-2xl font-bold text-gray-900">156</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Ventas del Mes</h3>
          <p className="text-2xl font-bold text-gray-900">$45,231</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Pedidos Pendientes</h3>
          <p className="text-2xl font-bold text-gray-900">12</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Actividad Reciente</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-sm text-gray-600">Nueva tienda registrada: "Boutique Central"</p>
              <span className="text-xs text-gray-400">hace 2 horas</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm text-gray-600">Usuario actualizado: juan@email.com</p>
              <span className="text-xs text-gray-400">hace 4 horas</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <p className="text-sm text-gray-600">Pedido pendiente de aprobación #1234</p>
              <span className="text-xs text-gray-400">hace 6 horas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}