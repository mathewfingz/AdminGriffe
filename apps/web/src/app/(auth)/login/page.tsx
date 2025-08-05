'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { Button, Input, Label, PasswordInput, GoogleIcon } from '@admin-griffe/ui';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Credenciales inválidas');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch (err) {
      setError('Error al iniciar sesión con Google');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Desktop Left Panel - Hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 to-blue-800 items-center justify-center p-12">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-6">Bienvenido de vuelta</h1>
          <p className="text-xl opacity-90">
            Accede a tu panel de administración
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
                Iniciar Sesión
              </h1>
              <p className="mt-2 text-design-foreground-low">
                Accede a tu cuenta
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
                  error={!!errors.email}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" required>
                    Contraseña
                  </Label>
                  <Link 
                    href="/forgot-password" 
                    className="font-poppins font-normal text-base text-design-primary hover:underline"
                  >
                    ¿Olvidaste?
                  </Link>
                </div>
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

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                Iniciar Sesión
              </Button>

              {/* Google Button */}
              <Button
                type="button"
                variant="google"
                className="w-full gap-2"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <GoogleIcon size={20} />
                Continuar con Google
              </Button>

              {/* Register Link */}
              <div className="flex items-center justify-center gap-2 text-center">
                <span className="font-poppins font-normal text-base text-design-foreground-low">
                  ¿No tienes cuenta?
                </span>
                <Link 
                  href="/register" 
                  className="font-poppins font-normal text-base text-design-primary hover:underline"
                >
                  Crear cuenta
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}