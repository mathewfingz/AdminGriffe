import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AdminPage from '../page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: {
        id: '1',
        email: 'admin@test.com',
        role: 'ADMIN',
      },
    },
    status: 'authenticated',
  }),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
    tr: ({ children, ...props }: React.ComponentProps<'tr'>) => <tr {...props}>{children}</tr>,
  },
}))

// Mock recharts to avoid canvas issues in tests
vi.mock('recharts', () => ({
  AreaChart: ({ children }: { children?: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
}))

describe('AdminPage', () => {
  it('renders dashboard title and description', () => {
    render(<AdminPage />)

    expect(screen.getByText('Dashboard Global')).toBeInTheDocument()
    expect(screen.getByText('Vista general del rendimiento de todas las tiendas')).toBeInTheDocument()
  })

  it('renders all KPI cards', () => {
    render(<AdminPage />)

    expect(screen.getByText('Ventas Totales')).toBeInTheDocument()
    expect(screen.getByText('Tiendas Activas')).toBeInTheDocument()
    expect(screen.getByText('Pedidos Globales')).toBeInTheDocument()
    expect(screen.getByText('Clientes')).toBeInTheDocument()
    expect(screen.getByText('Comisión Total')).toBeInTheDocument()
  })

  it('renders KPI values', () => {
    render(<AdminPage />)

    expect(screen.getByText('$12.4M')).toBeInTheDocument()
    expect(screen.getByText('247')).toBeInTheDocument()
    expect(screen.getByText('18,429')).toBeInTheDocument()
    expect(screen.getByText('94,832')).toBeInTheDocument()
    expect(screen.getByText('$890K')).toBeInTheDocument()
  })

  it('renders chart component', () => {
    render(<AdminPage />)

    expect(screen.getByText('Ventas y Pedidos - Últimos 30 días')).toBeInTheDocument()
    expect(screen.getByTestId('area-chart')).toBeInTheDocument()
  })

  it('renders top stores table', () => {
    render(<AdminPage />)

    expect(screen.getAllByText('Top 5 Tiendas por Ventas')[0]).toBeInTheDocument()
  })

  it('renders alerts widget', () => {
    render(<AdminPage />)

    expect(screen.getAllByText('Alertas del Sistema')[0]).toBeInTheDocument()
  })
})