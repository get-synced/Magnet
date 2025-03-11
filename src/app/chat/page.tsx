'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { ChatMessage } from '@/types';
import CalendarBooking from '../components/CalendarBooking';

export default function ChatInterface() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [context, setContext] = useState<any>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your automation consultant. What specific process or task would you like to automate?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if user is authenticated and has completed discovery
    const storedUserId = localStorage.getItem('userId');
    const storedEmail = localStorage.getItem('userEmail');
    const discoveryData = localStorage.getItem('discoveryData');

    if (!storedUserId || !discoveryData) {
      router.push('/');
      return;
    }

    setUserId(storedUserId);
    setUserEmail(storedEmail);
    setContext(JSON.parse(discoveryData));

    // Check URL parameters for showing booking form
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('show_booking') === 'true') {
      setShowCalendar(true);
    }
  }, [router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userId || !context) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          userId,
          context
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Chat request failed');
      }

      setMessages(prev => [...prev, data.messages[1]]); // Add assistant's response

      // Show calendar if response suggests booking and we have enough context
      const responseContent = data.messages[1].content.toLowerCase();
      const messageCount = messages.length;
      const shouldShowCalendar = 
        ((responseContent.includes('schedule') || responseContent.includes('book')) && 
         (responseContent.includes('call') || responseContent.includes('consultation') || 
          responseContent.includes('meeting') || responseContent.includes('appointment'))) ||
        (messageCount >= 6 && responseContent.includes('help')); // Show after 3 exchanges if help is mentioned

      if (shouldShowCalendar) {
        setShowCalendar(true);
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'I apologize, but I encountered an error. Please try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleMeetingScheduled = (meetingLink: string) => {
    setShowCalendar(false);
    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Perfect! You'll receive a calendar invitation with the meeting link: ${meetingLink}. Looking forward to our call!`,
        timestamp: new Date()
      }
    ]);
  };

  const formatTimestamp = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString();
  };

  const formatMessage = (content: string) => {
    // First, handle bold and italic formatting
    const formattedContent = content.replace(
      /\*\*(.*?)\*\*/g, // Match text between double asterisks
      '<strong>$1</strong>'
    ).replace(
      /\*(.*?)\*/g, // Match text between single asterisks
      '<em>$1</em>'
    );

    // Split content into paragraphs and format lists
    return formattedContent.split('\n').map((paragraph, i) => {
      // Handle bullet points
      if (paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-')) {
        return (
          <li key={i} className="ml-4">
            <div dangerouslySetInnerHTML={{ __html: paragraph.trim().substring(1).trim() }} />
          </li>
        );
      }
      // Handle numbered lists
      if (paragraph.trim().match(/^\d+\./)) {
        return (
          <li key={i} className="ml-4">
            <div dangerouslySetInnerHTML={{ __html: paragraph.trim() }} />
          </li>
        );
      }
      // Handle regular paragraphs
      return paragraph.trim() && (
        <p key={i} className="mb-2">
          <div dangerouslySetInnerHTML={{ __html: paragraph }} />
        </p>
      );
    });
  };

  if (!userId || !context) {
    return null; // Or a loading state
  }

  return (
    <main className="flex flex-col h-screen bg-transparent pt-20">
      {/* Chat header */}
      <div className="glass-effect border-b border-white/10 p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-xl sm:text-2xl font-semibold gradient-text">
            AI Automation Consultant
          </h1>
          <p className="text-sm text-gray-300 mt-1">
            Let's explore automation opportunities for your business
          </p>
        </motion.div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.4,
              delay: index === messages.length - 1 ? 0 : 0,
              ease: [0.4, 0, 0.2, 1]
            }}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] rounded-xl p-4 chat-message ${
                message.role === 'user' ? 'user' : 'assistant'
              }`}
            >
              <div className="text-sm space-y-2">
                {formatMessage(message.content)}
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className={message.role === 'user' ? 'text-blue-200' : 'text-gray-400'}>
                  {formatTimestamp(message.timestamp)}
                </span>
                {message.role === 'assistant' && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-cyan-400"
                  >
                    AI Assistant
                  </motion.span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="typing-indicator">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </motion.div>
        )}
        {showCalendar && userId && userEmail && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="my-4 sm:my-6"
          >
            <div className="glass-effect rounded-xl p-4 sm:p-6">
              <CalendarBooking
                userId={userId}
                email={userEmail}
                onSuccess={handleMeetingScheduled}
              />
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-effect border-t border-white/10 p-4 sm:p-6 sticky bottom-0 left-0 right-0"
      >
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 rounded-xl chat-input text-white placeholder-gray-400"
          />
          <motion.button
            type="submit"
            disabled={!input.trim() || isTyping}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`px-6 py-3 rounded-xl font-semibold chat-send-button ${
              !input.trim() || isTyping
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-white/5 text-white cursor-pointer'
            }`}
          >
            Send
          </motion.button>
        </form>
      </motion.div>
    </main>
  );
} 