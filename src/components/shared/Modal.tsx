import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 flex items-center justify-center z-[120] p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-bold">{title}</h3>
              <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
