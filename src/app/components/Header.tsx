'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/10 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3 group">
          <motion.div
            className="relative w-8 h-8 sm:w-10 sm:h-10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image
              src="/logo.png"
              alt="Synced Logo"
              fill
              className="object-contain"
              priority
              sizes="(max-width: 768px) 32px, 40px"
            />
          </motion.div>
          <motion.span
            className="text-xl sm:text-2xl font-semibold bg-gradient-to-br from-yellow-300 via-orange-400 to-purple-600 bg-clip-text text-transparent"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Synced
          </motion.span>
        </Link>
      </div>
    </motion.header>
  );
} 