import { existsSync, statSync, createReadStream } from 'fs'
import { join } from 'path'
import { NextRequest, NextResponse } from 'next/server'

const MIME: Record<string, string> = {
  '.mp4':  'video/mp4',
  '.mov':  'video/quicktime',
  '.webp': 'image/webp',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.webm': 'video/webm',
}

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  const { filename } = params
  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase()
  const mime = MIME[ext] || 'application/octet-stream'
  const filePath = join(process.cwd(), 'images', filename)

  if (!existsSync(filePath)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const { size } = statSync(filePath)
  const range = req.headers.get('range')

  // Support range requests (required for video seeking)
  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, '').split('-')
    const start = parseInt(startStr, 10)
    const end = endStr ? parseInt(endStr, 10) : size - 1
    const chunkSize = end - start + 1

    const stream = createReadStream(filePath, { start, end })
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(Buffer.from(chunk))
    const body = Buffer.concat(chunks)

    return new NextResponse(body, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': mime,
      },
    })
  }

  // Full file
  const stream = createReadStream(filePath)
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(Buffer.from(chunk))
  const body = Buffer.concat(chunks)

  return new NextResponse(body, {
    headers: {
      'Content-Type': mime,
      'Content-Length': String(size),
      'Accept-Ranges': 'bytes',
    },
  })
}
