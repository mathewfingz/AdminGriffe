import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { KpiCard } from '../kpi-card'
import { DollarSign } from 'lucide-react'

describe('KpiCard', () => {
  it('renders title and value correctly', () => {
    render(
      <KpiCard
        title="Test Title"
        value="$1,000"
      />
    )

    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('$1,000')).toBeInTheDocument()
  })

  it('displays positive change with green color', () => {
    render(
      <KpiCard
        title="Test Title"
        value="$1,000"
        change={15.3}
        changeLabel="vs last month"
      />
    )

    const changeElement = screen.getByText('+15.3%')
    expect(changeElement).toBeInTheDocument()
    expect(changeElement).toHaveClass('text-green-600')
    expect(screen.getByText('vs last month')).toBeInTheDocument()
  })

  it('displays negative change with red color', () => {
    render(
      <KpiCard
        title="Test Title"
        value="$1,000"
        change={-5.2}
      />
    )

    const changeElement = screen.getByText('-5.2%')
    expect(changeElement).toBeInTheDocument()
    expect(changeElement).toHaveClass('text-red-600')
  })

  it('renders icon when provided', () => {
    render(
      <KpiCard
        title="Test Title"
        value="$1,000"
        icon={<DollarSign data-testid="dollar-icon" />}
      />
    )

    expect(screen.getByTestId('dollar-icon')).toBeInTheDocument()
  })

  it('does not render change section when change is undefined', () => {
    render(
      <KpiCard
        title="Test Title"
        value="$1,000"
      />
    )

    expect(screen.queryByText('%')).not.toBeInTheDocument()
  })
})