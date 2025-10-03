import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import 'https://deno.land/x/xhr@0.1.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = []
  let position = 0

  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize)
    const binaryChunk = atob(chunk)
    const bytes = new Uint8Array(binaryChunk.length)

    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i)
    }

    chunks.push(bytes)
    position += chunkSize
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  const result = new Uint8Array(totalLength)
  let offset = 0

  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }

  return result
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audio } = await req.json()

    if (!audio) {
      throw new Error('No audio data provided')
    }

    const binaryAudio = processBase64Chunks(audio)
    const blob = new Blob([binaryAudio], { type: 'audio/webm' })

    // Prefer GROQ Whisper for STT to avoid OpenAI quota issues
    const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

    async function transcribeWithGroq() {
      if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured')
      const formData = new FormData()
      formData.append('file', blob, 'audio.webm')
      formData.append('model', 'whisper-large-v3-turbo')
      formData.append('language', 'de')
      formData.append('response_format', 'json')

      const resp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` },
        body: formData,
      })

      if (!resp.ok) {
        const t = await resp.text()
        console.error('GROQ STT error:', resp.status, t)
        if (resp.status === 429) throw new Error('GROQ Rate limit exceeded. Please try again later.')
        if (resp.status === 402) throw new Error('GROQ payment required. Please add credits.')
        throw new Error(`Groq STT failed: ${resp.status}`)
      }

      const data = await resp.json()
      return data.text as string
    }

    async function transcribeWithOpenAI() {
      if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured')
      const formData = new FormData()
      formData.append('file', blob, 'audio.webm')
      formData.append('model', 'whisper-1')
      formData.append('language', 'de')

      const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
        body: formData,
      })

      if (!resp.ok) {
        const t = await resp.text()
        console.error('OpenAI STT error:', resp.status, t)
        throw new Error(`OpenAI STT failed: ${resp.status}`)
      }

      const data = await resp.json()
      return data.text as string
    }

    let text = ''
    try {
      text = await transcribeWithGroq()
    } catch (groqErr) {
      console.warn('Falling back to OpenAI STT due to GROQ error:', groqErr)
      if (OPENAI_API_KEY) {
        text = await transcribeWithOpenAI()
      } else {
        throw groqErr
      }
    }

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in voice-to-text:', error)
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
