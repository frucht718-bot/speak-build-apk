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
    const { prompt } = await req.json()
    
    if (!prompt) {
      throw new Error('Keine Beschreibung angegeben')
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY nicht konfiguriert')
    }

    console.log('Generiere App-Icon für:', prompt)

    const iconPrompt = `Erstelle ein modernes, professionelles App-Icon für: ${prompt}. 
    Das Icon sollte:
    - Einfach und einprägsam sein
    - Für eine mobile Android-App geeignet sein
    - Lebendige Farben verwenden
    - Modernen Design-Prinzipien folgen
    - Gut auf kleinen Bildschirmen erkennbar sein
    - Ein klares, fokussiertes Design haben (kein Text im Icon)
    - Quadratisches Format, geeignet für Android adaptive Icons`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image-preview',
        messages: [
          {
            role: 'user',
            content: iconPrompt
          }
        ],
        modalities: ['image', 'text']
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Lovable AI Fehler:', response.status, errorText)
      throw new Error(`Lovable AI Fehler: ${response.status}`)
    }

    const data = await response.json()
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url

    if (!imageUrl) {
      throw new Error('Kein Icon generiert')
    }

    console.log('Icon erfolgreich generiert')

    return new Response(
      JSON.stringify({ icon: imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Fehler in generate-app-icon:', error)
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
