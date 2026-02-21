import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

function generateCustomerId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `BANKI-${year}-${random}`;
}

// GET /api/applications - List all applications
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const id = searchParams.get('id');

    if (id) {
      const application = await prisma.application.findUnique({ where: { id } });
      if (!application) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(application);
    }

    const where = status ? { status } : {};
    const applications = await prisma.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('GET applications error:', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

// POST /api/applications - Create new application
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customerId = generateCustomerId();

    const application = await prisma.application.create({
      data: {
        id: uuidv4(),
        customerId,
        status: 'in_progress',
        language: body.language || 'en',
        ...body,
      },
    });

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error('POST application error:', error);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}

// PATCH /api/applications - Update application
export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const application = await prisma.application.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error('PATCH application error:', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
