import { NextResponse } from 'next/server';
import type { User } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, subscribeNewsletter } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Create user object
    const user: User = {
      email,
      subscribeNewsletter: subscribeNewsletter || false,
      createdAt: new Date()
    };

    // TODO: Store user in database
    // For now, we'll just simulate storing the user
    console.log('New user registered:', user);

    // If user opted for newsletter, send to Make.com webhook
    if (subscribeNewsletter) {
      try {
        const webhookUrl = process.env.MAKE_WEBHOOK_URL;
        if (webhookUrl) {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'newsletter_subscription',
              email,
              timestamp: new Date().toISOString()
            })
          });
        }
      } catch (error) {
        console.error('Error sending to Make.com webhook:', error);
        // Don't fail the registration if webhook fails
      }
    }

    // Return success with user data
    return NextResponse.json({
      message: 'User registered successfully',
      user
    });
  } catch (error) {
    console.error('Error in registration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 