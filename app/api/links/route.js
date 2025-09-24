import prisma from '@/lib/prisma';
import { fetchAndArchiveContent } from '@/lib/archive';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

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
/***********THIS VERSION REMOVES HYPERLINKS AND JUST LEAVES TEXT*/
// export async function POST(req) {
//   try {
//     const session = await getServerSession(authOptions);
//     if (!session) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const {
//       url,
//       linkTitle,
//       linkDescription,
//       faviconUrl,
//       imageUrl,
//       summary,
//       tags,
//     } = await req.json();

//     // --- Fetch and sanitize archived content ---
//     let archivedContent = null;
//     try {
//       const res = await fetch(url);
//       if (res.ok) {
//         const html = await res.text();

//         // Load HTML into Cheerio
//         const $ = cheerio.load(html);

//         // Remove <script> and <style> tags completely
//         $('script, style, noscript').remove();

//         // Replace all <a> tags with just their text content
//         $('a').each((_, el) => {
//           const text = $(el).text();
//           $(el).replaceWith(text);
//         });

//         // Optionally keep only the <body> content
//         archivedContent = $('body').html() || html;
//       }
//     } catch (err) {
//       console.error('Error archiving content:', err);
//     }

//     // --- Save link to DB ---
//     const link = await prisma.link.create({
//       data: {
//         url,
//         linkTitle,
//         linkDescription,
//         faviconUrl,
//         imageUrl,
//         summary,
//         tags: tags || [],
//         archivedContent,
//         user: { connect: { id: session.user.id } },
//       },
//     });

//     return NextResponse.json(link);
//   } catch (err) {
//     console.error('Error creating link:', err);
//     return NextResponse.json(
//       { error: 'Internal server error' },
//       { status: 500 }
//     );
//   }
// }

//**********THIS VERSION LEAVES IN HYPERLINKS */
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
        console.log(
          '✅ *************************************************************************************Archived content fetched for',
          url
        );
        await prisma.link.update({
          where: { id: link.id },
          data: { archivedContent: content },
        });
      } else {
        console.log(
          '⚠️ **************************************************************************************No content extracted for',
          url
        );
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
