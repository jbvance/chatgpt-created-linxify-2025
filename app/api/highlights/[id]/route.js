import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

// GET /api/highlights?linkId=123
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get('linkId');

    if (!linkId) {
      return NextResponse.json({ error: 'Missing linkId' }, { status: 400 });
    }

    const highlights = await prisma.highlight.findMany({
      where: {
        linkId: Number(linkId),
        userId: session.user.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(highlights);
  } catch (err) {
    console.error('GET /api/highlights error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/highlights
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { linkId, text, note } = await req.json();

    if (!linkId || !text) {
      return NextResponse.json(
        { error: 'linkId and text are required' },
        { status: 400 }
      );
    }

    const highlight = await prisma.highlight.create({
      data: {
        text,
        note,
        link: { connect: { id: Number(linkId) } },
        user: { connect: { id: session.user.id } },
      },
    });

    return NextResponse.json(highlight);
  } catch (err) {
    console.error('POST /api/highlights error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/highlights/:id
export async function DELETE(req, context) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // Verify ownership before delete
    const highlight = await prisma.highlight.findUnique({
      where: { id: Number(id) },
    });

    if (!highlight || highlight.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.highlight.delete({ where: { id: Number(id) } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/highlights error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
/********PUT (UPDATE) */
export async function PUT(req, context) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { note } = await req.json();

    const highlight = await prisma.highlight.findUnique({
      where: { id: Number(id) },
    });

    if (!highlight || highlight.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.highlight.update({
      where: { id: Number(id) },
      data: { note },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/highlights error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
