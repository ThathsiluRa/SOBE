import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('GET products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const product = await prisma.product.create({
      data: {
        id: uuidv4(),
        name: body.name,
        type: body.type,
        description: body.description,
        features: JSON.stringify(body.features || []),
        interestRate: body.interestRate,
        eligibilityRules: JSON.stringify(body.eligibilityRules || {}),
        termsConditions: body.termsConditions,
        isActive: body.isActive ?? true,
        displayOrder: body.displayOrder ?? 0,
      },
    });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('POST product error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const updateData: Record<string, unknown> = { ...data };
    if (data.features && Array.isArray(data.features)) {
      updateData.features = JSON.stringify(data.features);
    }
    if (data.eligibilityRules && typeof data.eligibilityRules === 'object') {
      updateData.eligibilityRules = JSON.stringify(data.eligibilityRules);
    }

    const product = await prisma.product.update({ where: { id }, data: updateData });
    return NextResponse.json(product);
  } catch (error) {
    console.error('PATCH product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
