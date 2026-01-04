import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'inventory.json');

export async function GET() {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return Response.json(JSON.parse(data));
  } catch {
    return Response.json([]);
  }
}

export async function POST(request: Request) {
  const newStock = await request.json();
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const inventory = JSON.parse(data);
    inventory.push(newStock);
    fs.writeFileSync(filePath, JSON.stringify(inventory, null, 2));
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const update = await request.json(); // { sku, stock_m }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    let inventory = JSON.parse(data);
    inventory = inventory.map((item: any) => item.sku === update.sku ? { ...item, stock_m: item.stock_m + update.addStock } : item);
    fs.writeFileSync(filePath, JSON.stringify(inventory, null, 2));
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Failed' }, { status: 500 });
  }
}