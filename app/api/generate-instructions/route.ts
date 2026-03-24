import { NextResponse } from 'next/server';
import { generateInstructionMarkdown } from '@/lib/instructionGenerator';
import type { GenerateInstructionRequest } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateInstructionRequest;
    const markdown = generateInstructionMarkdown(body);
    return NextResponse.json({ markdown });
  } catch (error) {
    console.error('Error generating instruction file:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to generate instruction file' }, { status: 500 });
  }
}
