'use client'

import { Button } from '@admin-griffe/ui'
import { 
  Settings, 
  Save, 
  Globe, 
  Mail, 
  Shield, 
  CreditCard, 
  Bell, 
  Database,
  Key,
  Users,
  Palette,
  Code,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  Eye,
  EyeOff,
  Plus
} from 'lucide-react'
import { useState } from 'react'

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [showApiKey, setShowApiKey] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    marketing: false
  })

  const tabs = [
    { id: 'general', name: 'General', icon: <Settings className="h-4 w-4" /> },
    { id: 'email', name: 'Email', icon: <Mail className="h-4 w-4" /> },
    { id: 'pagos', name: 'Pagos', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'seguridad', name: 'Seguridad', icon: <Shield className="h-4 w-4" /> },
    { id: 'notificaciones', name: 'Notificaciones', icon: <Bell className="h-4 w-4" /> },
    { id: 'api', name: 'API', icon: <Code className="h-4 w-4" /> },
    { id: 'respaldos', name: 'Respaldos', icon: <Database className="h-4 w-4" /> }
  ]

  const handleSave = () => {
    // Simulate API call
    console.log('Configuración guardada')
  }

  const handleBackup = () => {
    // Simulate backup creation
    console.log('Creando respaldo...')
  }

  const handleRestore = () => {
    // Simulate restore
    console.log('Restaurando respaldo...')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600">Gestiona la configuración del sistema y la plataforma</p>
        </div>
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Guardar Cambios
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg border">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración General</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de la Plataforma
                      </label>
                      <input
                        type="text"
                        defaultValue="AdminGriffe"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL Base
                      </label>
                      <input
                        type="url"
                        defaultValue="https://admin.griffe.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zona Horaria
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="America/Bogota">América/Bogotá (UTC-5)</option>
                        <option value="America/Mexico_City">América/Ciudad_de_México (UTC-6)</option>
                        <option value="America/New_York">América/Nueva_York (UTC-5)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Idioma Predeterminado
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="es">Español</option>
                        <option value="en">English</option>
                        <option value="pt">Português</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción de la Plataforma
                    </label>
                    <textarea
                      rows={3}
                      defaultValue="Plataforma de gestión administrativa para tiendas online"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Configuración de Registro</h4>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Permitir registro público de tiendas</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Requerir verificación de email</span>
                      </label>
                      <label className="flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="ml-2 text-sm text-gray-700">Aprobación manual de tiendas</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Email</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Servidor SMTP
                      </label>
                      <input
                        type="text"
                        defaultValue="smtp.gmail.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Puerto
                      </label>
                      <input
                        type="number"
                        defaultValue="587"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Usuario
                      </label>
                      <input
                        type="email"
                        defaultValue="noreply@griffe.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contraseña
                      </label>
                      <input
                        type="password"
                        defaultValue="••••••••"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Plantillas de Email</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Bienvenida</div>
                          <div className="text-sm text-gray-600">Email de bienvenida para nuevos usuarios</div>
                        </div>
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Recuperación de Contraseña</div>
                          <div className="text-sm text-gray-600">Email para restablecer contraseña</div>
                        </div>
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Notificación de Pedido</div>
                          <div className="text-sm text-gray-600">Email de confirmación de pedidos</div>
                        </div>
                        <Button variant="outline" size="sm">Editar</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Settings */}
            {activeTab === 'pagos' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Pagos</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Métodos de Pago</h4>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-3 font-medium text-gray-900">Tarjetas de Crédito/Débito</span>
                          </div>
                          <Button variant="outline" size="sm">Configurar</Button>
                        </label>
                        <label className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-3 font-medium text-gray-900">PayPal</span>
                          </div>
                          <Button variant="outline" size="sm">Configurar</Button>
                        </label>
                        <label className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <span className="ml-3 font-medium text-gray-900">Transferencia Bancaria</span>
                          </div>
                          <Button variant="outline" size="sm">Configurar</Button>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Comisiones</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Comisión por Transacción (%)
                          </label>
                          <input
                            type="number"
                            defaultValue="3.5"
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Comisión Fija ($)
                          </label>
                          <input
                            type="number"
                            defaultValue="0.30"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Configuración de Pagos</h4>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="ml-2 text-sm text-gray-700">Procesar pagos automáticamente</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="ml-2 text-sm text-gray-700">Requerir verificación manual para montos altos</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="ml-2 text-sm text-gray-700">Enviar notificaciones de pago</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'seguridad' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Seguridad</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Autenticación</h4>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="ml-2 text-sm text-gray-700">Requerir autenticación de dos factores (2FA)</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="ml-2 text-sm text-gray-700">Bloquear cuenta después de 5 intentos fallidos</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="ml-2 text-sm text-gray-700">Forzar cambio de contraseña cada 90 días</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Políticas de Contraseña</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Longitud Mínima
                          </label>
                          <input
                            type="number"
                            defaultValue="8"
                            min="6"
                            max="20"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tiempo de Sesión (minutos)
                          </label>
                          <input
                            type="number"
                            defaultValue="60"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="ml-2 text-sm text-gray-700">Requerir mayúsculas</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="ml-2 text-sm text-gray-700">Requerir números</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <span className="ml-2 text-sm text-gray-700">Requerir caracteres especiales</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Logs de Seguridad</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-gray-700">Últimos eventos de seguridad</span>
                          <Button variant="outline" size="sm">Ver Todos</Button>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-500" />
                            <span>Login exitoso - admin@griffe.com - 2024-01-20 14:30</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <X className="h-4 w-4 text-red-500" />
                            <span>Intento de login fallido - unknown@email.com - 2024-01-20 12:15</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                            <span>Cambio de contraseña - user@store.com - 2024-01-20 10:45</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notificaciones' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Notificaciones</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Canales de Notificación</h4>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={notifications.email}
                              onChange={(e) => setNotifications({...notifications, email: e.target.checked})}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                            />
                            <span className="ml-3 font-medium text-gray-900">Email</span>
                          </div>
                          <span className="text-sm text-gray-500">Notificaciones por correo electrónico</span>
                        </label>
                        <label className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={notifications.push}
                              onChange={(e) => setNotifications({...notifications, push: e.target.checked})}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                            />
                            <span className="ml-3 font-medium text-gray-900">Push</span>
                          </div>
                          <span className="text-sm text-gray-500">Notificaciones push del navegador</span>
                        </label>
                        <label className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              checked={notifications.sms}
                              onChange={(e) => setNotifications({...notifications, sms: e.target.checked})}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                            />
                            <span className="ml-3 font-medium text-gray-900">SMS</span>
                          </div>
                          <span className="text-sm text-gray-500">Mensajes de texto</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Tipos de Notificación</h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-4 p-3 border rounded-lg">
                          <div className="font-medium text-gray-900">Nuevos Pedidos</div>
                          <label className="flex items-center justify-center">
                            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          </label>
                          <label className="flex items-center justify-center">
                            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          </label>
                          <label className="flex items-center justify-center">
                            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          </label>
                        </div>
                        <div className="grid grid-cols-4 gap-4 p-3 border rounded-lg">
                          <div className="font-medium text-gray-900">Nuevas Tiendas</div>
                          <label className="flex items-center justify-center">
                            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          </label>
                          <label className="flex items-center justify-center">
                            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          </label>
                          <label className="flex items-center justify-center">
                            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          </label>
                        </div>
                        <div className="grid grid-cols-4 gap-4 p-3 border rounded-lg">
                          <div className="font-medium text-gray-900">Problemas Técnicos</div>
                          <label className="flex items-center justify-center">
                            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          </label>
                          <label className="flex items-center justify-center">
                            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          </label>
                          <label className="flex items-center justify-center">
                            <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          </label>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm text-gray-600 px-3">
                          <div></div>
                          <div className="text-center">Email</div>
                          <div className="text-center">Push</div>
                          <div className="text-center">SMS</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* API Settings */}
            {activeTab === 'api' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de API</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Claves de API</h4>
                      <div className="space-y-3">
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">Clave Principal</span>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                              <Button variant="outline" size="sm">Regenerar</Button>
                            </div>
                          </div>
                          <div className="font-mono text-sm bg-gray-50 p-2 rounded">
                            {showApiKey ? 'sk_live_1234567890abcdef1234567890abcdef' : '••••••••••••••••••••••••••••••••'}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">Última utilización: 2024-01-20 14:30</div>
                        </div>
                        
                        <div className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">Clave de Pruebas</span>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">Regenerar</Button>
                            </div>
                          </div>
                          <div className="font-mono text-sm bg-gray-50 p-2 rounded">
                            sk_test_1234567890abcdef1234567890abcdef
                          </div>
                          <div className="text-sm text-gray-600 mt-1">Para desarrollo y pruebas</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Límites de API</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Requests por Minuto
                          </label>
                          <input
                            type="number"
                            defaultValue="1000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Requests por Día
                          </label>
                          <input
                            type="number"
                            defaultValue="100000"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Webhooks</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">Nuevos Pedidos</div>
                            <div className="text-sm text-gray-600">https://api.store.com/webhooks/orders</div>
                          </div>
                          <div className="flex gap-2">
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Activo</span>
                            <Button variant="outline" size="sm">Editar</Button>
                          </div>
                        </div>
                        <Button variant="outline" className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Webhook
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Backup Settings */}
            {activeTab === 'respaldos' && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Respaldos del Sistema</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Configuración Automática</h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Frecuencia
                            </label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                              <option value="daily">Diario</option>
                              <option value="weekly">Semanal</option>
                              <option value="monthly">Mensual</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Hora
                            </label>
                            <input
                              type="time"
                              defaultValue="02:00"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Retener Respaldos (días)
                          </label>
                          <input
                            type="number"
                            defaultValue="30"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Respaldos Manuales</h4>
                      <div className="flex gap-4">
                        <Button onClick={handleBackup} className="flex items-center gap-2">
                          <Download className="h-4 w-4" />
                          Crear Respaldo
                        </Button>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Restaurar Respaldo
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Historial de Respaldos</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">backup_2024-01-20_02-00.sql</div>
                            <div className="text-sm text-gray-600">20 Enero 2024, 02:00 - 245 MB</div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleRestore}>
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">backup_2024-01-19_02-00.sql</div>
                            <div className="text-sm text-gray-600">19 Enero 2024, 02:00 - 243 MB</div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">backup_2024-01-18_02-00.sql</div>
                            <div className="text-sm text-gray-600">18 Enero 2024, 02:00 - 241 MB</div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}