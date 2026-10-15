import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { askMenilikAI, APPROVED_DBU_KNOWLEDGE } from '@/lib/menilik';
import { z } from 'zod';

const questionSchema = z.object({
  question: z
    .string()
    .min(3, 'Question must be at least 3 characters long')
    .max(500, 'Question cannot exceed 500 characters'),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'You must be logged in to ask Menilik AI.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validated = questionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const response = await askMenilikAI(validated.data.question);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Menilik AI query error:', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Menilik AI service is momentarily unavailable.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const documents = APPROVED_DBU_KNOWLEDGE.map((k) => ({
      id: k.id,
      title: k.documentTitle,
      category: k.category,
      section: k.section,
    }));

    return NextResponse.json({
      name: 'Menilik AI University Assistant',
      institution: 'Debre Berhan University (DBU)',
      status: 'OPERATIONAL',
      provider: process.env.MENILIK_AI_PROVIDER || 'local-rag',
      availableKnowledgeTopics: documents,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Unable to retrieve Menilik knowledge index.' },
      { status: 500 }
    );
  }
}
