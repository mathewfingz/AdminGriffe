'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button, Label, PasswordInput } from '@admin-griffe/ui';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Token de restablecimiento inválido');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Token de restablecimiento inválido');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al restablecer la contraseña');
      }
    } catch (err) {
      setError('Error al restablecer la contraseña');
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
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h1 className="font-poppins font-bold text-[28px] text-design-foreground-high">
                ¡Contraseña actualizada!
              </h1>
              <p className="mt-2 text-design-foreground-low">
                Tu contraseña ha sido restablecida exitosamente. Serás redirigido al login...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token || error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-[20px] shadow-[40px_40px_60px_0_rgba(228,230,234,0.74)] p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
              <h1 className="font-poppins font-bold text-[28px] text-design-foreground-high">
                Token inválido
              </h1>
              <p className="mt-2 text-design-foreground-low">
                El enlace de restablecimiento es inválido o ha expirado.
              </p>
            </div>
            <Link href="/forgot-password">
              <Button variant="primary" className="w-full">
                Solicitar nuevo enlace
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
          <h1 className="text-4xl font-bold mb-6">Nueva contraseña</h1>
          <p className="text-xl opacity-90">
            Crea una contraseña segura para tu cuenta
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
                Restablecer Contraseña
              </h1>
              <p className="mt-2 text-design-foreground-low">
                Ingresa tu nueva contraseña
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
              {/* Password Field */}
              <div className="space-y-3">
                <Label htmlFor="password" required>
                  Nueva contraseña
                </Label>
                <PasswordInput
                  id="password"
                  variant="outline"
                  placeholder="Ingresa tu nueva contraseña"
                  error={!!errors.password}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" required>
                  Confirmar contraseña
                </Label>
                <PasswordInput
                  id="confirmPassword"
                  variant="outline"
                  placeholder="Confirma tu nueva contraseña"
                  error={!!errors.confirmPassword}
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
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
                Restablecer contraseña
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