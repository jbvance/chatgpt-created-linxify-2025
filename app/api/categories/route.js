// app/api/categories/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET all categories for current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(categories);
}

// POST create a new category
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { categoryDescription } = body;

  if (!categoryDescription || categoryDescription.trim() === '') {
    return NextResponse.json(
      { error: 'Category name required' },
      { status: 400 }
    );
  }

  const category = await prisma.category.create({
    data: {
      categoryDescription,
      userId: session.user.id,
    },
  });

  return NextResponse.json(category);
}
