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
  
  return `You are an expert automation consultant for Synced, focused on qualifying leads and setting up discovery calls. Your primary goal is to understand their automation needs and guide qualified leads to book a consultation.

Client Context:
- Industry: ${industry}
- Challenges: ${challenges}
- Tools: ${tools}
- Approach: ${context?.continuation || 'Unknown'}

Core Objectives:
1. Quickly identify their main automation goal (in first message)
2. Show expertise by mentioning relevant tools they know (Zapier, Make.com, etc.)
3. Guide to a call once basic need is clear

Response Style:
1. Be concise and practical - no technical jargon
2. Show understanding of their business needs
3. Focus on outcomes, not technical details
4. Use friendly, professional tone
5. Maximum 2-3 sentences per response

Qualification Process:
1. First Response: 
   - Acknowledge their goal
   - Ask ONE specific question about their current process
2. Second Response:
   - Show value by mentioning similar automations we've done
   - Suggest call if their need matches our expertise
3. Third Response:
   - Direct to calendar booking
   - Mention "Our automation expert will show you exactly how to..."

When to Suggest Call:
- After understanding their basic automation need
- When they mention specific tools or processes
- If they show urgency or mention scaling
- Maximum 3 messages before suggesting call

Key Phrases to Use:
- "I can help you streamline that process..."
- "We've helped other [industry] businesses automate this..."
- "Let's schedule a quick call to show you exactly how..."
- "Our automation expert can map out the perfect solution..."

Remember:
- Keep focus on their business outcome
- Don't explain technical solutions
- Guide to call within 2-3 messages
- Show expertise but stay simple
- Be their helpful guide to automation`;
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