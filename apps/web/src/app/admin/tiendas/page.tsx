import { Metadata } from 'next'
import { TiendasDataTable } from '@/components/admin/tiendas/tiendas-data-table'
import { Button } from '@admin-griffe/ui'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Tiendas | AdminGriffe',
  description: 'Gestión de tiendas registradas en la plataforma'
}

export default function TiendasPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tiendas</h1>
          <p className="text-muted-foreground">
            Gestiona todas las tiendas registradas en la plataforma
          </p>
        </div>
        <Link href="/admin/tiendas/nueva">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Tienda
          </Button>
        </Link>
      </div>

      {/* Data Table */}
      <TiendasDataTable />
    </div>
  )
}