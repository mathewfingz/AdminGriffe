import { Metadata } from 'next';
import { StoreProvider } from '@/contexts/store-context';
import { TiendaSidebar } from '@/components/tienda/sidebar'
import { TiendaTopbar } from '@/components/tienda/topbar';

export const metadata: Metadata = {
  title: 'AdminGriffe - Vista Tienda',
  description: 'Panel de administración para tiendas - AdminGriffe',
};

export default function TiendaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreProvider>
      <html lang="es" data-theme="nova-haven">
        <body className="bg-slate-50">
          <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <TiendaSidebar />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Topbar */}
            <TiendaTopbar />
            
            {/* Page Content */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
    </StoreProvider>
  );
}