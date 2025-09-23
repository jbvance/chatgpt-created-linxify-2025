// app/api/categories/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PUT update a category
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();
  const { categoryDescription } = body;

  const category = await prisma.category.updateMany({
    where: { id: parseInt(id), userId: session.user.id },
    data: { categoryDescription },
  });

  if (category.count === 0) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

// DELETE category
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    await prisma.category.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }
}
