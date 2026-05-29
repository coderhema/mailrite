import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  Send, 
  Linkedin, 
  Mail, 
  Instagram, 
  Twitter, 
  Facebook,
  Slack,
  MessageSquare,
  Database,
  Moon, 
  Sun, 
  Search,
  Users,
  CheckCircle2,
  MoreVertical,
  Settings,
  Zap,
  History,
  Lock,
  Plus,
  LogOut,
  User,
  Shield,
  ExternalLink,
  X,
  ChevronLeft,
  Terminal,
  Play,
  Table,
  AlertCircle
} from 'lucide-react';
import { Contact, Message, DataSource, CoralQueryResult, CoralPresetQuery } from './types';
import { searchContacts, generateDraft } from './services/geminiService';

const MOCK_CONTACTS: Contact[] = [
  { id: '1', name: 'Julia Stiles', role: 'Head of Design', company: 'Stripe', avatar: 'JS', source: 'LinkedIn' },
  { id: '2', name: 'Marcus Reed', role: 'Product Design Lead', company: 'Linear', avatar: 'MR', source: 'LinkedIn' },
  { id: '3', name: 'Anna Lee', role: 'Design Systems', company: 'Airbnb', avatar: 'AL', source: 'LinkedIn' },
  { id: '4', name: 'Chris Kim', role: 'Creative Director', company: 'Apple', avatar: 'CK', source: 'LinkedIn' },
  { id: '5', name: 'Sarah Chen', role: 'UX Engineer', company: 'Google', avatar: 'SC', source: 'Gmail' },
  { id: '6', name: 'David Miller', role: 'Design Manager', company: 'Meta', avatar: 'DM', source: 'Gmail' },
  { id: '7', name: 'Elena Rodriguez', role: 'Senior Designer', company: 'Vercel', avatar: 'ER', source: 'LinkedIn' },
  { id: '8', name: 'Tom Wilson', role: 'Founding Designer', company: 'Ramp', avatar: 'TW', source: 'LinkedIn' },
];

