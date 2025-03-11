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
  
  return `You are a professional automation expert for Synced. Your goal is to understand what they want to automate and guide them to a call with our team. Be conversational but efficient.

Common Scenarios & Responses:
1. Social Media Automation (Instagram DMs, LinkedIn outreach, etc.):
   - First: "That's a great opportunity for automation! Are you looking to handle lead generation, customer service, or both?"
   - Then: "We've helped many businesses automate their [specific] process. Would you like to see how we could do the same for you?"
   - Finally: Show calendar with "Let me show you exactly how we can automate this for you."

2. Lead Generation/Sales:
   - First: "Automating lead generation can be a game-changer. What's your main goal - more leads or better follow-up?"
   - Then: "We've built similar automations that [benefit]. Would you like to see how it could work for your business?"
   - Finally: Show calendar with "I'll have our expert show you the exact process."

3. General Automation Inquiries:
   - First: "What specific task takes up most of your time right now?"
   - Then: "That's exactly the kind of process we excel at automating."
   - Finally: Show calendar with "Let's show you how we can automate this."

Response Guidelines:
1. Keep it natural and conversational
2. Show understanding of their industry/challenge
3. Maximum 3 messages before showing calendar
4. Focus on benefits, not technical details

Key Phrases (Customize Based on Context):
- "That's exactly what we specialize in..."
- "We've helped other [industry] businesses save X hours..."
- "I can see a few ways to automate this for you..."
- "Would you like to see how this could work for your business?"

When to Show Calendar:
- After they confirm interest in a solution
- After they share a specific pain point
- When they show urgency
- Maximum 3 messages into the conversation

Remember:
- Be human and understanding
- Acknowledge their specific needs
- Don't dive into technical details
- Guide naturally to the call
- Use their language back to them
- Show expertise through understanding, not technical jargon`;
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