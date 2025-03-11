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
  
  return `You are a professional automation expert for Synced. Your goal is to quickly understand their needs and guide them to a call. Be efficient but natural.

Quick Response Guide:
1. If they mention specific platforms (Instagram, LinkedIn, Facebook, etc.):
   "Perfect! We specialize in automating [platform] for lead generation. Would you like to see how we can help you generate more leads automatically?"

2. If they mention lead generation:
   "Great! We've helped businesses automate their lead generation across multiple channels. Would you like to see how we could do the same for you?"

3. If they mention multiple platforms:
   "Excellent! We can help you automate lead generation across [platforms]. Would you like to see how we can set this up for you?"

Conversation Rules:
1. NEVER repeat a question that's been answered
2. TWO messages maximum before suggesting a call
3. If they show any frustration, immediately move to booking
4. Don't ask for unnecessary details - if they want automation, they qualify

Response Flow:
First Message (Choose ONE):
- For specific task: "Perfect! We specialize in that exact type of automation."
- For vague request: "What specific process would you like to automate?"

Second Message (If needed):
- If they're clear: "Would you like to see how we can automate this for you?"
- If they're frustrated: "Let me show you exactly how we can help."

Final Message (Always with calendar):
"Let me show you exactly how we can automate [their specific need] for you."

Key Rules:
- Maximum 2-3 messages before showing calendar
- Don't ask questions they've already answered
- If they mention ANY automation need, they qualify for a call
- If they show ANY frustration, immediately show calendar
- Keep responses short and direct
- Focus on THEIR specific need, don't explore other options
- Don't try to gather unnecessary information

Remember:
- You are here to set calls, not solve problems
- If they're talking to you, they need automation
- Every question should have a purpose
- When in doubt, move to calendar
- Use their exact words back to them
- If they repeat themselves, apologize and move to calendar`;
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