const CORAL_PRESET_QUERIES: CoralPresetQuery[] = [
  {
    label: 'All Contacts',
    sql: "SELECT name, email, role, company, 'linkedin' AS source FROM linkedin.connections UNION ALL SELECT name, NULL, NULL, NULL, 'google' AS source FROM google_people.contacts LIMIT 20",
    description: 'List contacts from all connected sources',
  },
  {
    label: 'Cross-Source Lookup',
    sql: "SELECT li.name, li.email, li.role, li.company, gp.name AS google_name FROM linkedin.connections li LEFT JOIN google_people.contacts gp ON LOWER(li.email) = LOWER(gp.email) WHERE li.email IS NOT NULL LIMIT 15",
    description: 'Find contacts present on LinkedIn with Gmail history',
  },
  {
    label: 'Recent Gmail Threads',
    sql: "SELECT subject, from_name, from_email, received_at FROM gmail.threads ORDER BY received_at DESC LIMIT 10",
    description: 'Latest email threads from Gmail',
  },
  {
    label: 'Outreach Prospects',
    sql: "SELECT name, email, role, company FROM linkedin.connections WHERE email IS NOT NULL AND email != '' ORDER BY name ASC LIMIT 10",
    description: 'Top prospects with email addresses',
  },
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
    { id: '1', role: 'ai', content: "Good afternoon. I'm connected to your LinkedIn and Gmail.\nWho are we targeting today?", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [sources, setSources] = useState<DataSource[]>(INITIAL_SOURCES);
  const [identifiedContacts, setIdentifiedContacts] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeDraft, setActiveDraft] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [isConfiguringSource, setIsConfiguringSource] = useState<DataSource | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [thinkingStage, setThinkingStage] = useState<string | null>(null);

  const [coralMode, setCoralMode] = useState(false);
  const [coralQuery, setCoralQuery] = useState('');
  const [coralResults, setCoralResults] = useState<CoralQueryResult | null>(null);
  const [coralError, setCoralError] = useState<string | null>(null);
  const [coralLoading, setCoralLoading] = useState(false);
  const [coralAvailable, setCoralAvailable] = useState<boolean | null>(null);

  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const sourceId = event.data.sourceId;
        const source = sources.find(s => s.id === sourceId);
        if (source) {
          // Simulate final verification after OAuth success
          setIsConnecting(true);
          setTimeout(() => {
            setSources(prev => prev.map(s => s.id === sourceId ? { ...s, active: true, configured: true } : s));
            setIsConnecting(false);
            setIsConfiguringSource(null);
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'ai',
              content: `**${source.name}** has been successfully connected via OAuth and activated.`,
              timestamp: Date.now()
            }]);
          }, 1000);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sources]);

  useEffect(() => {
    fetch('/api/coral/check')
      .then(r => r.json())
      .then(data => setCoralAvailable(data.available))
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

  const handleSendMessage = async () => {
    if (!input.trim() || isSearching) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsSearching(true);

    const activeSources = sources.filter(s => s.active).map(s => s.name);
    const sourceNames = activeSources.length > 0 ? activeSources.join(' & ') : 'your sources';

    try {
      setThinkingStage('Thinking...');
      await new Promise(r => setTimeout(r, 800));
      
      setThinkingStage(`Searching your contacts on ${sourceNames}...`);
      await new Promise(r => setTimeout(r, 1200));

      setThinkingStage('Drafting outreach...');
      await new Promise(r => setTimeout(r, 1000));

      const results = await searchContacts(input, MOCK_CONTACTS);
      setIdentifiedContacts(results);

      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'ai', 
        content: `I found **${results.length} potential candidates** matching your request.\nDrafting outreach now.`, 
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, aiMsg]);

      if (results.length > 0) {
        setSelectedContact(results[0]);
        const draft = await generateDraft(input, results[0]);
        setActiveDraft(draft);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: "Sorry, I encountered an error while searching.", timestamp: Date.now() }]);
    } finally {
      setIsSearching(false);
      setThinkingStage(null);
    }
  };

  const getSourceIcon = (iconName: string) => {
    switch (iconName) {
      case 'linkedin': return <Linkedin className="w-3.5 h-3.5" />;
      case 'mail': return <Mail className="w-3.5 h-3.5" />;
      case 'instagram': return <Instagram className="w-3.5 h-3.5" />;
      case 'twitter': return <Twitter className="w-3.5 h-3.5" />;
      case 'facebook': return <Facebook className="w-3.5 h-3.5" />;
      case 'slack': return <Slack className="w-3.5 h-3.5" />;
      case 'discord': return <MessageSquare className="w-3.5 h-3.5" />;
      case 'hubspot': return <Database className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  const toggleSource = (id: string) => {
    setSources(prev => prev.map(s => {
      if (s.id === id) {
        if (!s.configured) return s;
        return { ...s, active: !s.active };
      }
      return s;
    }));
  };

  const handleContactClick = async (contact: Contact) => {
    setSelectedContact(contact);
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    const draft = await generateDraft(lastUserMsg?.content || "General outreach", contact);
    setActiveDraft(draft);
  };

  const handleAddSource = async (sourceName: string) => {
    setIsConnecting(true);
    const sourceId = sourceName.toLowerCase();
    
    // First add it to the list as unconfigured
    const newSource: DataSource = {
      id: sourceId,
      name: sourceName,
      meta: 'Awaiting connection',
      active: false,
      configured: false,
      icon: sourceId
    };
    
    if (!sources.find(s => s.id === sourceId)) {
      setSources(prev => [...prev, newSource]);
    }

    try {
      const response = await fetch(`/api/auth/url?sourceId=${sourceId}`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(
        url,
        'oauth_popup',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!authWindow) {
        alert('Please allow popups to connect your account.');
        setIsConnecting(false);
      }
      setIsAddSourceModalOpen(false);
    } catch (error) {
      console.error('OAuth error:', error);
      setIsConnecting(false);
      // If it's a custom source we don't know, we might just "simulate" success or show error
      alert(`Could not initiate real OAuth for ${sourceName}. Make sure it's a supported provider.`);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedContact || !activeDraft) return;

    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedContact.email || 'recipient@example.com', // Fallback for demo
          subject: `Outreach to ${selectedContact.name}`,
          body: activeDraft,
          source: selectedContact.source
        })
      });

      const result = await response.json();

      if (result.success) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'ai',
          content: `✅ **Email sent successfully** to ${selectedContact.name} via ${selectedContact.source}.\n\n*${result.message || ''}*`,
          timestamp: Date.now()
        }]);
        setActiveDraft(null);
        setSelectedContact(null);
      } else {
        throw new Error(result.error || 'Failed to send');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: `❌ **Failed to send email**: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your SMTP settings in the environment.`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleConfigureSource = async (source: DataSource) => {
    setIsConnecting(true);
    try {
      const response = await fetch(`/api/auth/url?sourceId=${source.id}`);
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();

      // Open OAuth popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(
        url,
        'oauth_popup',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!authWindow) {
        alert('Please allow popups to connect your account.');
        setIsConnecting(false);
      }
    } catch (error) {
      console.error('OAuth error:', error);
      setIsConnecting(false);
    }
  };

  return (
    <div className="app-layout flex flex-col md:grid md:grid-cols-[260px_1fr_340px] h-screen w-full overflow-hidden font-sans relative">
      {/* Settings Backdrop Blur & Mobile Sidebar Backdrop */}
      <AnimatePresence>
        {(isSettingsOpen || isAddSourceModalOpen || isLeftSidebarOpen || isRightSidebarOpen) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { 
              setIsSettingsOpen(false); 
              setIsAddSourceModalOpen(false); 
              setIsLeftSidebarOpen(false);
              setIsRightSidebarOpen(false);
            }}
            className="absolute inset-0 z-[100]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Data Sources */}
      <aside className={`panel bg-bg-panel border-r border-border flex flex-col h-full overflow-hidden fixed md:relative z-[110] md:z-auto transition-transform duration-300 w-[280px] md:w-auto ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 pb-0 shrink-0">
          <div className="panel-header flex justify-between items-center mb-8 min-h-[40px] shrink-0 relative">
            <div className="logo font-pixel font-bold text-lg tracking-tighter flex items-center gap-2">
              <div className="logo-icon w-4 h-4 bg-text-primary [clip-path:polygon(0%_0%,100%_0%,100%_100%,0%_100%,0%_60%,40%_60%,40%_40%,0%_40%)]"></div>
              MailRite
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`p-1.5 rounded-md hover:bg-bg-surface text-text-secondary transition-colors z-[110] relative ${isSettingsOpen ? 'bg-bg-surface text-text-primary' : ''}`}
              >
                <Settings className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {isSettingsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 md:left-auto md:right-0 mt-2 w-56 bg-bg-surface border border-border rounded-xl shadow-2xl z-[110] overflow-hidden p-1"
                  >
                    <div className="px-3 py-2 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Account</div>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-primary hover:bg-bg-panel rounded-lg transition-colors">
                      <User className="w-4 h-4" /> Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-primary hover:bg-bg-panel rounded-lg transition-colors">
                      <Shield className="w-4 h-4" /> Security
                    </button>
                    <div className="h-[1px] bg-border my-1" />
                    <div className="px-3 py-2 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">App</div>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-primary hover:bg-bg-panel rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4" /> API Keys
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="panel-title text-[11px] uppercase tracking-[0.2em] text-text-secondary font-bold mb-6 flex justify-between items-center">
            Data Sources
            <button 
              onClick={() => setIsAddSourceModalOpen(true)}
              className="p-1 hover:text-accent transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6 space-y-3 custom-scrollbar">
          {sources.map(source => (
            <div key={source.id} className="relative">
              <label 
                onClick={(e) => {
                  if (!source.configured) {
                    e.preventDefault();
                    setIsConfiguringSource(source);
                  }
                }}
                className={`source-card bg-bg-surface border border-border rounded-lg p-4 flex items-center justify-between transition-all cursor-pointer relative group z-20 ${source.active ? 'border-accent/40 bg-gradient-to-br from-bg-surface to-accent/5' : 'hover:border-text-secondary/40'}`}
              >
                <div className="source-info flex flex-col">
                  <div className="source-name text-[14px] font-semibold mb-0.5 flex items-center gap-2">
                    <span className="text-text-secondary">
                      {getSourceIcon(source.icon)}
                    </span>
                    {source.name}
                    {!source.configured && <Lock className="w-3 h-3 text-text-tertiary" />}
                  </div>
                  <div className="source-meta text-[10px] text-text-secondary tabular-nums tracking-wide">
                    {source.configured ? source.meta : 'Configure in settings'}
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={source.active} 
                  disabled={!source.configured}
                  onChange={() => toggleSource(source.id)} 
                />
                <div className={`toggle w-11 h-6.5 rounded-full relative transition-all duration-300 ease-in-out p-1 ${!source.configured ? 'opacity-40 cursor-not-allowed' : ''} ${source.active ? 'bg-[#34C759]' : 'bg-[#E9E9EA] dark:bg-[#39393D]'}`}>
                  <motion.div 
                    animate={{ x: source.active ? 18 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="w-4.5 h-4.5 bg-white rounded-full shadow-md"
                  />
                </div>
              </label>
              
              {/* Animated Connection Line */}
              <AnimatePresence>
                {source.active && (
                  <motion.div 
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                    style={{ originX: 0 }}
                    className="absolute -right-[26px] top-1/2 -translate-y-1/2 w-[26px] h-[1px] z-10 overflow-hidden"
                  >
                    <div className="w-full h-full connection-flow" />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-accent rounded-full shadow-[0_0_8px_#FF9F1C]" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="mt-auto p-6 pt-5 border-t border-border shrink-0">
          <div 
            className="theme-switch flex items-center justify-between text-[11px] text-text-secondary cursor-pointer group"
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
          >
            <div className="flex items-center gap-3">
              <div className="theme-toggle-ui w-10 h-5 border border-text-secondary/40 rounded-xl relative flex items-center p-[2px] group-hover:border-text-secondary transition-colors">
                <motion.div 
                  animate={{ x: theme === 'light' ? 20 : 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={`w-3.5 h-3.5 rounded-full transition-colors ${theme === 'light' ? 'bg-bg-deep shadow-[inset_2px_2px_0_var(--color-text-primary)]' : 'bg-text-primary'}`}
                />
              </div>
              <span className="font-medium">Appearance</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel - Chat */}
      <main className="panel center-panel bg-bg-deep p-0 flex flex-col border-r border-border overflow-hidden relative flex-1">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-bg-panel shrink-0">
          <button onClick={() => setIsLeftSidebarOpen(true)} className="p-2 text-text-secondary hover:text-text-primary">
            <Settings className="w-5 h-5" />
          </button>
          <div className="logo font-pixel font-bold text-sm tracking-tighter flex items-center gap-2">
            <div className="logo-icon w-3 h-3 bg-text-primary [clip-path:polygon(0%_0%,100%_0%,100%_100%,0%_100%,0%_60%,40%_60%,40%_40%,0%_40%)]"></div>
            MailRite
          </div>
          <button onClick={() => setIsRightSidebarOpen(true)} className="p-2 text-text-secondary hover:text-text-primary">
            <Users className="w-5 h-5" />
          </button>
        </div>
        {/* Add Source Modal */}
        <AnimatePresence>
          {isAddSourceModalOpen && (
            <div className="absolute inset-0 flex items-center justify-center z-[120] p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6 border-b border-border flex justify-between items-center">
                  <h3 className="text-lg font-bold">Connect New Source</h3>
                  <button onClick={() => setIsAddSourceModalOpen(false)} className="text-text-secondary hover:text-text-primary">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-text-secondary">Authenticate with your social accounts to transform your connections into quality contact lists.</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {['Facebook', 'Slack', 'Discord', 'HubSpot'].map(name => (
                      <button 
                        key={name}
                        onClick={() => handleAddSource(name)}
                        disabled={isConnecting}
                        className="flex items-center gap-3 p-3 bg-bg-panel border border-border rounded-xl hover:border-accent/40 transition-all text-sm font-medium disabled:opacity-50"
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
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Configuration Modal */}
        <AnimatePresence>
          {isConfiguringSource && (
            <div className="absolute inset-0 flex items-center justify-center z-[120] p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6 border-b border-border flex justify-between items-center">
                  <h3 className="text-lg font-bold">Configure {isConfiguringSource.name}</h3>
                  <button onClick={() => setIsConfiguringSource(null)} className="text-text-secondary hover:text-text-primary">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-bg-panel border border-border rounded-xl">
                    <div className="w-12 h-12 bg-bg-surface rounded-full flex items-center justify-center border border-border">
                      <Lock className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Authorization Required</div>
                      <div className="text-xs text-text-secondary">Grant MailRite access to your {isConfiguringSource.name} data.</div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleConfigureSource(isConfiguringSource)}
                    disabled={isConnecting}
                    className="w-full py-4 bg-accent text-bg-deep font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <>
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <Zap className="w-4 h-4 fill-bg-deep" />
                        </motion.div>
                        Verifying...
                      </>
                    ) : (
                      <>Connect {isConfiguringSource.name} Account</>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="chat-area flex-1 px-4 md:px-12 lg:px-20 py-8 md:py-12 overflow-y-auto flex flex-col gap-6 md:gap-10">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`message w-full flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`msg-bubble inline-block px-5 py-4 md:px-8 md:py-6 rounded-3xl text-[15px] md:text-[16px] leading-relaxed relative max-w-[90%] md:max-w-[540px] ${msg.role === 'user' ? 'bg-bg-surface border border-border text-text-primary rounded-tr-[4px]' : 'bg-bg-surface/30 border border-border/50 text-text-primary rounded-tl-[4px]'}`}>
                  {msg.role === 'ai' && (
                    <div className="text-[10px] text-accent mb-3 tracking-[0.2em] font-black uppercase flex items-center gap-2">
                      <Zap className="w-3 h-3 fill-accent" />
                      MailRite AI
                    </div>
                  )}
                  <div className="markdown-body">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
            {thinkingStage && (
              <motion.div 
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="message w-full flex justify-start"
              >
                <div className="msg-bubble inline-block px-5 py-4 md:px-8 md:py-6 rounded-3xl text-[15px] md:text-[16px] leading-relaxed relative max-w-[90%] md:max-w-[540px] bg-bg-surface/30 border border-border/50 text-text-primary rounded-tl-[4px]">
                  <div className="text-[10px] text-accent mb-3 tracking-[0.2em] font-black uppercase flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    >
                      <Zap className="w-3 h-3 fill-accent" />
                    </motion.div>
                    Thinking...
                  </div>
                  <div className="shimmer-text font-medium italic">
                    {thinkingStage}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>

        <div className="input-area px-4 md:px-12 lg:px-20 pb-6 md:pb-10 pt-4 bg-gradient-to-t from-bg-deep via-bg-deep/95 to-transparent relative shrink-0">
          <div className="mb-3.5 flex opacity-90 gap-2">
            {sources.filter(s => s.active).map(s => (
              <span key={s.id} className="tag-pill inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent/10 border border-accent/20 rounded-full text-[10px] text-accent font-bold uppercase tracking-wider">
                <span className="status-dot w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_#FF9F1C]"></span>
                {s.name}
              </span>
            ))}
          </div>

          <div className="input-container chat-shadow relative bg-bg-surface border border-border rounded-2xl p-4 flex gap-4 items-end transition-all">
            <textarea 
              placeholder="Ask MailRite..." 
              className="flex-1 bg-transparent border-none text-text-primary font-sans text-[15px] resize-none h-7 p-1 outline-none placeholder:text-text-tertiary font-medium"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <button 
              className={`send-btn w-9 h-9 bg-accent border-none rounded-lg cursor-pointer flex items-center justify-center relative -top-0.5 transition-all active:translate-y-[2px] active:shadow-none shadow-[0_4px_0_#c27800] ${isSearching ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110'}`}
              onClick={handleSendMessage}
              disabled={isSearching}
            >
              <Send className="w-4.5 h-4.5 text-black" />
            </button>
          </div>
        </div>
      </main>

      {/* Right Panel - Identified Contacts & Drafts */}
      <aside className={`panel bg-bg-panel flex flex-col h-full overflow-hidden fixed right-0 md:relative z-[110] md:z-auto transition-transform duration-300 w-[300px] md:w-auto ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        <div className="p-6 pb-4 shrink-0 border-b border-border">
          <div className="panel-header flex justify-between items-center min-h-[40px]">
            <div className="flex items-center gap-2">
              {selectedContact && !coralMode && (
                <button 
                  onClick={() => {
                    setSelectedContact(null);
                    setActiveDraft(null);
                  }}
                  className="p-1 -ml-1 hover:bg-bg-surface rounded-md text-text-secondary hover:text-text-primary transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <div className="panel-title text-[11px] uppercase tracking-[0.2em] text-text-secondary font-bold">
                {coralMode ? 'Coral SQL' : selectedContact ? 'Draft Preview' : 'Identified Contacts'}
              </div>
            </div>
            {!selectedContact && !coralMode && (
              <div className="text-[10px] text-accent font-black bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                {identifiedContacts.length || 0} Matches
              </div>
            )}
          </div>
          <div className="flex gap-1 mt-3">
            <button
              onClick={() => { setCoralMode(false); setSelectedContact(null); }}
              className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-lg transition-colors ${
                !coralMode ? 'bg-accent text-bg-deep' : 'bg-bg-surface text-text-secondary hover:text-text-primary'
              }`}
            >
              <Users className="w-3 h-3 inline mr-1" />
              Contacts
            </button>
            <button
              onClick={() => { setCoralMode(true); setSelectedContact(null); }}
              className={`flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-lg transition-colors ${
                coralMode ? 'bg-accent text-bg-deep' : 'bg-bg-surface text-text-secondary hover:text-text-primary'
              }`}
            >
              <Terminal className="w-3 h-3 inline mr-1" />
              SQL
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {coralMode ? (
            <motion.div
              key="coral"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {coralAvailable === false && (
                <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-text-secondary">
                    <span className="font-bold text-yellow-500">Coral CLI not found.</span>{' '}
                    Install it: <code className="text-accent">brew install withcoral/tap/coral</code>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Preset Queries</div>
                <div className="flex flex-wrap gap-1.5">
                  {CORAL_PRESET_QUERIES.map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => handleCoralPreset(preset)}
                      className="text-[10px] px-2.5 py-1.5 bg-bg-surface border border-border rounded-lg text-text-secondary hover:border-accent/40 hover:text-accent transition-colors font-medium"
                      title={preset.description}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">SQL Query</div>
                <textarea
                  value={coralQuery}
                  onChange={(e) => setCoralQuery(e.target.value)}
                  placeholder="SELECT name, email FROM linkedin.connections LIMIT 10"
                  className="w-full h-24 bg-bg-deep border border-border rounded-xl p-3 text-[12px] font-mono text-text-primary resize-none outline-none focus:border-accent/40 transition-colors placeholder:text-text-tertiary"
                  spellCheck={false}
                />
                <button
                  onClick={handleCoralQuery}
                  disabled={coralLoading || !coralQuery.trim()}
                  className="w-full py-2.5 bg-accent text-bg-deep font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-[12px]"
                >
                  {coralLoading ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                        <Zap className="w-3.5 h-3.5 fill-bg-deep" />
                      </motion.div>
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      Run Query
                    </>
                  )}
                </button>
              </div>

              {coralError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-[11px] text-red-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 inline mr-1.5" />
                  {coralError}
                </div>
              )}

              {coralResults && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest flex items-center gap-1.5">
                      <Table className="w-3 h-3" />
                      Results
                    </div>
                    <div className="text-[9px] text-text-tertiary font-medium">
                      {coralResults.rowCount} rows
                      {coralResults.executionTimeMs != null && ` · ${coralResults.executionTimeMs}ms`}
                    </div>
                  </div>
                  <div className="bg-bg-deep border border-border rounded-xl overflow-x-auto">
                    <table className="w-full text-[11px] font-mono">
                      <thead>
                        <tr className="border-b border-border">
                          {coralResults.columns.map(col => (
                            <th key={col} className="text-left p-2.5 text-accent font-bold uppercase tracking-wider whitespace-nowrap">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {coralResults.rows.length > 0 ? (
                          coralResults.rows.map((row, i) => (
                            <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-bg-surface/50">
                              {coralResults.columns.map(col => (
                                <td key={col} className="p-2.5 text-text-primary whitespace-nowrap truncate max-w-[120px]">
                                  {row[col] != null ? String(row[col]) : <span className="text-text-tertiary">NULL</span>}
                                </td>
                              ))}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={coralResults.columns.length} className="p-6 text-center text-text-tertiary text-[11px] font-medium">
                              No rows returned
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {!selectedContact ? (
                <motion.div 
                  key="list"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="preview-list flex flex-col gap-[1px] bg-border border border-border rounded-lg overflow-hidden"
                >
                  {identifiedContacts.length > 0 ? (
                    identifiedContacts.map(contact => (
                      <div 
                        key={contact.id} 
                        className="preview-item bg-bg-surface p-4 flex gap-3.5 items-center cursor-pointer hover:bg-bg-surface/80 transition-colors"
                        onClick={() => handleContactClick(contact)}
                      >
                        <div className="avatar w-9 h-9 bg-border rounded-full flex items-center justify-center text-[10px] text-text-secondary font-black uppercase tracking-tighter">
                          {contact.avatar}
                        </div>
                        <div className="preview-details flex flex-col">
                          <div className="preview-name text-[13px] font-bold tracking-tight">{contact.name}</div>
                          <div className="preview-role text-[10px] text-text-secondary font-medium uppercase tracking-wide">{contact.role} @ {contact.company}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-bg-surface p-10 text-center text-text-tertiary text-[11px] font-medium uppercase tracking-widest">
                      No contacts identified yet.
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="draft"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-4 p-4 bg-bg-surface border border-border rounded-xl">
                    <div className="avatar w-12 h-12 bg-border rounded-full flex items-center justify-center text-[12px] text-text-secondary font-black uppercase tracking-tighter shrink-0">
                      {selectedContact.avatar}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm font-bold truncate">{selectedContact.name}</div>
                      <div className="text-[10px] text-text-secondary font-medium uppercase truncate">{selectedContact.role} @ {selectedContact.company}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="panel-title text-[10px] uppercase tracking-[0.2em] text-text-tertiary font-bold">Email Draft</div>
                    <div className="text-[14px] text-text-primary leading-relaxed border-l-2 border-accent/30 pl-4 italic whitespace-pre-wrap font-medium bg-bg-surface/50 p-4 rounded-r-xl">
                      {activeDraft}
                    </div>
                  </div>

                  <button 
                    onClick={handleSendEmail}
                    disabled={isSendingEmail}
                    className="w-full py-4 bg-accent text-bg-deep font-bold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-accent/20"
                  >
                    {isSendingEmail ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <Zap className="w-4 h-4 fill-bg-deep" />
                        </motion.div>
                        Sending...
                      </>
                    ) : (
                      <>Send via {selectedContact.source}</>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {!coralMode && (
          <div className="p-6 pt-0 shrink-0 flex justify-end">
            <button className="p-3 bg-bg-surface border border-border rounded-full text-text-secondary hover:text-accent hover:border-accent/40 transition-all shadow-sm">
              <History className="w-5 h-5" />
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
