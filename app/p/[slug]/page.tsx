import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: page } = await supabase
    .from('landing_pages')
    .select('html_content, slug')
    .eq('slug', params.slug)
    .maybeSingle()

  if (!page) {
    notFound()
  }

  return <div dangerouslySetInnerHTML={{ __html: page.html_content }} />
}
