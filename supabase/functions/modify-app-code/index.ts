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
    const { prompt, currentCode } = await req.json()
    
    if (!prompt || !currentCode) {
      throw new Error('Missing prompt or current code')
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured')
    }

    console.log('Modifying app code with prompt:', prompt)

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Du bist ein Experte für Mobile App Entwicklung mit React Native.
            
            AUFGABE:
            - Analysiere den vorhandenen Code sorgfältig
            - Implementiere die gewünschten Änderungen präzise
            - Behalte die bestehende Struktur und Architektur bei
            - Achte auf Code-Qualität und Best Practices
            - Füge Kommentare für neue/geänderte Bereiche hinzu (auf Deutsch)
            - Stelle sicher, dass der Code nach der Änderung funktionsfähig bleibt
            
            Gib den vollständigen, aktualisierten Code zurück.`
          },
          {
            role: 'user',
            content: `Aktueller Code:\n\n${currentCode}\n\nÄnderungswunsch: ${prompt}`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Lovable AI error:', response.status, errorText)
      throw new Error(`Lovable AI error: ${response.status}`)
    }

    const data = await response.json()
    const modifiedCode = data.choices?.[0]?.message?.content || currentCode

    console.log('Code modified successfully')

    return new Response(
      JSON.stringify({ code: modifiedCode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in modify-app-code:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
