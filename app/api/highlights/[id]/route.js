import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// GET a single highlight
export async function GET(req, context) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const highlight = await prisma.highlight.findUnique({
      where: { id: Number(id) },
    });
    if (!highlight || highlight.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Highlight not found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(highlight), { status: 200 });
  } catch (err) {
    console.error('Error fetching highlight:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch highlight' }),
      { status: 500 }
    );
  }
}

// UPDATE a highlight
export async function PUT(req, context) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const existing = await prisma.highlight.findUnique({
      where: { id: Number(id) },
    });
    if (!existing || existing.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Highlight not found' }), {
        status: 404,
      });
    }

    const body = await req.json();
    const updated = await prisma.highlight.update({
      where: { id: Number(id) },
      data: {
        text: body.text,
        note: body.note,
      },
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (err) {
    console.error('Error updating highlight:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to update highlight' }),
      { status: 500 }
    );
  }
}

// DELETE a highlight
export async function DELETE(req, context) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const existing = await prisma.highlight.findUnique({
      where: { id: Number(id) },
    });
    if (!existing || existing.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Highlight not found' }), {
        status: 404,
      });
    }

    await prisma.highlight.delete({ where: { id: Number(id) } });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Error deleting highlight:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to delete highlight' }),
      { status: 500 }
    );
  }
}
