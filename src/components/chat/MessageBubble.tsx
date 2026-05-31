import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { Zap } from 'lucide-react';
import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`message w-full flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`msg-bubble inline-block px-5 py-4 md:px-8 md:py-6 rounded-3xl text-[15px] md:text-[16px] leading-relaxed relative max-w-[90%] md:max-w-[540px] ${
          isUser
            ? 'bg-bg-surface border border-border text-text-primary rounded-tr-[4px]'
            : 'bg-bg-surface/30 border border-border/50 text-text-primary rounded-tl-[4px]'
        }`}
      >
        {!isUser && (
          <div className="text-[10px] text-accent mb-3 tracking-[0.2em] font-black uppercase flex items-center gap-2">
            <Zap className="w-3 h-3 fill-accent" />
            MailRite AI
          </div>
        )}
        <div className="markdown-body">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}
