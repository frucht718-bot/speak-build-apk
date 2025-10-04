import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { messages, model } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Nachrichten fehlen oder sind ungültig')
    }

    // System-Prompt: Fest integrierter Android APK Builder
    const systemPrompt = 'Du bist fest in dieser App integrierter Android-App-Builder. Antworte immer auf Deutsch, sei präzise und freundlich. Baue ausschließlich Android-APK-Apps für Smartphones (keine iOS/Tablet/Web-only). Zeige keinen Code. Beschreibe kompakte Schritte, Status und nächste Aktionen (ähnlich zu Bolt.new). Stelle nur unbedingt notwendige Rückfragen und führe sonst zielgerichtet aus.'

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY nicht konfiguriert')

    const selectedModel = model || 'google/gemini-2.5-flash'
    console.log(`chat-with-ai: Lovable AI, model=${selectedModel}, messages=${messages.length}`)

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    })

    if (!response.ok) {
      const t = await response.text()
      console.error('Lovable AI Fehler:', response.status, t)
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate Limit erreicht. Bitte später erneut versuchen.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Guthaben erschöpft. Bitte Kontingent aufladen.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      throw new Error(`Lovable AI Fehler: ${response.status}`)
    }

    const data = await response.json()
    const generatedText = data.choices?.[0]?.message?.content || ''

    console.log('Antwort generiert, Länge:', generatedText.length)

    return new Response(
      JSON.stringify({ response: generatedText, model: selectedModel }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Fehler in chat-with-ai:', error)
    const msg = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})