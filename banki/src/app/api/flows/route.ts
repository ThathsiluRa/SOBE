import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const flows = await prisma.flow.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(flows);
  } catch (error) {
    console.error('GET flows error:', error);
    return NextResponse.json({ error: 'Failed to fetch flows' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const flow = await prisma.flow.create({
      data: {
        id: uuidv4(),
        name: body.name,
        description: body.description,
        nodes: JSON.stringify(body.nodes || []),
        edges: JSON.stringify(body.edges || []),
        isPublished: body.isPublished ?? false,
        isTemplate: body.isTemplate ?? false,
      },
    });
    return NextResponse.json(flow, { status: 201 });
  } catch (error) {
    console.error('POST flow error:', error);
    return NextResponse.json({ error: 'Failed to create flow' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const updateData: Record<string, unknown> = { ...data };
    if (data.nodes) updateData.nodes = JSON.stringify(data.nodes);
    if (data.edges) updateData.edges = JSON.stringify(data.edges);

    const flow = await prisma.flow.update({ where: { id }, data: updateData });
    return NextResponse.json(flow);
  } catch (error) {
    console.error('PATCH flow error:', error);
    return NextResponse.json({ error: 'Failed to update flow' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    await prisma.flow.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE flow error:', error);
    return NextResponse.json({ error: 'Failed to delete flow' }, { status: 500 });
  }
}
