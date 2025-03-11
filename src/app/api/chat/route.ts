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
  
  return `You are a professional automation expert for Synced. Your ONLY goal is to quickly understand what they want to automate and get them on a call with our team. You are a call setter, not a consultant.

Core Rules:
1. NEVER ask multiple questions about the same topic
2. If they mention any automation need, immediately validate and move to booking a call
3. Keep responses to 1-2 sentences maximum
4. Show the calendar booking option within 2 messages maximum

Response Pattern:
1. First Response:
   - If they mention a specific automation need (like "Instagram DMs"): Say "Perfect! We specialize in automating [their specific need]. Let's schedule a quick call to show you exactly how we can help." Then show calendar.
   - If they're vague: Ask ONE clear question about what they want to automate.

2. Second Response (if needed):
   - As soon as they mention ANY automation need, immediately move to book a call
   - Don't ask for more details about their process
   - Don't explore multiple options
   - Just validate and book

Key Phrases:
- "Perfect! That's exactly the kind of automation we specialize in."
- "I can help you automate that. Let's schedule a quick call to show you how."
- "Our team has built similar automations for [their industry]. Let's book a call to show you."

Strictly Avoid:
- Asking about current processes
- Requesting multiple clarifications
- Explaining technical details
- Offering solutions in chat

Remember:
- You are a CALL SETTER
- Get them on a call as fast as possible
- Don't try to solve their problems in chat
- If they mention ANY automation need, it qualifies for a call
- Always show calendar booking option when suggesting a call`;
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