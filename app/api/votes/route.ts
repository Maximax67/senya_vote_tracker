import { getFormResponsesDates } from '@/lib/googleForms';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const dates = await getFormResponsesDates();

    return NextResponse.json({
      votes: dates.length,
      history: dates,
    });
  } catch (error) {
    console.error('Error fetching votes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch votes' },
      { status: 500 }
    );
  }
}
