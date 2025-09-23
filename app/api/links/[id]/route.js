// app/api/links/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// PUT update link
export async function PUT(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();
  const {
    url,
    linkTitle,
    linkDescription,
    tags,
    categoryIds,
    faviconUrl,
    imageUrl,
  } = body;

  try {
    const link = await prisma.link.update({
      where: { id: parseInt(id) },
      data: {
        url,
        linkTitle,
        linkDescription,
        tags: Array.isArray(tags) ? tags : [],
        faviconUrl,
        imageUrl,
        categories: {
          deleteMany: {}, // remove old associations
          create: categoryIds?.map((cid) => ({
            category: { connect: { id: cid } },
          })),
        },
      },
      include: { categories: { include: { category: true } } },
    });
    return NextResponse.json(link);
  } catch (err) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 });
  }
}

// DELETE link
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    await prisma.link.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 });
  }
}
