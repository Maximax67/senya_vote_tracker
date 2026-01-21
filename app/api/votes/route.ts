import db from '@/lib/prisma';
import { getFormResponseCount } from '@/lib/googleForms';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const votes = await getFormResponseCount();

    const lastSnapshot = await db.voteSnapshot.findFirst({
      orderBy: { recordedAt: 'desc' },
    });

    const now = new Date();
    const shouldCreateSnapshot = !lastSnapshot ||
      (now.getTime() - lastSnapshot.recordedAt.getTime()) >= 10 * 60 * 1000;

    if (shouldCreateSnapshot) {
      await db.voteSnapshot.create({
        data: { votes },
      });
    }

    return NextResponse.json({ votes });
  } catch (error) {
    console.error('Error fetching votes:', error);
    return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 });
  }
}
