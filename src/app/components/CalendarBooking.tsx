'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface CalendarBookingProps {
  userId: string;
  email: string;
  onSuccess?: (meetingLink: string) => void;
}

export default function CalendarBooking({ userId, email, onSuccess }: CalendarBookingProps) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState('');

  // Generate next 7 days
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return date.toISOString().split('T')[0];
  });

  // Generate time slots (9 AM to 5 PM)
  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  });

  const handleBooking = () => {
    // Redirect to Google Calendar scheduling page
    window.location.href = 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ3nh7-K64LxI_X9bewVl4P9s4g5aBmP9XQJERLm2_5OgTU1YOKJNjFi3a1xVOAKPGVYh1k6JlgL';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hour), parseInt(minute));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-xl p-6 max-w-md mx-auto"
    >
      <h2 className="text-xl font-semibold mb-4">Schedule a Consultation</h2>
      <p className="text-gray-300 mb-6">
        Click below to schedule a consultation call. You'll be redirected to our booking page where you can choose a time that works best for you.
      </p>
      <button
        onClick={handleBooking}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
      >
        Book Consultation
      </button>
    </motion.div>
  );
} 