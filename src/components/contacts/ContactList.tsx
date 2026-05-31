import { AnimatePresence, motion } from 'motion/react';
import { Users } from 'lucide-react';
import ContactCard from './ContactCard';
import EmptyState from '../shared/EmptyState';
import type { ContactWithProvenance } from '../../types';

interface ContactListProps {
  contacts: ContactWithProvenance[];
  onSelect: (contact: ContactWithProvenance) => void;
}

export default function ContactList({ contacts, onSelect }: ContactListProps) {
  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-5 h-5" />}
        title="No contacts identified yet"
        description="Ask MailRite to find contacts across your connected sources."
      />
    );
  }

  return (
    <div className="preview-list flex flex-col gap-[1px] bg-border border border-border rounded-lg overflow-hidden">
      <AnimatePresence mode="popLayout">
        {contacts.map((contact) => (
          <motion.div
            key={contact.id}
            layout
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <ContactCard contact={contact} onClick={() => onSelect(contact)} showActions />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
