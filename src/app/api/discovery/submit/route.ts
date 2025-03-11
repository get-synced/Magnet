import { NextResponse } from 'next/server';
import type { DiscoveryData } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, industry, otherIndustry, challenges, tools, otherTools, continuation } = body;

    if (!userId || !industry || !challenges || !tools || !continuation) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate other fields when needed
    if (industry === 'Other' && !otherIndustry) {
      return NextResponse.json(
        { error: 'Please specify your industry' },
        { status: 400 }
      );
    }

    if (tools.includes('Other') && (!otherTools || otherTools.length === 0)) {
      return NextResponse.json(
        { error: 'Please specify at least one other tool' },
        { status: 400 }
      );
    }

    // Create discovery data object with other fields
    const discoveryData: DiscoveryData = {
      userId,
      industry: industry === 'Other' ? `Other: ${otherIndustry}` : industry,
      challenges,
      tools: tools.includes('Other') 
        ? tools.filter((t: string) => t !== 'Other').concat(otherTools)
        : tools,
      continuation,
      submittedAt: new Date()
    };

    // TODO: Store discovery data in database
    console.log('New discovery data submitted:', discoveryData);

    // Send to Make.com webhook for ClickUp integration
    try {
      const webhookUrl = process.env.MAKE_WEBHOOK_URL;
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'discovery_submission',
            data: discoveryData,
            timestamp: new Date().toISOString()
          })
        });
      }
    } catch (error) {
      console.error('Error sending to Make.com webhook:', error);
      // Don't fail the submission if webhook fails
    }

    return NextResponse.json({
      message: 'Discovery data submitted successfully',
      discoveryData
    });
  } catch (error) {
    console.error('Error in discovery submission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 