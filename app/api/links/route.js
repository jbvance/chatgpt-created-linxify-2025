// app/api/links/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET all links for current user (with pagination)
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '9');
  const skip = (page - 1) * pageSize;

  const [links, total] = await Promise.all([
    prisma.link.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.link.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ links, total, page, pageSize });
}

// POST create a new link
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { url, linkTitle, linkDescription, tags } = body;

  if (!url || !linkTitle) {
    return NextResponse.json(
      { error: 'URL and title required' },
      { status: 400 }
    );
  }

  const link = await prisma.link.create({
    data: {
      url,
      linkTitle,
      linkDescription,
      tags: Array.isArray(tags) ? tags : [],
      userId: session.user.id,
    },
  });

  return NextResponse.json(link);
}
