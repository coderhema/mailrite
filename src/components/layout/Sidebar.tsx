import { Settings } from 'lucide-react';
import SourceList from '../sidebar/SourceList';
import SettingsDropdown from '../shared/SettingsDropdown';
import type { DataSource } from '../../types';

interface SidebarProps {
  sources: DataSource[];
  theme: 'dark' | 'light';
  isSettingsOpen: boolean;
  onToggleSource: (id: string) => void;
  onConfigureSource: (source: DataSource) => void;
  onAddSource: () => void;
  onToggleSettings: () => void;
  onToggleTheme: () => void;
  onCloseSettings: () => void;
}

export default function Sidebar({
  sources,
  theme,
  isSettingsOpen,
  onToggleSource,
  onConfigureSource,
  onAddSource,
  onToggleSettings,
  onToggleTheme,
  onCloseSettings,
}: SidebarProps) {
  return (
    <aside className="bg-bg-panel border-r border-border flex flex-col h-full overflow-hidden">
      <div className="p-6 pb-0 shrink-0">
        <div className="panel-header flex justify-between items-center mb-8 min-h-[40px] shrink-0 relative">
          <div className="logo font-pixel font-bold text-lg tracking-tighter flex items-center gap-2">
            <div className="logo-icon w-4 h-4 bg-text-primary [clip-path:polygon(0%_0%,100%_0%,100%_100%,0%_100%,0%_60%,40%_60%,40%_40%,0%_40%)]" />
            MailRite
          </div>

          <div className="relative">
            <button
              onClick={onToggleSettings}
              className={`p-1.5 rounded-md hover:bg-bg-surface text-text-secondary transition-all active:scale-[0.92] z-[110] relative ${
                isSettingsOpen ? 'bg-bg-surface text-text-primary' : ''
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
            <SettingsDropdown open={isSettingsOpen} onClose={onCloseSettings} />
          </div>
        </div>

        <SourceList
          sources={sources}
          onToggle={onToggleSource}
          onConfigure={onConfigureSource}
          onAddSource={onAddSource}
        />
      </div>

      <div className="mt-auto p-6 pt-5 border-t border-border shrink-0">
        <div
          className="theme-switch flex items-center justify-between text-[11px] text-text-secondary cursor-pointer group"
          onClick={onToggleTheme}
        >
          <div className="flex items-center gap-3">
            <div className="theme-toggle-ui w-10 h-5 border border-text-secondary/40 rounded-xl relative flex items-center p-[2px] group-hover:border-text-secondary transition-colors">
              <div
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  theme === 'light'
                    ? 'bg-bg-deep shadow-[inset_2px_2px_0_var(--color-text-primary)] translate-x-5'
                    : 'bg-text-primary translate-x-0'
                }`}
              />
            </div>
            <span className="font-medium">Appearance</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
