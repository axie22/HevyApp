import { Ollama } from 'ollama';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { messages, systemPrompt } = await req.json();

  const ollama = new Ollama({ host: 'http://localhost:11434' });

  try {
    const stream = await ollama.chat({
      model: process.env.OLLAMA_MODEL ?? 'llama3.2',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const token = chunk.message?.content ?? '';
            if (token) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(token)}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch {
    return Response.json({ error: 'model_offline' }, { status: 503 });
  }
}
