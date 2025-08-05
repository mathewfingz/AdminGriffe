import { describe, it, expect } from 'vitest'
import bcrypt from 'bcryptjs'

describe('Auth utilities', () => {
  it('should hash password correctly', async () => {
    const password = 'testpassword123'
    const hashedPassword = await bcrypt.hash(password, 12)
    
    expect(hashedPassword).toBeDefined()
    expect(hashedPassword).not.toBe(password)
    expect(hashedPassword.length).toBeGreaterThan(0)
  })

  it('should verify password correctly', async () => {
    const password = 'testpassword123'
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const isValid = await bcrypt.compare(password, hashedPassword)
    expect(isValid).toBe(true)
    
    const isInvalid = await bcrypt.compare('wrongpassword', hashedPassword)
    expect(isInvalid).toBe(false)
  })

  it('should handle empty password', async () => {
    const password = ''
    const hashedPassword = await bcrypt.hash(password, 12)
    
    expect(hashedPassword).toBeDefined()
    expect(hashedPassword.length).toBeGreaterThan(0)
  })
})