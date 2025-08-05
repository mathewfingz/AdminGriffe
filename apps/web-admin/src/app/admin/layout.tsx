import { Metadata } from 'next'
import { StoreProvider } from '@/contexts/store-context'
import { Sidebar } from '@/components/admin/sidebar'
import { Topbar } from '@/components/admin/topbar'
import { CommandPalette } from '@/components/admin/command-palette'

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
    <StoreProvider>
      <div className="min-h-screen bg-white">
        <div className="flex h-screen">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Topbar />
            <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
              {children}
            </main>
          </div>
        </div>
        
        {/* Command Palette */}
        <CommandPalette />
      </div>
    </StoreProvider>
  )
}