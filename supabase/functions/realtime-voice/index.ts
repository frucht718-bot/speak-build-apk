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
    const { action } = await req.json()
    
    if (action !== 'create-session') {
      throw new Error('Ungültige Aktion')
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY nicht konfiguriert')
    }

    console.log('Erstelle OpenAI Realtime Session...')

    // Erstelle ephemeral token für OpenAI Realtime API
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
        instructions: `Du bist ein hilfreicher KI-Assistent, der Nutzern dabei hilft, mobile Apps zu erstellen. 
        Antworte immer auf Deutsch. Sei freundlich, präzise und hilfsbereit.
        Wenn der Nutzer eine App beschreibt, stelle klärende Fragen und sammle alle wichtigen Details.`
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API Fehler:', response.status, errorText)
      throw new Error(`OpenAI API Fehler: ${response.status}`)
    }

    const data = await response.json()
    console.log('Session erfolgreich erstellt')

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Fehler in realtime-voice:', error)
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
