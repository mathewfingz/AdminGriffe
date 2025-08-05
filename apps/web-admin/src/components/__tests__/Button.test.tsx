import { describe, it, expect } from 'vitest'

describe('Button Utils', () => {
  it('should generate button classes', () => {
    const getButtonClasses = (variant: string, size: string) => {
      const baseClasses = 'inline-flex items-center justify-center'
      const variantClasses = variant === 'primary' ? 'bg-blue-500' : 'bg-gray-500'
      const sizeClasses = size === 'sm' ? 'px-2 py-1' : 'px-4 py-2'
      
      return `${baseClasses} ${variantClasses} ${sizeClasses}`
    }
    
    expect(getButtonClasses('primary', 'sm')).toContain('bg-blue-500')
    expect(getButtonClasses('secondary', 'lg')).toContain('bg-gray-500')
    expect(getButtonClasses('primary', 'sm')).toContain('px-2 py-1')
  })

  it('should handle button states', () => {
    const getButtonState = (disabled: boolean, loading: boolean) => {
      if (disabled) return 'disabled'
      if (loading) return 'loading'
      return 'normal'
    }
    
    expect(getButtonState(true, false)).toBe('disabled')
    expect(getButtonState(false, true)).toBe('loading')
    expect(getButtonState(false, false)).toBe('normal')
  })

  it('should format button text', () => {
    const formatButtonText = (text: string, loading: boolean) => {
      return loading ? 'Cargando...' : text
    }
    
    expect(formatButtonText('Enviar', false)).toBe('Enviar')
    expect(formatButtonText('Enviar', true)).toBe('Cargando...')
  })
})