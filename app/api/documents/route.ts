// app/api/documents/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// This function handles requests to the API
export async function GET(request: Request) {
  // Extract the file path from the query
  const url = new URL(request.url);
  const fileName = url.searchParams.get('file');
  
  if (!fileName) {
    return NextResponse.json({ error: 'File not specified' }, { status: 400 });
  }

  // Decode the file path
  const decodedFilePath = decodeURIComponent(fileName);
  
  // Resolve the full path to the file
  const filePath = path.resolve('C:/Users/DELL/OneDrive/Uploads', decodedFilePath);
  
  // Check if the file exists
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Determine the file extension and set appropriate content type
  const fileExtension = path.extname(filePath).toLowerCase();
  let contentType = 'application/octet-stream';

  if (fileExtension === '.pdf') {
    contentType = 'application/pdf';
  } else if (['.jpg', '.jpeg', '.png', '.webp'].includes(fileExtension)) {
    contentType = `image/${fileExtension.slice(1)}`;
  }

  // Create a readable stream from the file and pipe it to the response
  const fileStream = fs.createReadStream(filePath);
  
  return new NextResponse(fileStream, {
    headers: {
      'Content-Type': contentType,
    },
  });
}
