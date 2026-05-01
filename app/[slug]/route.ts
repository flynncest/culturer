import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params
  if (!slug.endsWith('.html')) {
    return new NextResponse('Not found', { status: 404 })
  }
  const filePath = join(process.cwd(), slug)
  if (!existsSync(filePath)) {
    return new NextResponse('Not found', { status: 404 })
  }
  const html = readFileSync(filePath, 'utf-8')
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
