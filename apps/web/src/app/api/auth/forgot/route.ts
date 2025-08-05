import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import crypto from "crypto"
import { prisma } from "@/lib/auth"

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return NextResponse.json(
        { message: "Si el email existe, recibirás un enlace de recuperación." },
        { status: 200 }
      )
    }

    // Generar token único
    const token = crypto.randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 3600000) // 1 hora

    // Invalidar tokens anteriores para este email
    await prisma.passwordReset.updateMany({
      where: { email, used: false },
      data: { used: true },
    })

    // Crear nuevo token
    await prisma.passwordReset.create({
      data: {
        email,
        token,
        expires,
      },
    })

    // TODO: Enviar email con el token
    // Por ahora, solo lo logueamos
    console.log(`Password reset token for ${email}: ${token}`)
    console.log(`Reset URL: ${process.env.NEXTAUTH_URL}/reset-password?token=${token}`)

    return NextResponse.json(
      { message: "Si el email existe, recibirás un enlace de recuperación." },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error in forgot password:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}