import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'schedule.json');

export async function GET() {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return Response.json(JSON.parse(data));
  } catch {
    return Response.json([]);
  }
}

export async function POST(request: Request) {
  const newEvent = await request.json();
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const events = JSON.parse(data);
    events.push(newEvent);
    fs.writeFileSync(filePath, JSON.stringify(events, null, 2));
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const updatedEvent = await request.json();
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    let events = JSON.parse(data);
    events = events.map((e: any) => e.id === updatedEvent.id ? updatedEvent : e);
    fs.writeFileSync(filePath, JSON.stringify(events, null, 2));
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    let events = JSON.parse(data);
    events = events.filter((e: any) => e.id !== id);
    fs.writeFileSync(filePath, JSON.stringify(events, null, 2));
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Failed' }, { status: 500 });
  }
}