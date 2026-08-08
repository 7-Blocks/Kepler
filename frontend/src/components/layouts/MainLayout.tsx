import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MaterialIcon } from '@/components/MaterialIcon';
import { useUIStore } from '@/store/uiStore';
import { DynamicBackground } from '@/components/DynamicBackground/DynamicBackground';
import { LogbookPanel } from '@/components/Logbook/LogbookPanel';
import { useLogbookStore, logEvent } from '@/store/logbookStore';
import { NotificationCenter } from '@/components/ui/NotificationCenter';

/** Ensures the mission-init System log fires once per browser tab session. */
let hasLoggedMissionInit = false;

export const MainLayout: React.FC = () => {
  const {
    sidebarCollapsed,
    rightDrawerOpen,
    isFlybyHistoryOpen,
    toggleSidebar,
    toggleRightDrawer,
    toggleFlybyHistory
  } = useUIStore();

  const location = useLocation();
  const [utcTime, setUtcTime] = useState<string>('00:00:00 UTC');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);


  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${h}:${m}:${s} UTC`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Close mobile sidebar on route change
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { name: 'Space Traffic', path: '/dashboard/space-traffic', icon: 'language' },
    { name: 'Space Weather', path: '/dashboard/space-weather', icon: 'wb_sunny' },
    { name: 'Satellites', path: '/dashboard/satellites', icon: 'satellite_alt' },
    { name: 'Debris', path: '/dashboard/debris', icon: 'delete_sweep' },
    { name: 'Collision Center', path: '/dashboard/collision-center', icon: 'warning' },
    { name: 'AI Agents', path: '/dashboard/ai-agents', icon: 'smart_toy' },
    { name: 'Mission Planner', path: '/dashboard/mission-planner', icon: 'event_note' },
    { name: 'Settings', path: '/dashboard/settings', icon: 'settings' }
  ];


  const [activeDrawerTab, setActiveDrawerTab] = useState<'STREAM' | 'STATUS' | 'LOGS'>('STREAM');
  const [assistantInput, setAssistantInput] = useState('');
  const [tleSearch, setTleSearch] = useState('');

  const logbookEntryCount = useLogbookStore((s) => s.entries.length);
  const lastViewedLogCountRef = useRef(0);
  const [unreadLogCount, setUnreadLogCount] = useState(0);
  const isViewingLogs = rightDrawerOpen && activeDrawerTab === 'LOGS';

  // Record a System event once, when mission control first comes online.
  // Module-scope guard (not a ref) so it survives React StrictMode's
  // double-invoke in dev *and* Vite HMR module reloads — a component-local
  // ref resets on remount, but this only resets on a genuine full page load.
  useEffect(() => {
    if (hasLoggedMissionInit) return;
    hasLoggedMissionInit = true;
    logEvent('SYSTEM', 'LOW', 'Mission control interface initialized', 'Dashboard shell mounted and ready.');
  }, []);

  // Sync the unread badge to the logbook store (an external system) as new
  // entries arrive or the Logs tab is opened; see the identical, pre-existing
  // pattern in EarthTwin.tsx for setState-in-effect used this way.
  useEffect(() => {
    if (isViewingLogs) {
      lastViewedLogCountRef.current = logbookEntryCount;
    }
    setUnreadLogCount(isViewingLogs ? 0 : Math.max(0, logbookEntryCount - lastViewedLogCountRef.current));
  }, [isViewingLogs, logbookEntryCount]);

  const handleSendQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantInput.trim()) return;

    logEvent('MISSION', 'LOW', 'Command received', assistantInput.trim(), { SOURCE: 'AI Assistant' });
    setAssistantInput('');
  };

  const handleTleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const q = tleSearch.trim();
    if (!q) return;
    logEvent('SEARCH', 'LOW', 'Command search executed', `Query: "${q}"`);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden font-body-ui text-on-surface select-none">
      {/* Dynamic animated background */}
      <DynamicBackground />

      {/* Scanline CRT overlay filter */}
      <div className="scanlines" />

      {/* Main Container */}
      <div className="flex w-full h-full relative">

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Left Navigation Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 flex flex-col h-full backdrop-blur-xl bg-bg-deep-space/70 border-r border-border-panel/60 transition-ui z-50 md:relative ${
            mobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
          } ${!mobileSidebarOpen && sidebarCollapsed ? 'md:w-20' : 'md:w-64'}`}
        >
          {/* Logo & Header */}
          <div className="px-6 py-5 flex items-center justify-between">
            <div className={`${!mobileSidebarOpen && sidebarCollapsed ? 'hidden' : 'block'}`}>
              <h1 className="font-display-lg text-headline-lg font-bold tracking-tighter text-primary-container drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]">
                KEPLER
              </h1>
              <p className="font-label-caps text-[9px] sm:text-label-caps text-primary-fixed-dim opacity-70 mt-1">
                AI STRATEGIC COMMAND
              </p>
            </div>

            {/* Collapse toggle (desktop) / Close toggle (mobile) */}
            <button
              onClick={() => {
                if (window.innerWidth < 768) {
                  setMobileSidebarOpen(false);
                } else {
                  toggleSidebar();
                }
              }}
              className="p-1.5 rounded border border-border-panel hover:bg-surface-variant/50 transition-ui text-primary-container"
            >
              <MaterialIcon name={!mobileSidebarOpen && sidebarCollapsed ? 'chevron_right' : 'chevron_left'} className="text-sm" />
            </button>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center px-3 py-3 min-h-[44px] transition-ui group border-r-2 ${isActive
                    ? 'text-primary-container bg-primary-fixed-dim/10 border-primary-container'
                    : 'text-on-surface-variant hover:text-primary hover:bg-surface-variant/40 border-transparent'
                  }`
                }
              >
                <MaterialIcon
                  name={item.icon}
                  className={`mr-4 transition-ui ${location.pathname === item.path ? 'text-primary-container drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]' : 'text-on-surface-variant group-hover:text-primary'
                    }`}
                />
                {(mobileSidebarOpen || !sidebarCollapsed) && (
                  <span className="font-technical-data text-technical-data font-medium transition-ui">
                    {item.name}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Footer User Profile Section */}
          <div className="p-4 border-t border-border-panel/60 bg-bg-deep-space/40 mt-auto">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded shrink-0 bg-primary-container/20 flex items-center justify-center border border-primary-container/40">
                <MaterialIcon name="account_circle" className="text-primary-container text-lg" />
              </div>
              {(mobileSidebarOpen || !sidebarCollapsed) && (
                <div className="ml-3 animate-fade-in min-w-0">
                  <p className="text-xs font-bold text-on-surface font-technical-data uppercase truncate">M. CONTROL</p>
                  <p className="text-[10px] text-primary-container/60 font-technical-data truncate">LVL 5 CLEARANCE</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Center / Right Content Panel */}
        <div className="flex-1 flex flex-col h-full min-w-0 relative">

          {/* Top Command Bar */}
          <header className="h-12 backdrop-blur-xl bg-bg-deep-space/70 border-b border-border-panel/60 flex justify-between items-center px-4 md:px-6 w-full sticky top-0 z-30">
            {/* Command Search & Mobile Toggle */}
            <div className="flex items-center gap-2 sm:gap-4 flex-1">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="md:hidden p-1 text-primary hover:text-primary-container transition-ui cursor-pointer mr-2 shrink-0"
              >
                <MaterialIcon name="menu" className="text-xl" />
              </button>
              
              <div className="relative flex items-center w-full max-w-[120px] sm:max-w-[256px]">
                <MaterialIcon name="search" className="absolute left-2 text-primary/50 text-sm" />
                <input
                  type="text"
                  value={tleSearch}
                  onChange={(e) => setTleSearch(e.target.value)}
                  onKeyDown={handleTleSearchSubmit}
                  placeholder="ID / TLE SEARCH"
                  className="bg-surface-container-low w-full border-b border-primary/30 text-primary font-technical-data text-[12px] pl-8 pr-2 sm:pr-16 py-1 focus:outline-none focus:border-primary-container transition-ui placeholder:text-primary/30"
                />
                <span className="hidden sm:block absolute right-2 text-[9px] text-primary/40 font-mono">CMD+K</span>
              </div>
            </div>

            {/* Diagnostics & Right Tray Toggles */}
            <div className="flex items-center space-x-3 sm:space-x-6 ml-4 shrink-0">
              <div className="hidden sm:flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-status-success shadow-[0_0_8px_#34C759] animate-pulse"></span>
                <span className="font-technical-data text-[11px] text-status-success uppercase font-semibold">
                  Systems Nominal
                </span>
              </div>
              <div className="text-primary/45 font-technical-data text-[10px] sm:text-[11px] hidden sm:block">
                {utcTime}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={toggleRightDrawer}
                  className={`relative transition-ui cursor-pointer p-2 min-w-[44px] min-h-[44px] flex items-center justify-center ${rightDrawerOpen ? 'text-primary-container drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]' : 'text-primary hover:text-primary-fixed'}`}
                >
                  <MaterialIcon name="monitor_heart" />
                  {unreadLogCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-status-emergency text-white text-[8px] font-bold font-technical-data flex items-center justify-center leading-none">
                      {unreadLogCount > 99 ? '99+' : unreadLogCount}
                    </span>
                  )}
                </button>
                <button 
                  onClick={toggleFlybyHistory}
                  className={`relative transition-ui cursor-pointer p-2 min-w-[44px] min-h-[44px] flex items-center justify-center ${isFlybyHistoryOpen ? 'text-primary-container drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]' : 'text-primary hover:text-primary-fixed'}`}
                >
                  <MaterialIcon name="radar" />
                </button>
                <button className="text-primary hover:text-primary-fixed cursor-pointer transition-ui p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <MaterialIcon name="account_circle" />
                </button>
              </div>
            </div>
          </header>

          {/* Main workspace frame */}
          <div className="flex-1 flex overflow-hidden relative">
            <main className="flex-1 overflow-y-auto custom-scrollbar relative">
              <Outlet />
            </main>

            {/* Right Drawer (AI Assistant) */}
            <AnimatePresence>
              {rightDrawerOpen && (
                <motion.aside
                  initial={{ x: '100%', opacity: 0.8 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100%', opacity: 0.8 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="w-full sm:w-80 h-full backdrop-blur-xl bg-surface-container-lowest/80 border-l border-border-panel/60 flex flex-col z-35 shadow-[-10px_0_30px_rgba(0,0,0,0.8)] absolute right-0 top-0 sm:relative"
                >
                  {/* Assistant Header */}
                  <div className="p-6 border-b border-border-panel flex justify-between items-center">
                    <div>
                      <h3 className="font-label-caps text-primary-container text-label-caps uppercase font-bold tracking-wider drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
                        AI ASSISTANT
                      </h3>
                      <p className="text-[10px] text-primary/60 font-technical-data">
                        LIVE TELEMETRY & FEEDBACK
                      </p>
                    </div>
                    <button
                      onClick={toggleRightDrawer}
                      className="text-on-surface-variant hover:text-primary transition-ui"
                    >
                      <MaterialIcon name="close" />
                    </button>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-border-panel">
                    {(['STREAM', 'STATUS', 'LOGS'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveDrawerTab(tab)}
                        className={`flex-1 py-3 text-[10px] font-label-caps font-bold transition-ui flex flex-col items-center gap-1 border-b ${activeDrawerTab === tab
                            ? 'text-primary-container border-primary-container'
                            : 'text-on-surface-variant hover:bg-surface-container-high/40 border-transparent'
                          }`}
                      >
                        <MaterialIcon
                          name={tab === 'STREAM' ? 'psychology' : tab === 'STATUS' ? 'memory' : 'list_alt'}
                          className="text-sm"
                        />
                        <span>{tab}</span>
                      </button>
                    ))}
                  </div>

                  {/* Tab Contents */}
                  <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
                    {activeDrawerTab === 'STREAM' && (
                      <>
                        {/* Agent status display card */}
                        <div className="bg-surface-container p-3 border border-border-panel relative glass-panel">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-1.5 h-1.5 bg-primary-container rounded-full glow-cyan animate-pulse"></span>
                            <span className="text-[10px] font-bold text-primary-container font-technical-data">
                              AGENT ALPHA
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed font-technical-data">
                            Orbital probability mapping is complete for sector 7G. New conjunction threat window detected in 4.2 hours.
                          </p>
                          <div className="mt-3 flex gap-2">
                            <button className="bg-primary-container/20 border border-primary-container text-primary-container text-[10px] px-2.5 py-1 hover:bg-primary-container hover:text-bg-deep-space transition-ui font-technical-data">
                              DISMISS
                            </button>
                            <button className="bg-primary-container text-bg-deep-space text-[10px] px-2.5 py-1 font-bold font-technical-data hover:bg-primary-fixed-dim transition-ui">
                              VIEW DETAILS
                            </button>
                          </div>
                        </div>

                        {/* Critical warning alerts */}
                        <div className="bg-status-emergency/10 border border-status-emergency/30 p-3 relative glass-panel">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-1.5 h-1.5 bg-status-emergency rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-bold text-status-emergency uppercase font-technical-data">
                              Urgent Directive
                            </span>
                          </div>
                          <p className="text-xs text-on-surface-variant leading-relaxed font-technical-data">
                            Object ID: 29012 is diverging from its registered orbit. AI Agent suggests immediate re-tasking of Ground Radar Alpha.
                          </p>
                        </div>
                      </>
                    )}

                    {activeDrawerTab === 'STATUS' && (
                      <div className="space-y-4">
                        <div className="border-b border-border-panel pb-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] text-muted font-technical-data">CPU NEURAL LOAD</span>
                            <span className="text-[10px] text-primary font-technical-data font-bold">74%</span>
                          </div>
                          <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                            <div className="bg-primary-container h-full glow-cyan" style={{ width: '74%' }} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-surface-container p-2.5 border border-border-panel text-center">
                            <p className="text-[9px] text-on-surface-variant font-label-caps">GPU TEMPERATURE</p>
                            <p className="text-sm font-bold text-primary-container font-technical-data mt-1">42°C</p>
                          </div>
                          <div className="bg-surface-container p-2.5 border border-border-panel text-center">
                            <p className="text-[9px] text-on-surface-variant font-label-caps">NETWORK LATENCY</p>
                            <p className="text-sm font-bold text-status-success font-technical-data mt-1">14ms</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeDrawerTab === 'LOGS' && <LogbookPanel />}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendQuery} className="p-4 bg-bg-deep-space/50 backdrop-blur-sm border-t border-border-panel/60">
                    <div className="relative">
                      <input
                        type="text"
                        value={assistantInput}
                        onChange={(e) => setAssistantInput(e.target.value)}
                        placeholder="ASK AI COMMAND..."
                        className="w-full bg-surface-container-low border border-border-panel text-[11px] font-technical-data px-3 py-3 focus:outline-none focus:border-primary-container transition-ui pr-10"
                      />
                      <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-container hover:text-primary transition-ui">
                        <MaterialIcon name="send" className="text-lg" />
                      </button>
                    </div>
                  </form>

                </motion.aside>
              )}
            </AnimatePresence>
          </div>

        </div>

        <NotificationCenter />
      </div>
    </div>
  );
};
export default MainLayout;
