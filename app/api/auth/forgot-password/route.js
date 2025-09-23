import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import resend from '@/lib/resend';

const RESET_TOKEN_EXPIRY_HOURS = 1;

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(
        Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
      );

      // Save token + expiry
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: token,
          resetPasswordTokenExpiry: expiry,
        },
      });

      // Send email with reset link
      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

      try {
        await resend.emails.send({
          from: 'no-reply@vancelawfirmtx.com',
          to: user.email,
          subject: 'Reset your Linxify password',
          html: `
            <p>Hello,</p>
            <p>You requested a password reset. Click the link below to reset it:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This link will expire in ${RESET_TOKEN_EXPIRY_HOURS} hour(s).</p>
          `,
        });
      } catch (emailErr) {
        console.error('Error sending reset email:', emailErr);
        // Fail silently to not expose info
      }
    }

    // Always return success (so attackers can’t check if email exists)
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
