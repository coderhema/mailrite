import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Users, Terminal, History, ChevronLeft, Plus, Zap, X } from 'lucide-react';
import { useKanban } from './hooks/useKanban';
import Sidebar from './components/layout/Sidebar';
import ChatArea from './components/chat/ChatArea';
import ChatInput from './components/chat/ChatInput';
import ContactDetail from './components/contacts/ContactDetail';
import DraftPreview from './components/draft/DraftPreview';
import CoralPanel from './components/coral/CoralPanel';
import Modal from './components/shared/Modal';
import KanbanBoard from './components/kanban/KanbanBoard';
import { searchContacts, generateDraft } from './services/geminiService';
import type { Contact, Message, DataSource, CoralQueryResult, CoralPresetQuery, ContactWithProvenance, KanbanCard } from './types';

const MOCK_CONTACTS: ContactWithProvenance[] = [
  { id: '1', name: 'Julia Stiles', role: 'Head of Design', company: 'Stripe', avatar: 'JS', source: 'LinkedIn', email: 'julia@stripe.com', provenance: [{ field: 'name', source: 'linkedin' }, { field: 'role', source: 'linkedin' }, { field: 'email', source: 'gmail' }] },
  { id: '2', name: 'Marcus Reed', role: 'Product Design Lead', company: 'Linear', avatar: 'MR', source: 'LinkedIn', email: 'marcus@linear.app', provenance: [{ field: 'name', source: 'linkedin' }, { field: 'role', source: 'linkedin' }, { field: 'email', source: 'gmail' }] },
  { id: '3', name: 'Anna Lee', role: 'Design Systems', company: 'Airbnb', avatar: 'AL', source: 'LinkedIn', email: 'anna@airbnb.com', provenance: [{ field: 'name', source: 'linkedin' }, { field: 'role', source: 'linkedin' }, { field: 'company', source: 'linkedin' }] },
  { id: '4', name: 'Chris Kim', role: 'Creative Director', company: 'Apple', avatar: 'CK', source: 'LinkedIn', email: 'chris@apple.com', provenance: [{ field: 'name', source: 'linkedin' }, { field: 'email', source: 'gmail' }] },
  { id: '5', name: 'Sarah Chen', role: 'UX Engineer', company: 'Google', avatar: 'SC', source: 'Gmail', email: 'sarah@google.com', provenance: [{ field: 'name', source: 'gmail' }, { field: 'email', source: 'gmail' }, { field: 'role', source: 'linkedin' }] },
  { id: '6', name: 'David Miller', role: 'Design Manager', company: 'Meta', avatar: 'DM', source: 'Gmail', email: 'david@meta.com', provenance: [{ field: 'name', source: 'gmail' }, { field: 'email', source: 'gmail' }, { field: 'role', source: 'linkedin' }, { field: 'company', source: 'linkedin' }] },
  { id: '7', name: 'Elena Rodriguez', role: 'Senior Designer', company: 'Vercel', avatar: 'ER', source: 'LinkedIn', email: 'elena@vercel.com', provenance: [{ field: 'name', source: 'linkedin' }, { field: 'role', source: 'linkedin' }, { field: 'company', source: 'linkedin' }] },
  { id: '8', name: 'Tom Wilson', role: 'Founding Designer', company: 'Ramp', avatar: 'TW', source: 'LinkedIn', email: 'tom@ramp.com', provenance: [{ field: 'name', source: 'linkedin' }, { field: 'email', source: 'gmail' }] },
];

