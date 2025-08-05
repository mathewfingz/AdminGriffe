import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Button } from '@admin-griffe/ui'
import { 
  ArrowLeft, 
  Edit, 
  MoreHorizontal, 
  Store, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Activity,
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Users,
  Star,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

// Mock data - in real app this would come from API/database
const getTiendaById = (id: string) => {
  const tiendas = [
    {
      id: '1',
      nombre: 'Boutique Elegance',
      email: 'contacto@elegance.com',
      telefono: '+57 300 123 4567',
      direccion: 'Calle 85 #15-20',
      ciudad: 'Bogotá',
      estado: 'activa' as const,
      fechaRegistro: '2024-01-15',
      ultimaActividad: '2024-12-20',
      productos: 245,
      pedidos: 1250,
      ventas: 45000000,
      comision: 2250000,
      descripcion: 'Boutique especializada en moda femenina elegante y sofisticada. Ofrecemos las últimas tendencias en vestidos, blusas, pantalones y accesorios para la mujer moderna.',
      sitioWeb: 'https://elegance.com',
      redesSociales: {
        instagram: '@elegance_boutique',
        facebook: 'Elegance Boutique',
        whatsapp: '+57 300 123 4567'
      },
      horarios: {
        lunes: '9:00 AM - 7:00 PM',
        martes: '9:00 AM - 7:00 PM',
        miercoles: '9:00 AM - 7:00 PM',
        jueves: '9:00 AM - 7:00 PM',
        viernes: '9:00 AM - 8:00 PM',
        sabado: '10:00 AM - 8:00 PM',
        domingo: '11:00 AM - 6:00 PM'
      },
      metricas: {
        calificacionPromedio: 4.8,
        totalReseñas: 342,
        tasaConversion: 3.2,
        tiempoRespuesta: '2 horas',
        productosDestacados: 15,
        clientesRecurrentes: 89
      }
    }
  ]
  
  return tiendas.find(t => t.id === id)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tienda = getTiendaById(params.id)
  
  if (!tienda) {
    return {
      title: 'Tienda no encontrada | AdminGriffe'
    }
  }

  return {
    title: `${tienda.nombre} | AdminGriffe`,
    description: `Información detallada de ${tienda.nombre}`
  }
}

export default function TiendaDetailPage({ params }: Props) {
  const tienda = getTiendaById(params.id)

  if (!tienda) {
    notFound()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const estadoConfig = {
    activa: {
      label: 'Activa',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    pendiente: {
      label: 'Pendiente',
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    suspendida: {
      label: 'Suspendida',
      icon: AlertTriangle,
      className: 'bg-red-100 text-red-800 border-red-200'
    },
    inactiva: {
      label: 'Inactiva',
      icon: AlertTriangle,
      className: 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const EstadoIcon = estadoConfig[tienda.estado].icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/tiendas">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{tienda.nombre}</h1>
            <p className="text-muted-foreground">
              Información detallada y gestión de la tienda
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/tiendas/${tienda.id}/editar`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
          <Button variant="outline">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status and Basic Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Información Básica</h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${estadoConfig[tienda.estado].className}`}>
                <EstadoIcon className="w-4 h-4 mr-2" />
                {estadoConfig[tienda.estado].label}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Store className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nombre de la tienda</p>
                    <p className="text-gray-900">{tienda.nombre}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="text-gray-900">{tienda.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Teléfono</p>
                    <p className="text-gray-900">{tienda.telefono}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Dirección</p>
                    <p className="text-gray-900">{tienda.direccion}</p>
                    <p className="text-gray-500 text-sm">{tienda.ciudad}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fecha de registro</p>
                    <p className="text-gray-900">{formatDate(tienda.fechaRegistro)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Última actividad</p>
                    <p className="text-gray-900">{formatDate(tienda.ultimaActividad)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Descripción</h2>
            <p className="text-gray-700 leading-relaxed">{tienda.descripcion}</p>
          </div>

          {/* Contact and Social Media */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Contacto y Redes Sociales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Sitio Web</h3>
                <a 
                  href={tienda.sitioWeb} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {tienda.sitioWeb}
                </a>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Redes Sociales</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Instagram:</span> {tienda.redesSociales.instagram}</p>
                  <p><span className="font-medium">Facebook:</span> {tienda.redesSociales.facebook}</p>
                  <p><span className="font-medium">WhatsApp:</span> {tienda.redesSociales.whatsapp}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar with metrics */}
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Métricas Clave</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Productos</span>
                </div>
                <span className="font-semibold">{tienda.productos.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Pedidos</span>
                </div>
                <span className="font-semibold">{tienda.pedidos.toLocaleString()}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Ventas</span>
                </div>
                <span className="font-semibold">{formatCurrency(tienda.ventas)}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-gray-600">Comisión</span>
                </div>
                <span className="font-semibold text-green-600">{formatCurrency(tienda.comision)}</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Rendimiento</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">Calificación</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold">{tienda.metricas.calificacionPromedio}</span>
                  <p className="text-xs text-gray-500">{tienda.metricas.totalReseñas} reseñas</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">Conversión</span>
                </div>
                <span className="font-semibold">{tienda.metricas.tasaConversion}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">Respuesta</span>
                </div>
                <span className="font-semibold">{tienda.metricas.tiempoRespuesta}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">Clientes recurrentes</span>
                </div>
                <span className="font-semibold">{tienda.metricas.clientesRecurrentes}%</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Acciones Rápidas</h2>
            <div className="space-y-3">
              <Link href={`/admin/tiendas/${tienda.id}/productos`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="mr-2 h-4 w-4" />
                  Ver Productos
                </Button>
              </Link>
              
              <Link href={`/admin/tiendas/${tienda.id}/pedidos`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Ver Pedidos
                </Button>
              </Link>
              
              <Link href={`/admin/tiendas/${tienda.id}/finanzas`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Ver Finanzas
                </Button>
              </Link>
              
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Enviar Mensaje
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Business Hours */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Horarios de Atención</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(tienda.horarios).map(([dia, horario]) => (
            <div key={dia} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-medium capitalize">{dia}</span>
              <span className="text-sm text-gray-600">{horario}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}