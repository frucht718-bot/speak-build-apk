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

    console.log(`Chat-Anfrage mit ${provider}:`, messages.length, 'Nachrichten')

    let response;
    let generatedText = '';

    switch (provider) {
      case 'gemini': {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
        if (!LOVABLE_API_KEY) {
          throw new Error('LOVABLE_API_KEY nicht konfiguriert')
        }

        response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model || 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'Du bist ein hilfreicher KI-Assistent. Antworte immer auf Deutsch, präzise und freundlich.'
              },
              ...messages
            ],
            temperature: 0.7,
            max_tokens: 4000,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Gemini API Fehler:', response.status, errorText)
          throw new Error(`Gemini API Fehler: ${response.status}`)
        }

        const data = await response.json()
        generatedText = data.choices?.[0]?.message?.content || ''
        break
      }

      case 'groq': {
        const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
        if (!GROQ_API_KEY) {
          throw new Error('GROQ_API_KEY nicht konfiguriert')
        }

        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model || 'mixtral-8x7b-32768',
            messages: [
              {
                role: 'system',
                content: 'Du bist ein hilfreicher KI-Assistent. Antworte immer auf Deutsch, präzise und freundlich.'
              },
              ...messages
            ],
            temperature: 0.7,
            max_tokens: 4000,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Groq API Fehler:', response.status, errorText)
          throw new Error(`Groq API Fehler: ${response.status}`)
        }

        const data = await response.json()
        generatedText = data.choices?.[0]?.message?.content || ''
        break
      }

      case 'openai': {
        const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
        if (!OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY nicht konfiguriert')
        }

        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model || 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Du bist ein hilfreicher KI-Assistent. Antworte immer auf Deutsch, präzise und freundlich.'
              },
              ...messages
            ],
            temperature: 0.7,
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('OpenAI API Fehler:', response.status, errorText)
          throw new Error(`OpenAI API Fehler: ${response.status}`)
        }

        const data = await response.json()
        generatedText = data.choices?.[0]?.message?.content || ''
        break
      }

      default:
        throw new Error(`Unbekannter Provider: ${provider}`)
    }

    console.log('Chat-Antwort generiert, Länge:', generatedText.length)

    return new Response(
      JSON.stringify({ 
        response: generatedText,
        provider,
        model: model || 'default'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Fehler in chat-with-ai:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
