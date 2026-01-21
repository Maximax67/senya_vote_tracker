import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { getFormResponsesDates } from '@/lib/googleForms';
import { randomBytes } from 'crypto';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIp || 'unknown';
}

function generateCookieToken(): string {
  return randomBytes(32).toString('hex');
}

export async function GET(request: NextRequest) {
  try {
    const ipAddress = getClientIp(request);
    const cookieToken = request.cookies.get('slot_user_token')?.value;

    const dates = await getFormResponsesDates();
    const totalVotes = dates.length;
    const votesPerRoll = parseInt(process.env.VOTES_PER_ROLL || '1');
    const baseRolls = Math.floor(totalVotes / votesPerRoll);

    let user;

    if (cookieToken) {
      user = await db.user.findUnique({
        where: { cookieToken },
        include: { sessions: true }
      });

      if (user) {
        const session = user.sessions.find(s => s.ipAddress === ipAddress);

        if (!session) {
          await db.userSession.create({
            data: {
              userId: user.id,
              ipAddress
            }
          });
        }
      } else {
        const sessionByIp = await db.userSession.findFirst({
          where: { ipAddress },
          include: { user: true }
        });

        if (sessionByIp) {
          user = await db.user.update({
            where: { id: sessionByIp.userId },
            data: { cookieToken }
          });
        }
      }
    }

    if (!user) {
      const sessionByIp = await db.userSession.findFirst({
        where: { ipAddress },
        include: { user: true }
      });

      if (sessionByIp) {
        user = sessionByIp.user;
      }
    }

    if (!user) {
      const newToken = generateCookieToken();
      user = await db.user.create({
        data: {
          cookieToken: newToken,
          sessions: {
            create: {
              ipAddress
            }
          }
        }
      });

      const response = NextResponse.json({
        availableRolls: baseRolls,
        rollsMade: 0,
        rollsBonuses: 0,
        totalVotes
      });

      response.cookies.set('slot_user_token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365 // 1 year
      });

      return response;
    }

    const availableRolls = Math.max(0, baseRolls + user.rollsBonuses - user.rollsMade);

    const response = NextResponse.json({
      availableRolls,
      rollsMade: user.rollsMade,
      rollsBonuses: user.rollsBonuses,
      totalVotes,
      votesPerRoll,
    });

    if (!cookieToken || cookieToken !== user.cookieToken) {
      response.cookies.set('slot_user_token', user.cookieToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365
      });
    }

    return response;
  } catch (error) {
    console.error('Error fetching roll stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roll stats' },
      { status: 500 }
    );
  }
}
