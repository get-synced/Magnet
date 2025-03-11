import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChatMessage } from '@/types';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const getSystemPrompt = (context: any) => {
  const challenges = context?.challenges?.join(', ') || 'Unknown';
  const tools = context?.tools?.join(', ') || 'Unknown';
  const industry = context?.industry 
    ? (context.industry as string).startsWith('Other:')
      ? (context.industry as string).substring(7).trim()
      : context.industry
    : 'Unknown';
  
  return `You are a concise AI automation consultant for Synced. Your goal is to quickly understand the lead's needs and guide them to book a consultation call.

Client Context:
- Industry: ${industry}
- Challenges: ${challenges}
- Tools: ${tools}
- Approach: ${context?.continuation || 'Unknown'}

Core Objectives:
1. Quickly understand what they want to automate (1-2 messages)
2. Validate if we can help (1 message)
3. Guide to booking a call (show calendar)

Response Guidelines:
1. Keep responses under 2 short paragraphs
2. If they want to book a call, acknowledge and show calendar immediately
3. If automation need is unclear, ask ONE specific question
4. Use their industry context in examples
5. Focus on their challenges and goals
6. After 2 exchanges with good context, suggest booking a call

Communication Style:
- Short, clear sentences
- One question at a time
- Acknowledge their needs
- Be direct and action-oriented
- Use their mentioned tools in examples

Transition to Call:
- When they explicitly ask to book
- When you understand their basic need
- When they show urgency
- After 2-3 messages with context

Remember:
- Don't over-explain solutions
- Don't ask multiple questions at once
- Focus on booking the call once you have basic context
- Use what they've already told you`;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, userId, context } = body;

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    const systemMessage: ChatCompletionMessageParam = {
      role: 'system',
      content: getSystemPrompt(context)
    };

    // Get chat completion from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        systemMessage,
        { role: 'user', content: message } as ChatCompletionMessageParam
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    // Create chat message objects
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    };

    // TODO: Store chat history in database
    console.log('Chat messages:', { userMessage, assistantMessage });

    // Send to Make.com webhook only for newsletter signups
    try {
      const webhookUrl = process.env.MAKE_WEBHOOK_URL;
      // Check if message indicates newsletter signup
      if (webhookUrl && 
          message.toLowerCase().includes('newsletter') && 
          message.toLowerCase().includes('sign')) {
        const emailMatch = userMessage.content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) {
          const email = emailMatch[0];
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'newsletter_signup',
              email: email,
              userId,
              timestamp: new Date().toISOString()
            })
          });
        }
      }
    } catch (error) {
      console.error('Error sending to Make.com webhook:', error);
      // Don't fail the chat if webhook fails
    }

    // Return both messages
    return NextResponse.json({
      messages: [userMessage, assistantMessage]
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 