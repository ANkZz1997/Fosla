import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fileName = url.searchParams.get('file');

  if (!fileName) {
    return NextResponse.json({ error: 'File not specified' }, { status: 400 });
  }

  const decodedFilePath = decodeURIComponent(fileName);
  const filePath = path.resolve('C:/Users/DELL/OneDrive/Uploads', decodedFilePath);

  if (!await fs.stat(filePath).catch(() => null)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const fileExtension = path.extname(filePath).toLowerCase();
  const contentType = fileExtension === '.pdf' 
    ? 'application/pdf' 
    : fileExtension.match(/\.(jpg|jpeg|png|webp)$/) 
    ? `image/${fileExtension.slice(1)}` 
    : 'application/octet-stream';

  const fileBuffer = await fs.readFile(filePath);

  return new NextResponse(fileBuffer, {
    headers: { 'Content-Type': contentType },
  });
}
