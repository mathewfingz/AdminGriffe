export default function StoreDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi Tienda</h1>
        <p className="text-gray-600">Resumen de tu negocio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Productos</h3>
          <p className="text-2xl font-bold text-gray-900">48</p>
          <p className="text-xs text-green-600">+12% este mes</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Pedidos Hoy</h3>
          <p className="text-2xl font-bold text-gray-900">7</p>
          <p className="text-xs text-green-600">+3 desde ayer</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Ventas del Día</h3>
          <p className="text-2xl font-bold text-gray-900">$1,234</p>
          <p className="text-xs text-green-600">+8% vs ayer</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Clientes</h3>
          <p className="text-2xl font-bold text-gray-900">89</p>
          <p className="text-xs text-blue-600">5 nuevos</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Acciones Rápidas</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <h4 className="font-medium text-gray-900">Agregar Producto</h4>
              <p className="text-sm text-gray-500">Añade un nuevo producto a tu catálogo</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <h4 className="font-medium text-gray-900">Ver Pedidos</h4>
              <p className="text-sm text-gray-500">Gestiona los pedidos pendientes</p>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <h4 className="font-medium text-gray-900">Analíticas</h4>
              <p className="text-sm text-gray-500">Revisa el rendimiento de tu tienda</p>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Pedidos Recientes</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">#ORD-001</p>
                <p className="text-sm text-gray-500">Juan Pérez - hace 2 horas</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">$89.99</p>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Pendiente
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <p className="font-medium text-gray-900">#ORD-002</p>
                <p className="text-sm text-gray-500">María García - hace 4 horas</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">$156.50</p>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Completado
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}