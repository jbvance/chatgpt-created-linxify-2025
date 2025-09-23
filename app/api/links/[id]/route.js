import prisma from '@/lib/prisma';
import { fetchAndArchiveContent } from '@/lib/archive';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// GET a single link by ID
export async function GET(req, context) {
  const { id } = await context.params;
  try {
    const link = await prisma.link.findUnique({
      where: { id: Number(id) },
      include: { categories: { include: { category: true } } },
    });

    if (!link) {
      return new Response(JSON.stringify({ error: 'Link not found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(link), { status: 200 });
  } catch (err) {
    console.error('Error fetching link:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch link' }), {
      status: 500,
    });
  }
}

// UPDATE an existing link
export async function PUT(req, context) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const body = await req.json();

    // Make sure the link belongs to the logged-in user
    const existing = await prisma.link.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Link not found' }), {
        status: 404,
      });
    }

    if (existing.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
      });
    }

    const updated = await prisma.link.update({
      where: { id: Number(id) },
      data: {
        url: body.url,
        linkTitle: body.linkTitle,
        linkDescription: body.linkDescription,
        faviconUrl: body.faviconUrl,
        imageUrl: body.imageUrl,
        tags: body.tags,
        categories: {
          deleteMany: {}, // clear existing categories
          create: (body.categoryIds || []).map((cid) => ({ categoryId: cid })),
        },
      },
    });

    // 🔹 If URL changed → re-archive
    if (body.url && body.url !== existing.url) {
      fetchAndArchiveContent(body.url).then(async (content) => {
        if (content) {
          await prisma.link.update({
            where: { id: updated.id },
            data: { archivedContent: content },
          });
        }
      });
    }

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (err) {
    console.error('Error updating link:', err);
    return new Response(JSON.stringify({ error: 'Failed to update link' }), {
      status: 500,
    });
  }
}

// DELETE a link
export async function DELETE(req, context) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const existing = await prisma.link.findUnique({
      where: { id: Number(id) },
    });

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Link not found' }), {
        status: 404,
      });
    }

    if (existing.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
      });
    }

    await prisma.link.delete({
      where: { id: Number(id) },
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Error deleting link:', err);
    return new Response(JSON.stringify({ error: 'Failed to delete link' }), {
      status: 500,
    });
  }
}
