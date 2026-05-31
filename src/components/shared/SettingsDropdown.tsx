import { motion, AnimatePresence } from 'motion/react';
import { User, Shield, ExternalLink, LogOut } from 'lucide-react';

interface SettingsDropdownProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDropdown({ open, onClose }: SettingsDropdownProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="absolute left-0 md:left-auto md:right-0 mt-2 w-56 bg-bg-surface border border-border rounded-xl shadow-2xl z-[110] overflow-hidden p-1"
        >
          <div className="px-3 py-2 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
            Account
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-primary hover:bg-bg-panel rounded-lg transition-colors">
            <User className="w-4 h-4" /> Profile
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-primary hover:bg-bg-panel rounded-lg transition-colors">
            <Shield className="w-4 h-4" /> Security
          </button>
          <div className="h-[1px] bg-border my-1" />
          <div className="px-3 py-2 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
            App
          </div>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-primary hover:bg-bg-panel rounded-lg transition-colors">
            <ExternalLink className="w-4 h-4" /> API Keys
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
