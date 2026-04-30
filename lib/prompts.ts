/**
 * AI prompt templates for Culturers automation flows.
 * All prompts are centralised here — do not duplicate elsewhere.
 */

export function birthdayVideoPrompt(
  firstName: string,
  hobbies: string,
  giftPref: string
): string {
  return `Create a warm, personal birthday video message for ${firstName}.

Key details about ${firstName}:
- Hobbies & interests: ${hobbies}
- Gift preference: ${giftPref}

Guidelines:
- Open with a genuine, heartfelt happy birthday wish using their first name
- Reference their hobbies naturally in the message (e.g., "hope you get to enjoy some [hobby] today")
- Keep the tone warm, celebratory, and personal — not corporate
- Duration: approximately 30–45 seconds
- Close with an uplifting message about the year ahead
- Visual style: warm, upbeat, celebratory with confetti or bokeh effects
- Voiceover should feel like it comes from a close colleague, not a brand`
}

export function anniversaryVideoPrompt(
  firstName: string,
  years: number,
  hobbies: string
): string {
  const yearsLabel = years === 1 ? '1 year' : `${years} years`

  return `Create a work anniversary celebration video for ${firstName}, who is celebrating ${yearsLabel} with the company.

Key details about ${firstName}:
- Hobbies & interests: ${hobbies}

Guidelines:
- Open by congratulating ${firstName} on their ${yearsLabel} milestone
- Acknowledge the journey and growth over this time
- Reference their interests to make the message feel personal
- Keep the tone appreciative, proud, and forward-looking
- Duration: approximately 30–45 seconds
- Visual style: professional yet warm — think gold/champagne tones, milestone graphics
- Highlight that the company genuinely values and celebrates each person's journey`
}

export function renewalVideoPrompt(companyName: string): string {
  return `Create a partnership renewal video message for ${companyName}.

Guidelines:
- Open by celebrating the continued partnership with ${companyName}
- Express genuine appreciation for the trust and collaboration
- Highlight excitement about the next chapter of working together
- Keep the tone professional but warm — partner-to-partner, not vendor-to-client
- Duration: approximately 20–30 seconds
- Visual style: clean, professional, brand-aligned with subtle motion graphics
- Avoid generic sales language — this is a relationship moment, not a pitch`
}

export function landingPagePrompt(
  firstName: string,
  companyName: string,
  quizData: {
    favourite_treat?: string
    hobbies?: string
    gift_preference?: string
    tshirt_size?: string
    extra_notes?: string
  }
): string {
  return `Generate a beautiful, personalised HTML landing page for a prospect named ${firstName} from ${companyName}.

What we know about ${firstName}:
- Favourite treat: ${quizData.favourite_treat || 'not specified'}
- Hobbies: ${quizData.hobbies || 'not specified'}
- Gift preference: ${quizData.gift_preference || 'not specified'}
- T-shirt size: ${quizData.tshirt_size || 'not specified'}
- Extra notes: ${quizData.extra_notes || 'none'}

Design requirements:
- Full standalone HTML page (no external dependencies except Google Fonts)
- Use Google Fonts: Kaisei Decol (headings) + DM Sans (body)
- Color palette: accent #f64d25, background #f7f6f2, borders rgba(246,77,37,0.14)
- Reference ${firstName}'s personal details naturally to show genuine personalisation
- Include a section explaining the Culturers employee engagement platform
- Include social proof elements (stats, testimonials placeholder)
- Include a clear CTA: "Book a call" button (href="#contact")
- Include a simple contact form at the bottom
- Make it feel like a bespoke gift, not a template
- Mobile responsive
- Return ONLY valid HTML — no markdown, no code fences, no commentary`
}
