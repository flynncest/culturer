import { readFileSync } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

export async function GET() {
  let html = readFileSync(join(process.cwd(), 'dashboard.html'), 'utf-8')
  // Patch internal links to work within Next.js routing
  html = html.replaceAll("'login.html'", "'/login'")
  html = html.replaceAll('"login.html"', '"/login"')
  html = html.replaceAll("'quiz.html", "'/quiz.html")
  html = html.replaceAll('"quiz.html', '"/quiz.html')
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
