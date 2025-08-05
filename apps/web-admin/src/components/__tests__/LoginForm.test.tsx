import { describe, it, expect } from 'vitest'

describe('LoginForm Utils', () => {
  it('should validate email format', () => {
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('invalid-email')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })

  it('should validate password length', () => {
    const isValidPassword = (password: string) => password.length >= 6
    
    expect(isValidPassword('password123')).toBe(true)
    expect(isValidPassword('123')).toBe(false)
    expect(isValidPassword('')).toBe(false)
  })

  it('should format user data', () => {
    const formatUserData = (name: string, email: string) => ({
      name: name.trim(),
      email: email.toLowerCase().trim()
    })
    
    const result = formatUserData('  John Doe  ', '  TEST@EXAMPLE.COM  ')
    expect(result.name).toBe('John Doe')
    expect(result.email).toBe('test@example.com')
  })
})