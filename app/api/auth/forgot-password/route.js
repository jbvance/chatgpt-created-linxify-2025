// app/api/auth/forgot-password/route.js
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import resend from '@/lib/resend';

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond the same to avoid user enumeration
    const genericOk = NextResponse.json({
      message: 'If that email exists, a reset link has been sent.',
    });

    if (!user) {
      return genericOk;
    }

    // Generate secure token + 15 min expiry
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 1000 * 60 * 15);

    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: token,
        resetPasswordTokenExpiry: expiry,
      },
    });

    // Build reset URL using your public app base (NextAuth URL works here)
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    // Send the email via Resend
    const from = process.env.RESEND_FROM || 'Linxify <no-reply@example.com>';
    const subject = 'Reset your Linxify password';
    const html = `
      <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#111">
        <h2>Reset your password</h2>
        <p>We received a request to reset your Linxify password.</p>
        <p>This link will expire in <strong>15 minutes</strong>:</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#0d6efd;color:#fff;text-decoration:none;">
            Reset Password
          </a>
        </p>
        <p>Or copy and paste this URL into your browser:</p>
        <p style="word-break:break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you didn’t request this, you can safely ignore this email.</p>
      </div>
    `;
    const text = `Reset your Linxify password (expires in 15 minutes): ${resetUrl}`;

    try {
      await resend.emails.send({
        from,
        to: email,
        subject,
        html,
        text,
      });
    } catch (e) {
      // Don’t leak email send errors to the client; just log server-side
      console.error('Resend send error:', e);
      // We still return generic OK to avoid leaking whether email exists
    }

    return genericOk;
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
