import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

// GET a single category
export async function GET(req, context) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const category = await prisma.category.findUnique({
      where: { id: Number(id) },
    });

    if (!category || category.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Category not found' }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(category), { status: 200 });
  } catch (err) {
    console.error('Error fetching category:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch category' }), {
      status: 500,
    });
  }
}

// UPDATE a category
export async function PUT(req, context) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const existing = await prisma.category.findUnique({
      where: { id: Number(id) },
    });
    if (!existing || existing.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Category not found' }), {
        status: 404,
      });
    }

    const body = await req.json();
    const updated = await prisma.category.update({
      where: { id: Number(id) },
      data: { categoryDescription: body.categoryDescription },
    });

    return new Response(JSON.stringify(updated), { status: 200 });
  } catch (err) {
    console.error('Error updating category:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to update category' }),
      { status: 500 }
    );
  }
}

// DELETE a category
export async function DELETE(req, context) {
  const { id } = await context.params;
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const existing = await prisma.category.findUnique({
      where: { id: Number(id) },
    });
    if (!existing || existing.userId !== session.user.id) {
      return new Response(JSON.stringify({ error: 'Category not found' }), {
        status: 404,
      });
    }

    await prisma.category.delete({ where: { id: Number(id) } });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Error deleting category:', err);
    return new Response(
      JSON.stringify({ error: 'Failed to delete category' }),
      { status: 500 }
    );
  }
}
