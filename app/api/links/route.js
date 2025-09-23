import prisma from '@/lib/prisma';
import { fetchAndArchiveContent } from '@/lib/archive';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// GET all links (with pagination) for the logged-in user
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const pageSize = parseInt(searchParams.get('pageSize')) || 10;

    const [links, total] = await Promise.all([
      prisma.link.findMany({
        where: { userId }, // ✅ only this user's links
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { categories: { include: { category: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.link.count({ where: { userId } }),
    ]);

    return new Response(JSON.stringify({ links, total }), { status: 200 });
  } catch (err) {
    console.error('Error fetching links:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch links' }), {
      status: 500,
    });
  }
}

// CREATE a new link
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const userId = session.user.id;

    const body = await req.json();
    const {
      url,
      linkTitle,
      linkDescription,
      faviconUrl,
      imageUrl,
      tags,
      categoryIds,
    } = body;

    const link = await prisma.link.create({
      data: {
        url,
        linkTitle,
        linkDescription,
        faviconUrl,
        imageUrl,
        tags,
        user: {
          connect: { id: userId },
        },
        categories: {
          create: (categoryIds || []).map((cid) => ({ categoryId: cid })),
        },
      },
    });

    // 🔹 Archive content in background
    fetchAndArchiveContent(url).then(async (content) => {
      if (content) {
        await prisma.link.update({
          where: { id: link.id },
          data: { archivedContent: content },
        });
      }
    });

    return new Response(JSON.stringify(link), { status: 201 });
  } catch (err) {
    console.error('Error creating link:', err);
    return new Response(JSON.stringify({ error: 'Failed to create link' }), {
      status: 500,
    });
  }
}
