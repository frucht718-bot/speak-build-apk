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
    const { messages, provider = 'gemini', model } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Nachrichten fehlen oder sind ungültig')
    }

    console.log(`chat-with-ai: provider=${provider}, model=${model ?? 'default'}, messages=${messages.length}`)

    // Einheitliches System-Prompt: Fest integrierter Android APK Builder
    const systemPrompt = 'Du bist fest in dieser App integrierter Android-App-Builder. Antworte immer auf Deutsch, sei präzise und freundlich. Baue ausschließlich Android-APK-Apps für Smartphones (keine iOS/Tablet/Web-only). Zeige keinen Code. Beschreibe kompakte Schritte, Status und nächste Aktionen (ähnlich zu Bolt.new). Stelle nur unbedingt notwendige Rückfragen und führe sonst zielgerichtet aus.'

    let response: Response
    let generatedText = ''

    if (provider === 'gemini') {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
      if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY nicht konfiguriert')

      response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      })

      if (!response.ok) {
        const t = await response.text()
        console.error('Gemini (Lovable AI) Fehler:', response.status, t)
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: 'Rate Limit erreicht. Bitte später erneut versuchen.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: 'Guthaben erschöpft. Bitte Kontingent aufladen.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
        throw new Error(`Gemini API Fehler: ${response.status}`)
      }

      const data = await response.json()
      generatedText = data.choices?.[0]?.message?.content || ''
    } else if (provider === 'groq') {
      const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
      if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY nicht konfiguriert')

      // Standard-Modelle für Groq zur Auswahl
      // mixtral-8x7b-32768, llama3-70b-8192, llama3-8b-8192, gemma2-9b-it, qwen2-72b-instruct
      const groqModel = model || 'mixtral-8x7b-32768'

      response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      })

      if (!response.ok) {
        const t = await response.text()
        console.error('Groq API Fehler:', response.status, t)
        throw new Error(`Groq API Fehler: ${response.status}`)
      }

      const data = await response.json()
      generatedText = data.choices?.[0]?.message?.content || ''
    } else if (provider === 'openai') {
      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
      if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY nicht konfiguriert')

      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const t = await response.text()
        console.error('OpenAI API Fehler:', response.status, t)
        throw new Error(`OpenAI API Fehler: ${response.status}`)
      }

      const data = await response.json()
      generatedText = data.choices?.[0]?.message?.content || ''
    } else {
      throw new Error(`Unbekannter Provider: ${provider}`)
    }

    console.log('Antwort generiert, Länge:', generatedText.length)

    return new Response(
      JSON.stringify({ response: generatedText, provider, model: model || 'default' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Fehler in chat-with-ai:', error)
    const msg = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})