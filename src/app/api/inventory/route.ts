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