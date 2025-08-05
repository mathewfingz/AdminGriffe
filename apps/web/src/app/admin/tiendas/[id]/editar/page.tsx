'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@admin-griffe/ui'
import { ArrowLeft, Save, Upload, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'

interface TiendaForm {
  id: string
  nombre: string
  email: string
  telefono: string
  direccion: string
  ciudad: string
  descripcion: string
  sitioWeb: string
  instagram: string
  facebook: string
  whatsapp: string
  estado: 'activa' | 'inactiva' | 'pendiente' | 'suspendida'
  horarios: {
    [key: string]: { inicio: string; fin: string; cerrado: boolean }
  }
}

const diasSemana = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' }
]

// Mock data - in real app this would come from API
const mockTienda: TiendaForm = {
  id: '1',
  nombre: 'Boutique Elegance',
  email: 'contacto@boutiqueelegance.com',
  telefono: '+57 301 234 5678',
  direccion: 'Calle 85 #15-20',
  ciudad: 'Bogotá',
  descripcion: 'Boutique especializada en moda femenina contemporánea con las últimas tendencias internacionales.',
  sitioWeb: 'https://boutiqueelegance.com',
  instagram: '@boutiqueelegance',
  facebook: 'Boutique Elegance',
  whatsapp: '+57 301 234 5678',
  estado: 'activa',
  horarios: {
    lunes: { inicio: '09:00', fin: '19:00', cerrado: false },
    martes: { inicio: '09:00', fin: '19:00', cerrado: false },
    miercoles: { inicio: '09:00', fin: '19:00', cerrado: false },
    jueves: { inicio: '09:00', fin: '19:00', cerrado: false },
    viernes: { inicio: '09:00', fin: '20:00', cerrado: false },
    sabado: { inicio: '10:00', fin: '20:00', cerrado: false },
    domingo: { inicio: '11:00', fin: '17:00', cerrado: false }
  }
}

export default function EditarTiendaPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<TiendaForm>(mockTienda)

  useEffect(() => {
    // In real app, fetch store data by ID
    const fetchTienda = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500))
        setFormData(mockTienda)
      } catch (error) {
        console.error('Error fetching store:', error)
      }
    }

    fetchTienda()
  }, [params.id])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre de la tienda es requerido'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El email no es válido'
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido'
    }

    if (!formData.direccion.trim()) {
      newErrors.direccion = 'La dirección es requerida'
    }

    if (!formData.ciudad.trim()) {
      newErrors.ciudad = 'La ciudad es requerida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Updating store:', formData)
      
      // Redirect to store detail
      router.push(`/admin/tiendas/${params.id}`)
    } catch (error) {
      console.error('Error updating store:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof TiendaForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleHorarioChange = (dia: string, field: 'inicio' | 'fin' | 'cerrado', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [dia]: {
          ...prev.horarios[dia],
          [field]: value
        }
      }
    }))
  }

  const getEstadoBadge = (estado: string) => {
    const styles = {
      activa: 'bg-green-100 text-green-800',
      inactiva: 'bg-gray-100 text-gray-800',
      pendiente: 'bg-yellow-100 text-yellow-800',
      suspendida: 'bg-red-100 text-red-800'
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[estado as keyof typeof styles]}`}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/tiendas/${params.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Editar Tienda</h1>
              {getEstadoBadge(formData.estado)}
            </div>
            <p className="text-muted-foreground">
              Modifica la información de {formData.nombre}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link href={`/admin/tiendas/${params.id}`}>
            <Button variant="outline" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              Ver Tienda
            </Button>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-6">Información Básica</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la tienda *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.nombre ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Boutique Elegance"
                  />
                  {errors.nombre && (
                    <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="contacto@tienda.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.telefono ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+57 300 123 4567"
                  />
                  {errors.telefono && (
                    <p className="mt-1 text-sm text-red-600">{errors.telefono}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) => handleInputChange('direccion', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.direccion ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Calle 85 #15-20"
                  />
                  {errors.direccion && (
                    <p className="mt-1 text-sm text-red-600">{errors.direccion}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="ciudad" className="block text-sm font-medium text-gray-700 mb-2">
                    Ciudad *
                  </label>
                  <select
                    id="ciudad"
                    value={formData.ciudad}
                    onChange={(e) => handleInputChange('ciudad', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.ciudad ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecciona una ciudad</option>
                    <option value="Bogotá">Bogotá</option>
                    <option value="Medellín">Medellín</option>
                    <option value="Cali">Cali</option>
                    <option value="Barranquilla">Barranquilla</option>
                    <option value="Cartagena">Cartagena</option>
                    <option value="Bucaramanga">Bucaramanga</option>
                    <option value="Pereira">Pereira</option>
                    <option value="Manizales">Manizales</option>
                  </select>
                  {errors.ciudad && (
                    <p className="mt-1 text-sm text-red-600">{errors.ciudad}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    rows={4}
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe la tienda, sus productos y servicios..."
                  />
                </div>
              </div>
            </div>

            {/* Contact and Social Media */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-6">Contacto y Redes Sociales</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label htmlFor="sitioWeb" className="block text-sm font-medium text-gray-700 mb-2">
                    Sitio Web
                  </label>
                  <input
                    type="url"
                    id="sitioWeb"
                    value={formData.sitioWeb}
                    onChange={(e) => handleInputChange('sitioWeb', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://mitienda.com"
                  />
                </div>

                <div>
                  <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-2">
                    Instagram
                  </label>
                  <input
                    type="text"
                    id="instagram"
                    value={formData.instagram}
                    onChange={(e) => handleInputChange('instagram', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="@mitienda"
                  />
                </div>

                <div>
                  <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook
                  </label>
                  <input
                    type="text"
                    id="facebook"
                    value={formData.facebook}
                    onChange={(e) => handleInputChange('facebook', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mi Tienda"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-2">
                    WhatsApp
                  </label>
                  <input
                    type="tel"
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+57 300 123 4567"
                  />
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-6">Horarios de Atención</h2>
              
              <div className="space-y-4">
                {diasSemana.map((dia) => (
                  <div key={dia.key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-20">
                      <span className="font-medium">{dia.label}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`${dia.key}-cerrado`}
                        checked={formData.horarios[dia.key].cerrado}
                        onChange={(e) => handleHorarioChange(dia.key, 'cerrado', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor={`${dia.key}-cerrado`} className="text-sm text-gray-600">
                        Cerrado
                      </label>
                    </div>
                    
                    {!formData.horarios[dia.key].cerrado && (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={formData.horarios[dia.key].inicio}
                          onChange={(e) => handleHorarioChange(dia.key, 'inicio', e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <span className="text-gray-500">a</span>
                        <input
                          type="time"
                          value={formData.horarios[dia.key].fin}
                          onChange={(e) => handleHorarioChange(dia.key, 'fin', e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Management */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Estado de la Tienda</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-2">
                    Estado actual
                  </label>
                  <select
                    id="estado"
                    value={formData.estado}
                    onChange={(e) => handleInputChange('estado', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="activa">Activa</option>
                    <option value="inactiva">Inactiva</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="suspendida">Suspendida</option>
                  </select>
                </div>
                
                {formData.estado === 'suspendida' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      Esta tienda está suspendida. Los clientes no podrán realizar pedidos.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Logo Upload */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Logo de la Tienda</h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <Button variant="outline" size="sm">
                    Cambiar Logo
                  </Button>
                  <p className="mt-2 text-sm text-gray-500">
                    PNG, JPG hasta 2MB
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Acciones</h2>
              
              <div className="space-y-3">
                <Button 
                  type="submit" 
                  loading={loading}
                  className="w-full"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Tienda
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}