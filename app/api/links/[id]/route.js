// app/api/links/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();
  const { url, linkTitle, linkDescription } = body;

  const updated = await prisma.link.update({
    where: { id: parseInt(id), userId: session.user.id },
    data: { url, linkTitle, linkDescription },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  await prisma.link.delete({
    where: { id: parseInt(id), userId: session.user.id },
  });

  return NextResponse.json({ message: 'Link deleted' });
}
