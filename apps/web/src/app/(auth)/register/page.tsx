'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button, Input, Label, PasswordInput, GoogleIcon } from '@admin-griffe/ui';

const registerSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al crear la cuenta');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Error al crear la cuenta');
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
                ¡Cuenta creada!
              </h1>
              <p className="mt-2 text-design-foreground-low">
                Tu cuenta ha sido creada exitosamente. Serás redirigido al login...
              </p>
            </div>
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
          <h1 className="text-4xl font-bold mb-6">Únete a nosotros</h1>
          <p className="text-xl opacity-90">
            Crea tu cuenta y comienza a administrar
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
                Crear Cuenta
              </h1>
              <p className="mt-2 text-design-foreground-low">
                Completa los datos para registrarte
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
              {/* Name Field */}
              <div className="space-y-3">
                <Label htmlFor="name" required>
                  Nombre completo
                </Label>
                <Input
                  id="name"
                  type="text"
                  variant="default"
                  placeholder="Ingresa tu nombre completo"
                  error={!!errors.name}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name.message}</p>
                )}
              </div>

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

              {/* Password Field */}
              <div className="space-y-3">
                <Label htmlFor="password" required>
                  Contraseña
                </Label>
                <PasswordInput
                  id="password"
                  variant="outline"
                  placeholder="Ingresa tu contraseña"
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
                  placeholder="Confirma tu contraseña"
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
                Crear cuenta
              </Button>

              {/* Google Button */}
              <Button
                type="button"
                variant="google"
                className="w-full gap-2"
                disabled={isLoading}
              >
                <GoogleIcon size={20} />
                Continuar con Google
              </Button>

              {/* Login Link */}
              <div className="flex items-center justify-center gap-2 text-center">
                <span className="font-poppins font-normal text-base text-design-foreground-low">
                  ¿Ya tienes cuenta?
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