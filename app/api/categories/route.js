import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// GET all categories for logged-in user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const categories = await prisma.category.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return new Response(JSON.stringify(categories), { status: 200 });
  } catch (err) {
    console.error('Error fetching categories:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch categories' }),
      { status: 500 }
    );
  }
}

// CREATE a new category
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const body = await req.json();
    const { categoryDescription } = body;

    if (!categoryDescription) {
      return new Response(
        JSON.stringify({ error: 'Category description required' }),
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        categoryDescription,
        user: {
          connect: { id: session.user.id },
        },
      },
    });

    return new Response(JSON.stringify(category), { status: 201 });
  } catch (err) {
    console.error('Error creating category:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to create category' }),
      { status: 500 }
    );
  }
}
