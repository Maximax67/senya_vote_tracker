import db from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const history = await db.voteSnapshot.findMany({
      orderBy: { recordedAt: 'asc' },
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
