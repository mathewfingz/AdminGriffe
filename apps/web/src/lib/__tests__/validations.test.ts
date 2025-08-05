import { describe, it, expect } from 'vitest'
import { loginSchema, registerSchema } from '../validations'

describe('Validation schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      }
      
      const result = loginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      }
      
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
        password: 'password123'
      }
      
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: ''
      }
      
      const result = loginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('registerSchema', () => {
    it('should validate correct register data', () => {
      const validData = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      }
      
      const result = registerSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject mismatched passwords', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different123'
      }
      
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject short password', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'test@example.com',
        password: '123',
        confirmPassword: '123'
      }
      
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      }
      
      const result = registerSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})