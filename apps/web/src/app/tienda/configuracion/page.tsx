'use client'

import { useState } from 'react'
import { Button } from '@admin-griffe/ui'
import { 
  Save,
  Upload,
  Eye,
  EyeOff,
  Store,
  MapPin,
  Clock,
  CreditCard,
  Truck,
  Bell,
  Shield,
  Palette,
  Globe,
  Mail,
  Phone,
  Camera,
  Settings,
  Info
} from 'lucide-react'

export default function ConfiguracionTiendaPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    // General
    nombreTienda: 'Mi Tienda Fashion',
    descripcion: 'Tienda especializada en moda urbana y accesorios',
    logo: '',
    banner: '',
    telefono: '+57 300 123 4567',
    email: 'contacto@mitienda.com',
    sitioWeb: 'https://mitienda.com',
    
    // Ubicación
    direccion: 'Calle 123 #45-67',
    ciudad: 'Bogotá',
    departamento: 'Cundinamarca',
    codigoPostal: '110111',
    pais: 'Colombia',
    
    // Horarios
    horarios: {
      lunes: { abierto: true, apertura: '09:00', cierre: '18:00' },
      martes: { abierto: true, apertura: '09:00', cierre: '18:00' },
      miercoles: { abierto: true, apertura: '09:00', cierre: '18:00' },
      jueves: { abierto: true, apertura: '09:00', cierre: '18:00' },
      viernes: { abierto: true, apertura: '09:00', cierre: '20:00' },
      sabado: { abierto: true, apertura: '10:00', cierre: '19:00' },
      domingo: { abierto: false, apertura: '10:00', cierre: '17:00' }
    },
    
    // Pagos
    metodosHabilitados: ['efectivo', 'tarjeta', 'transferencia', 'pse'],
    comisionTarjeta: 3.5,
    
    // Envíos
    envioGratis: true,
    montoEnvioGratis: 150000,
    costoEnvio: 15000,
    tiempoEntrega: '2-3 días hábiles',
    
    // Notificaciones
    notificacionesPedidos: true,
    notificacionesInventario: true,
    notificacionesClientes: true,
    notificacionesEmail: true,
    notificacionesSMS: false,
    
    // Seguridad
    autenticacionDosFactor: false,
    sesionSegura: true,
    
    // Apariencia
    colorPrimario: '#3B82F6',
    colorSecundario: '#10B981',
    tema: 'claro'
  })

  const tabs = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'ubicacion', label: 'Ubicación', icon: MapPin },
    { id: 'horarios', label: 'Horarios', icon: Clock },
    { id: 'pagos', label: 'Pagos', icon: CreditCard },
    { id: 'envios', label: 'Envíos', icon: Truck },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'seguridad', label: 'Seguridad', icon: Shield },
    { id: 'apariencia', label: 'Apariencia', icon: Palette }
  ]

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleHorarioChange = (dia: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [dia]: {
          ...prev.horarios[dia as keyof typeof prev.horarios],
          [field]: value
        }
      }
    }))
  }

  const handleSave = () => {
    console.log('Guardando configuración:', formData)
    // Aquí iría la lógica para guardar
  }

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Información General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la tienda
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.nombreTienda}
              onChange={(e) => handleInputChange('nombreTienda', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.telefono}
              onChange={(e) => handleInputChange('telefono', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sitio web
            </label>
            <input
              type="url"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.sitioWeb}
              onChange={(e) => handleInputChange('sitioWeb', e.target.value)}
            />
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.descripcion}
            onChange={(e) => handleInputChange('descripcion', e.target.value)}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Imágenes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo de la tienda
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Camera className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Logo
                </Button>
              </div>
              <p className="mt-2 text-sm text-gray-500">PNG, JPG hasta 2MB</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banner de la tienda
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Camera className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Banner
                </Button>
              </div>
              <p className="mt-2 text-sm text-gray-500">PNG, JPG hasta 5MB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderUbicacionTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dirección de la tienda</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.direccion}
              onChange={(e) => handleInputChange('direccion', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ciudad
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.ciudad}
              onChange={(e) => handleInputChange('ciudad', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Departamento
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.departamento}
              onChange={(e) => handleInputChange('departamento', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código postal
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.codigoPostal}
              onChange={(e) => handleInputChange('codigoPostal', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              País
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.pais}
              onChange={(e) => handleInputChange('pais', e.target.value)}
            >
              <option value="Colombia">Colombia</option>
              <option value="México">México</option>
              <option value="Argentina">Argentina</option>
              <option value="Chile">Chile</option>
              <option value="Perú">Perú</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderHorariosTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Horarios de atención</h3>
        <div className="space-y-4">
          {Object.entries(formData.horarios).map(([dia, horario]) => (
            <div key={dia} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-24">
                <span className="text-sm font-medium text-gray-900 capitalize">{dia}</span>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={horario.abierto}
                  onChange={(e) => handleHorarioChange(dia, 'abierto', e.target.checked)}
                />
                <span className="ml-2 text-sm text-gray-600">Abierto</span>
              </div>
              
              {horario.abierto && (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Apertura</label>
                    <input
                      type="time"
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      value={horario.apertura}
                      onChange={(e) => handleHorarioChange(dia, 'apertura', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Cierre</label>
                    <input
                      type="time"
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                      value={horario.cierre}
                      onChange={(e) => handleHorarioChange(dia, 'cierre', e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderPagosTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Métodos de pago</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { id: 'efectivo', label: 'Efectivo' },
            { id: 'tarjeta', label: 'Tarjeta' },
            { id: 'transferencia', label: 'Transferencia' },
            { id: 'pse', label: 'PSE' }
          ].map(metodo => (
            <div key={metodo.id} className="flex items-center p-3 border border-gray-200 rounded-lg">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={formData.metodosHabilitados.includes(metodo.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleInputChange('metodosHabilitados', [...formData.metodosHabilitados, metodo.id])
                  } else {
                    handleInputChange('metodosHabilitados', formData.metodosHabilitados.filter(m => m !== metodo.id))
                  }
                }}
              />
              <span className="ml-2 text-sm text-gray-900">{metodo.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de comisiones</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comisión por tarjeta (%)
            </label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.comisionTarjeta}
              onChange={(e) => handleInputChange('comisionTarjeta', parseFloat(e.target.value))}
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderEnviosTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de envíos</h3>
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={formData.envioGratis}
              onChange={(e) => handleInputChange('envioGratis', e.target.checked)}
            />
            <span className="ml-2 text-sm text-gray-900">Ofrecer envío gratis</span>
          </div>
          
          {formData.envioGratis && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto mínimo para envío gratis
              </label>
              <input
                type="number"
                className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.montoEnvioGratis}
                onChange={(e) => handleInputChange('montoEnvioGratis', parseInt(e.target.value))}
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Costo de envío estándar
            </label>
            <input
              type="number"
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.costoEnvio}
              onChange={(e) => handleInputChange('costoEnvio', parseInt(e.target.value))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiempo de entrega
            </label>
            <input
              type="text"
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.tiempoEntrega}
              onChange={(e) => handleInputChange('tiempoEntrega', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotificacionesTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preferencias de notificaciones</h3>
        <div className="space-y-4">
          {[
            { key: 'notificacionesPedidos', label: 'Nuevos pedidos' },
            { key: 'notificacionesInventario', label: 'Alertas de inventario' },
            { key: 'notificacionesClientes', label: 'Nuevos clientes' },
            { key: 'notificacionesEmail', label: 'Notificaciones por email' },
            { key: 'notificacionesSMS', label: 'Notificaciones por SMS' }
          ].map(notif => (
            <div key={notif.key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <span className="text-sm text-gray-900">{notif.label}</span>
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={formData[notif.key as keyof typeof formData] as boolean}
                onChange={(e) => handleInputChange(notif.key, e.target.checked)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSeguridadTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuración de seguridad</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-900">Autenticación de dos factores</span>
              <p className="text-xs text-gray-500">Añade una capa extra de seguridad</p>
            </div>
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={formData.autenticacionDosFactor}
              onChange={(e) => handleInputChange('autenticacionDosFactor', e.target.checked)}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <span className="text-sm font-medium text-gray-900">Sesión segura</span>
              <p className="text-xs text-gray-500">Cierra sesión automáticamente por inactividad</p>
            </div>
            <input
              type="checkbox"
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={formData.sesionSegura}
              onChange={(e) => handleInputChange('sesionSegura', e.target.checked)}
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderAparienciaTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personalización</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color primario
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                value={formData.colorPrimario}
                onChange={(e) => handleInputChange('colorPrimario', e.target.value)}
              />
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.colorPrimario}
                onChange={(e) => handleInputChange('colorPrimario', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color secundario
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                value={formData.colorSecundario}
                onChange={(e) => handleInputChange('colorSecundario', e.target.value)}
              />
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.colorSecundario}
                onChange={(e) => handleInputChange('colorSecundario', e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tema
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.tema}
              onChange={(e) => handleInputChange('tema', e.target.value)}
            >
              <option value="claro">Claro</option>
              <option value="oscuro">Oscuro</option>
              <option value="auto">Automático</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneralTab()
      case 'ubicacion': return renderUbicacionTab()
      case 'horarios': return renderHorariosTab()
      case 'pagos': return renderPagosTab()
      case 'envios': return renderEnviosTab()
      case 'notificaciones': return renderNotificacionesTab()
      case 'seguridad': return renderSeguridadTab()
      case 'apariencia': return renderAparienciaTab()
      default: return renderGeneralTab()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600">Personaliza tu tienda y preferencias</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}