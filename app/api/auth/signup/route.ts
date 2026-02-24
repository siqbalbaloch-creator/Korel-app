import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  let email = "";
  let password = "";

  try {
    const body = (await request.json()) as { email?: string; password?: string };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "exists" }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  return NextResponse.json({ status: "ok" }, { status: 201 });
}
