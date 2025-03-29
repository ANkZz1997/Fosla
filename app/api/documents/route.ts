import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const allowedOrigins = [
  'http://localhost:3000',
  'https://your-production-domain.com'
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fileName = url.searchParams.get('file');

  if (!fileName) {
    return NextResponse.json({ error: 'File not specified' }, { status: 400 });
  }

  const decodedFilePath = decodeURIComponent(fileName);
  const filePath = path.resolve('C:/Users/DELL/OneDrive/Uploads', decodedFilePath);

  try {
    await fs.stat(filePath);
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const fileExtension = path.extname(filePath).toLowerCase();
  const contentType = fileExtension === '.pdf'
    ? 'application/pdf'
    : fileExtension.match(/\.(jpg|jpeg|png|webp)$/)
      ? `image/${fileExtension.slice(1)}`
      : 'application/octet-stream';

  const fileBuffer = await fs.readFile(filePath);

  const origin = request.headers.get('origin') || '';
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  return new NextResponse(fileBuffer, { headers });
}

// ✅ Handle CORS preflight requests
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') || '';

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
