# Synced Automation Discovery App

An AI-driven automation discovery and lead qualification tool that helps potential clients identify automation opportunities and guides them through the process of implementing custom automation solutions.

## Features

- 🚀 Email-based user registration
- 📋 Multi-step discovery questionnaire
- 🤖 AI-powered automation consultant chatbot
- 🔄 Integration with Make.com for CRM (ClickUp)
- 📅 Google Calendar integration for booking calls
- 📧 Newsletter subscription management

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **AI**: OpenAI GPT-4 Turbo
- **Integrations**: Make.com, Google Calendar
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- OpenAI API key
- Make.com account
- Google Cloud Console project with Calendar API enabled

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/synced-automation-app.git
   cd synced-automation-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   MAKE_WEBHOOK_URL=your_make_webhook_url_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Deploying to Vercel

1. Push your code to a GitHub repository.

2. Connect your repository to Vercel:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

3. Set up environment variables in Vercel:
   - Go to Project Settings > Environment Variables
   - Add all variables from `.env.local`

### Setting up Make.com Integration

1. Create a new scenario in Make.com
2. Add a webhook trigger
3. Configure the webhook to handle:
   - User registrations
   - Newsletter subscriptions
   - Discovery data submissions
   - Chat interactions
4. Connect the webhook to your ClickUp list

### Setting up Google Calendar Integration

1. Create a project in Google Cloud Console
2. Enable the Google Calendar API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs in Google Cloud Console
5. Update environment variables with Google credentials

## Development

### Project Structure

```
src/
├── app/
│   ├── api/         # API routes
│   ├── chat/        # Chat interface
│   ├── questions/   # Discovery questionnaire
│   └── page.tsx     # Landing page
├── types/           # TypeScript types
└── utils/          # Utility functions
```

### API Routes

- `/api/auth/register` - User registration
- `/api/discovery/submit` - Discovery data submission
- `/api/chat` - OpenAI chat integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is proprietary and confidential. All rights reserved.
# Magnet