const CORAL_PRESET_QUERIES: CoralPresetQuery[] = [
  { label: 'All Contacts', sql: "SELECT name, email, role, company, 'linkedin' AS source FROM linkedin.connections UNION ALL SELECT name, NULL, NULL, NULL, 'google' AS source FROM google_people.contacts LIMIT 20", description: 'List contacts from all connected sources' },
  { label: 'Cross-Source Lookup', sql: "SELECT li.name, li.email, li.role, li.company, gp.name AS google_name FROM linkedin.connections li LEFT JOIN google_people.contacts gp ON LOWER(li.email) = LOWER(gp.email) WHERE li.email IS NOT NULL LIMIT 15", description: 'Find contacts present on LinkedIn with Gmail history' },
  { label: 'Recent Gmail Threads', sql: "SELECT subject, from_name, from_email, received_at FROM gmail.threads ORDER BY received_at DESC LIMIT 10", description: 'Latest email threads from Gmail' },
  { label: 'Outreach Prospects', sql: "SELECT name, email, role, company FROM linkedin.connections WHERE email IS NOT NULL AND email != '' ORDER BY name ASC LIMIT 10", description: 'Top prospects with email addresses' },
];

const INITIAL_SOURCES: DataSource[] = [
  { id: 'linkedin', name: 'LinkedIn', meta: '12.4k connections', active: true, configured: true, icon: 'linkedin' },
  { id: 'gmail', name: 'Gmail', meta: 'primary@studio.design', active: true, configured: true, icon: 'mail' },
  { id: 'instagram', name: 'Instagram', meta: '8.2k followers', active: false, configured: false, icon: 'instagram' },
  { id: 'twitter', name: 'Twitter', meta: 'Connect account', active: false, configured: false, icon: 'twitter' },
];

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: "Good afternoon. I'm connected to your LinkedIn and Gmail.\nWho are we targeting today?", timestamp: Date.now() },
  ]);
  const [input, setInput] = useState('');
  const [sources, setSources] = useState<DataSource[]>(INITIAL_SOURCES);
  const [isSearching, setIsSearching] = useState(false);
  const [thinkingStage, setThinkingStage] = useState<string | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [isConfiguringSource, setIsConfiguringSource] = useState<DataSource | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [coralMode, setCoralMode] = useState(false);
  const [coralQuery, setCoralQuery] = useState('');
  const [coralResults, setCoralResults] = useState<CoralQueryResult | null>(null);
  const [coralError, setCoralError] = useState<string | null>(null);
  const [coralLoading, setCoralLoading] = useState(false);
  const [coralAvailable, setCoralAvailable] = useState<boolean | null>(null);

  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [activeDraft, setActiveDraft] = useState<string | null>(null);

  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const kanban = useKanban();

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetch('/api/coral/check')
      .then((r) => r.json())
      .then((data) => setCoralAvailable(data.available))
      .catch(() => setCoralAvailable(false));
  }, []);

  const handleCoralQuery = useCallback(async () => {
    if (!coralQuery.trim() || coralLoading) return;
    setCoralLoading(true);
    setCoralError(null);
    setCoralResults(null);
    try {
      const response = await fetch('/api/coral/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: coralQuery }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.details || err.error || 'Query failed');
      }
      const data = await response.json();
      setCoralResults(data.result);
    } catch (error) {
      setCoralError(error instanceof Error ? error.message : String(error));
    } finally {
      setCoralLoading(false);
    }
  }, [coralQuery, coralLoading]);

  const handleCoralPreset = useCallback((preset: CoralPresetQuery) => {
    setCoralQuery(preset.sql);
    setCoralResults(null);
    setCoralError(null);
  }, []);

  const handleSendMessage = async (overrideInput?: string) => {
    const msg = overrideInput ?? input;
    if (!msg.trim() || isSearching) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: msg, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsSearching(true);

    const activeSources = sources.filter((s) => s.active).map((s) => s.name);
    const sourceNames = activeSources.length > 0 ? activeSources.join(' & ') : 'your sources';

    try {
      setThinkingStage('Thinking...');
      await new Promise((r) => setTimeout(r, 800));
      setThinkingStage(`Searching your contacts on ${sourceNames}...`);
      await new Promise((r) => setTimeout(r, 1200));
      setThinkingStage('Drafting outreach...');
      await new Promise((r) => setTimeout(r, 1000));

      const results = await searchContacts(msg, MOCK_CONTACTS);
      const contactsWithProvenance: ContactWithProvenance[] = results.map((c) => {
        const found = MOCK_CONTACTS.find((m) => m.id === c.id);
        return found || { ...c, provenance: [{ field: 'data', source: c.source.toLowerCase() }] };
      });
      kanban.addCards(contactsWithProvenance);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `I found **${results.length} potential candidates** matching your request.\nDrafting outreach now.`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (results.length > 0) {
        const firstCard = Object.values(kanban.cards).find((c) => c.contact.id === results[0].id);
        if (firstCard) {
          setSelectedCard(firstCard);
          const draft = await generateDraft(msg, firstCard.contact);
          setActiveDraft(draft);
          kanban.setCardDraft(firstCard.id, draft);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'ai', content: 'Sorry, I encountered an error while searching.', timestamp: Date.now() },
      ]);
    } finally {
      setIsSearching(false);
      setThinkingStage(null);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedCard || !activeDraft) return;
    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selectedCard.contact.email || 'recipient@example.com', subject: `Outreach to ${selectedCard.contact.name}`, body: activeDraft, source: selectedCard.contact.source }),
      });
      const result = await response.json();
      if (result.success) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: 'ai', content: `Email sent successfully to ${selectedCard.contact.name} via ${selectedCard.contact.source}.\n\n*${result.message || ''}*`, timestamp: Date.now() },
        ]);
        kanban.moveCard(selectedCard.id, 'sent');
        setSelectedCard(null);
        setActiveDraft(null);
      } else {
        throw new Error(result.error || 'Failed to send');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'ai', content: `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}.`, timestamp: Date.now() },
      ]);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCardClick = async (card: KanbanCard) => {
    setSelectedCard(card);
    if (!card.draft) {
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      const draft = await generateDraft(lastUserMsg?.content || 'General outreach', card.contact);
      setActiveDraft(draft);
      kanban.setCardDraft(card.id, draft);
    } else {
      setActiveDraft(card.draft);
    }
  };

  const handleConfigureSource = async (source: DataSource) => {
    setIsConnecting(true);
    try {
      const response = await fetch(`/api/auth/url?sourceId=${source.id}`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(url, 'oauth_popup', `width=${width},height=${height},left=${left},top=${top}`);
    } catch (error) {
      console.error('OAuth error:', error);
      setIsConnecting(false);
    }
  };

  const handleAddSource = async (sourceName: string) => {
    setIsConnecting(true);
    const sourceId = sourceName.toLowerCase();
    const newSource: DataSource = { id: sourceId, name: sourceName, meta: 'Awaiting connection', active: false, configured: false, icon: sourceId };
    if (!sources.find((s) => s.id === sourceId)) {
      setSources((prev) => [...prev, newSource]);
    }
    try {
      const response = await fetch(`/api/auth/url?sourceId=${sourceId}`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const authWindow = window.open(url, 'oauth_popup', `width=${width},height=${height},left=${left},top=${top}`);
      if (!authWindow) alert('Please allow popups to connect your account.');
      setIsAddSourceModalOpen(false);
    } catch (error) {
      console.error('OAuth error:', error);
      setIsConnecting(false);
    }
  };

  const toggleSource = (id: string) => {
    setSources((prev) => prev.map((s) => (s.id === id ? (s.configured ? { ...s, active: !s.active } : s) : s)));
  };

  const activeSources = sources.filter((s) => s.active);
  const handleInputChange = (val: string) => setInput(val);

  return (
    <div className="app-layout flex flex-col md:grid md:grid-cols-[260px_1fr_1px] h-screen w-full overflow-hidden font-sans relative">
      {/* Backdrop */}
      <AnimatePresence>
        {(isSettingsOpen || isAddSourceModalOpen || isConfiguringSource !== null || isLeftSidebarOpen || isRightSidebarOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setIsSettingsOpen(false); setIsAddSourceModalOpen(false); setIsConfiguringSource(null); setIsLeftSidebarOpen(false); setIsRightSidebarOpen(false); }}
            className="absolute inset-0 z-[100]"
          />
        )}
      </AnimatePresence>

      {/* Left Sidebar */}
      <div className={`fixed md:relative z-[110] md:z-auto w-[280px] md:w-auto transition-transform duration-300 ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <Sidebar
          sources={sources}
          theme={theme}
          isSettingsOpen={isSettingsOpen}
          onToggleSource={toggleSource}
          onConfigureSource={(s) => setIsConfiguringSource(s)}
          onAddSource={() => setIsAddSourceModalOpen(true)}
          onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          onCloseSettings={() => setIsSettingsOpen(false)}
        />
      </div>

      {/* Main Chat Panel */}
      <main className="bg-bg-deep p-0 flex flex-col border-r border-border overflow-hidden relative flex-1 min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-bg-panel shrink-0">
          <button onClick={() => setIsLeftSidebarOpen(true)} className="p-2 text-text-secondary hover:text-text-primary">
            <Settings className="w-5 h-5" />
          </button>
          <div className="logo font-pixel font-bold text-sm tracking-tighter flex items-center gap-2">
            <div className="logo-icon w-3 h-3 bg-text-primary [clip-path:polygon(0%_0%,100%_0%,100%_100%,0%_100%,0%_60%,40%_60%,40%_40%,0%_40%)]" />
            MailRite
          </div>
          <button onClick={() => setIsRightSidebarOpen(true)} className="p-2 text-text-secondary hover:text-text-primary">
            <Users className="w-5 h-5" />
          </button>
        </div>

        {/* Add Source Modal */}
        <AnimatePresence>
          {isAddSourceModalOpen && (
            <Modal open={isAddSourceModalOpen} onClose={() => setIsAddSourceModalOpen(false)} title="Connect New Source">
              <p className="text-sm text-text-secondary mb-4">Authenticate with your social accounts to transform your connections into quality contact lists.</p>
              <div className="grid grid-cols-2 gap-3">
                {['Facebook', 'Slack', 'Discord', 'HubSpot'].map((name) => (
                  <button
                    key={name}
                    onClick={() => handleAddSource(name)}
                    disabled={isConnecting}
                    className="flex items-center gap-3 p-3 bg-bg-panel border border-border rounded-xl hover:border-accent/40 hover:bg-bg-elevated transition-all active:scale-[0.97] text-sm font-medium disabled:opacity-50 disabled:active:scale-100"
                  >
                    <div className="w-8 h-8 bg-bg-surface rounded-lg flex items-center justify-center">
                      <Plus className="w-4 h-4 text-text-tertiary" />
                    </div>
                    {name}
                  </button>
                ))}
              </div>
              {isConnecting && (
                <div className="flex items-center justify-center gap-3 py-4 text-accent animate-pulse">
                  <Zap className="w-4 h-4 fill-accent" />
                  <span className="text-sm font-bold uppercase tracking-widest">Authenticating...</span>
                </div>
              )}
            </Modal>
          )}
        </AnimatePresence>

        {/* Config Modal */}
        <AnimatePresence>
          {isConfiguringSource && (
            <Modal open={isConfiguringSource !== null} onClose={() => setIsConfiguringSource(null)} title={`Configure ${isConfiguringSource.name}`}>
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-bg-panel border border-border rounded-xl">
                  <div className="w-12 h-12 bg-bg-surface rounded-full flex items-center justify-center border border-border">
                    <X className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Authorization Required</div>
                    <div className="text-xs text-text-secondary">Grant MailRite access to your {isConfiguringSource.name} data.</div>
                  </div>
                </div>
                <button
                  onClick={() => handleConfigureSource(isConfiguringSource)}
                  disabled={isConnecting}
                  className="w-full py-4 bg-accent text-bg-deep font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
                >
                  {isConnecting ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <Zap className="w-4 h-4 fill-bg-deep" />
                      </motion.div>
                      Verifying...
                    </>
                  ) : (
                    <>Connect {isConfiguringSource.name} Account</>
                  )}
                </button>
              </div>
            </Modal>
          )}
        </AnimatePresence>

        <ChatArea messages={messages} thinkingStage={thinkingStage} chatEndRef={chatEndRef} />
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={(msg) => handleSendMessage(msg)}
          disabled={isSearching}
          activeSources={activeSources}
        />
      </main>

      {/* Right Panel - Kanban Pipeline / Coral SQL */}
      <aside className={`bg-bg-panel flex flex-col h-full overflow-hidden fixed right-0 md:relative z-[110] md:z-auto transition-transform duration-300 w-[360px] md:w-[480px] ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        <div className="p-6 pb-4 shrink-0 border-b border-border">
          <div className="panel-header flex justify-between items-center min-h-[40px]">
            <div className="flex items-center gap-2">
              {selectedCard && !coralMode ? (
                <button
                  onClick={() => { setSelectedCard(null); setActiveDraft(null); }}
                  className="p-1 -ml-1 hover:bg-bg-surface rounded-md text-text-secondary hover:text-text-primary transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              ) : null}
              <div className="panel-title text-[11px] uppercase tracking-[0.2em] text-text-secondary font-bold">
                {coralMode ? 'Coral SQL' : selectedCard ? 'Contact Detail' : 'Pipeline'}
              </div>
            </div>
            {!selectedCard && !coralMode && (
              <div className="text-[10px] text-accent font-black bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                {Object.keys(kanban.cards).length} Cards
              </div>
            )}
          </div>
          <div className="flex gap-1 mt-3">
            <button
              onClick={() => { setCoralMode(false); setSelectedCard(null); }}
              className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-lg transition-all active:scale-[0.97] ${
                !coralMode ? 'bg-accent text-bg-deep' : 'bg-bg-surface text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
              }`}
            >
              <Users className="w-3 h-3 inline mr-1" />
              Pipeline
            </button>
            <button
              onClick={() => { setCoralMode(true); setSelectedCard(null); }}
              className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-lg transition-all active:scale-[0.97] ${
                coralMode ? 'bg-accent text-bg-deep' : 'bg-bg-surface text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
              }`}
            >
              <Terminal className="w-3 h-3 inline mr-1" />
              SQL
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-6">
          {coralMode ? (
            <CoralPanel
              available={coralAvailable}
              presets={CORAL_PRESET_QUERIES}
              query={coralQuery}
              onQueryChange={setCoralQuery}
              onRun={handleCoralQuery}
              onPresetSelect={handleCoralPreset}
              loading={coralLoading}
              error={coralError}
              results={coralResults}
            />
          ) : selectedCard ? (
            <div className="h-full overflow-y-auto space-y-6">
              <ContactDetail
                contact={selectedCard.contact}
                onBack={() => { setSelectedCard(null); setActiveDraft(null); }}
              />
              {activeDraft && (
                <DraftPreview
                  contact={selectedCard.contact}
                  draft={activeDraft}
                  isSending={isSendingEmail}
                  onSend={handleSendEmail}
                  onBack={() => { setSelectedCard(null); setActiveDraft(null); }}
                />
              )}
            </div>
          ) : (
            <div className="h-full">
              <KanbanBoard
                columns={kanban.columns}
                cards={kanban.cards}
                onMove={kanban.moveCard}
                onCardClick={handleCardClick}
                onAddColumn={kanban.addColumn}
                onRenameColumn={kanban.renameColumn}
                onRemoveColumn={kanban.removeColumn}
                getCardsForColumn={kanban.getCardsForColumn}
              />
            </div>
          )}
        </div>

        {!coralMode && !selectedCard && (
          <div className="p-6 pt-0 shrink-0 flex justify-end">
            <button className="p-3 bg-bg-surface border border-border rounded-full text-text-secondary hover:text-accent hover:border-accent/40 hover:bg-bg-elevated transition-all active:scale-[0.92] shadow-sm">
              <History className="w-5 h-5" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
