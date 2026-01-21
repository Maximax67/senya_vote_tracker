import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/prisma';
import { getFormResponsesDates } from '@/lib/googleForms';
import { createHash } from 'crypto';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIp || 'unknown';
}

const SYMBOLS = [
  { name: 'cherry', emoji: '🍒', position: 0 },
  { name: 'lemon', emoji: '🍋', position: 1 },
  { name: 'orange', emoji: '🍊', position: 2 },
  { name: 'plum', emoji: '🍇', position: 3 },
  { name: 'seven', emoji: '7️⃣', position: 4 },
];

const WINNING_BONUSES: Record<string, number> = {
  'cherry-cherry-cherry': 5,
  'lemon-lemon-lemon': 10,
  'orange-orange-orange': 20,
  'plum-plum-plum': 30,
  'seven-seven-seven': 50,
};

function generateRollResult(seed: string): number[] {
  const hash = createHash('sha256').update(seed).digest('hex');

  const positions: number[] = [];
  for (let i = 0; i < 3; i++) {
    const value = parseInt(hash.substring(i * 4, i * 4 + 4), 16);
    const position = value % SYMBOLS.length;
    positions.push(position);
  }

  return positions;
}

function calculateWinnings(positions: number[]): number {
  const symbols = positions.map(pos => SYMBOLS[pos].name);
  const key = symbols.join('-');
  return WINNING_BONUSES[key] || 0;
}

export async function POST(request: NextRequest) {
  try {
    const ipAddress = getClientIp(request);
    const cookieToken = request.cookies.get('slot_user_token')?.value;

    if (!cookieToken) {
      return NextResponse.json(
        { error: 'No user token found' },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { cookieToken },
      include: { sessions: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const hasSession = user.sessions.some(s => s.ipAddress === ipAddress);
    if (!hasSession) {
      return NextResponse.json(
        { error: 'Session not found for this IP' },
        { status: 403 }
      );
    }

    const dates = await getFormResponsesDates();
    const totalVotes = dates.length;
    const baseRolls = Math.floor(totalVotes / parseInt(process.env.VOTES_PER_ROLL || '1'));
    const availableRolls = Math.max(0, baseRolls + user.rollsBonuses - user.rollsMade);

    if (availableRolls <= 0) {
      return NextResponse.json(
        { error: 'No rolls available' },
        { status: 403 }
      );
    }

    const seed = `${user.id}-${user.rollsMade}-${Date.now()}`;
    const positions = generateRollResult(seed);
    const bonusWon = calculateWinnings(positions);

    const symbols = positions.map(pos => ({
      name: SYMBOLS[pos].name,
      emoji: SYMBOLS[pos].emoji,
      position: SYMBOLS[pos].position
    }));

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        rollsMade: user.rollsMade + 1,
        rollsBonuses: user.rollsBonuses + bonusWon
      }
    });

    const resultHash = createHash('sha256')
      .update(`${seed}-${positions.join('-')}`)
      .digest('hex');

    return NextResponse.json({
      positions,
      symbols,
      bonusWon,
      resultHash,
      rollsMade: updatedUser.rollsMade,
      rollsBonuses: updatedUser.rollsBonuses,
      availableRolls: Math.max(0, baseRolls + updatedUser.rollsBonuses - updatedUser.rollsMade)
    });
  } catch (error) {
    console.error('Error processing roll:', error);
    return NextResponse.json(
      { error: 'Failed to process roll' },
      { status: 500 }
    );
  }
}
