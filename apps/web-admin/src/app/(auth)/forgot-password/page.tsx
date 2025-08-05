'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button, Input, Label } from '@admin-griffe/ui';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al enviar el email');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError('Error al enviar el email');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-[20px] shadow-[40px_40px_60px_0_rgba(228,230,234,0.74)] p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
              </div>
              <h1 className="font-poppins font-bold text-[28px] text-design-foreground-high">
                Email enviado
              </h1>
              <p className="mt-2 text-design-foreground-low">
                Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
              </p>
            </div>
            <Link href="/login">
              <Button variant="primary" className="w-full">
                Volver al login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Desktop Left Panel - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 to-blue-800 items-center justify-center p-12">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-6">¿Olvidaste tu contraseña?</h1>
          <p className="text-xl opacity-90">
            No te preocupes, te ayudamos a recuperarla
          </p>
        </div>
      </div>

      {/* Right Panel - Full width on mobile */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12 bg-gray-50 lg:bg-white">
        <div className="w-full max-w-md">
          {/* Mobile/Desktop Form Container */}
          <div className="bg-white rounded-[20px] shadow-[40px_40px_60px_0_rgba(228,230,234,0.74)] lg:shadow-none p-8 lg:p-0">
            {/* Logo/Title */}
            <div className="mb-8 text-center lg:text-left">
              <h1 className="font-poppins font-bold text-[28px] leading-[28px] text-design-foreground-high">
                Recuperar Contraseña
              </h1>
              <p className="mt-2 text-design-foreground-low">
                Ingresa tu email para recibir instrucciones
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-3">
                <Label htmlFor="email" required>
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  variant="default"
                  placeholder="Ingresa tu email"
                  error={!!errors.email}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                Enviar instrucciones
              </Button>

              {/* Back to Login Link */}
              <div className="flex items-center justify-center gap-2 text-center">
                <span className="font-poppins font-normal text-base text-design-foreground-low">
                  ¿Recordaste tu contraseña?
                </span>
                <Link 
                  href="/login" 
                  className="font-poppins font-normal text-base text-design-primary hover:underline"
                >
                  Iniciar sesión
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}