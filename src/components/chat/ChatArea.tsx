import { useRef, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import MessageBubble from './MessageBubble';
import ThinkingIndicator from './ThinkingIndicator';
import type { Message } from '../../types';

interface ChatAreaProps {
  messages: Message[];
  thinkingStage: string | null;
  chatEndRef?: React.RefObject<HTMLDivElement | null>;
}

export default function ChatArea({ messages, thinkingStage, chatEndRef: externalRef }: ChatAreaProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const endRef = externalRef || internalRef;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, endRef]);

  return (
    <div className="chat-area flex-1 px-4 md:px-12 lg:px-20 py-8 md:py-12 overflow-y-auto flex flex-col gap-6 md:gap-10">
      <AnimatePresence>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {thinkingStage && <ThinkingIndicator stage={thinkingStage} />}
      </AnimatePresence>
      <div ref={endRef} />
    </div>
  );
}
