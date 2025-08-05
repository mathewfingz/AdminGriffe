import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/auth"

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token requerido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // Buscar token válido
    const passwordReset = await prisma.passwordReset.findUnique({
      where: { token },
    })

    if (!passwordReset || passwordReset.used || passwordReset.expires < new Date()) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 400 }
      )
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: passwordReset.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      )
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    // Actualizar contraseña y marcar token como usado
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.passwordReset.update({
        where: { id: passwordReset.id },
        data: { used: true },
      }),
    ])

    return NextResponse.json(
      { message: "Contraseña actualizada exitosamente" },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Datos inválidos", details: error.issues },
        { status: 400 }
      )
    }

    console.error("Error in reset password:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}