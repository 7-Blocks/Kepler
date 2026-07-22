import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ShortcutHelpModal } from '@/components/ShortcutHelpModal';
import { useUIStore } from '@/store/uiStore';
import { MainLayout } from '@/components/layouts/MainLayout';
import { MarketingLayout } from '@/components/layouts/MarketingLayout';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { LandingPage } from '@/pages/LandingPage';
import { AboutPage } from '@/pages/AboutPage';
import { ProductPage } from '@/pages/ProductPage';
import { SolutionsPage } from '@/pages/SolutionsPage';
import { DocsPage } from '@/pages/DocsPage';
import { DevelopersPage } from '@/pages/DevelopersPage';
import { Dashboard } from '@/pages/Dashboard';
import { SpaceTraffic } from '@/pages/SpaceTraffic';
import { Satellites } from '@/pages/Satellites';
import { Debris } from '@/pages/Debris';
import { CollisionCenter } from '@/pages/CollisionCenter';
import { AIAgents } from '@/pages/AIAgents';
import { MissionPlanner } from '@/pages/MissionPlanner';
import { Settings } from '@/pages/Settings';
import { Toaster } from 'sonner';
import { toastOptions } from './constants/toast';
import { NotFound } from '@/pages/NotFound';
import { Technologies } from './pages/Technologies';
import ButtonBackToTop from './components/ui/ButtonBackToTop';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';

// Lives inside BrowserRouter/QueryClientProvider so it can reach navigate(),
// the shared uiStore, and React Query's cache. Centralized here per issue #83
// so shortcuts don't get scattered across pages.
function GlobalShortcuts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toggleSidebar, setGlobalSearchOpen } = useUIStore();

  const { isHelpOpen, closeHelp, isMac } = useKeyboardShortcuts({
    // Navigation — routes that exist today. Telemetry / Space Weather /
    // Risk Assessment / Prediction Analytics have no page yet, so those
    // shortcuts are left unwired (safe no-ops) until those routes land.
    openGlobeView: () => navigate('/dashboard'),
    goToDashboard: () => navigate('/dashboard'),
    goHome: () => navigate('/dashboard'),
    openSatelliteManagement: () => navigate('/dashboard/satellites'),
    openCollisionPrediction: () => navigate('/dashboard/collision-center'),
    openAiAgentDashboard: () => navigate('/dashboard/ai-agents'),
    openManeuverPlanning: () => navigate('/dashboard/mission-planner'),

    // Search
    openGlobalSearch: () => setGlobalSearchOpen(true),

    // Data actions — generic refresh via React Query's cache.
    refreshCurrentData: () => queryClient.invalidateQueries(),
    forceRefreshAllData: () =>
      queryClient.invalidateQueries({ refetchType: 'all' }),

    // Dashboard controls
    toggleSidebar: () => toggleSidebar(),
  });

  return <ShortcutHelpModal isOpen={isHelpOpen} onClose={closeHelp} isMac={isMac} />;
}

function App() {
  return (
    <BrowserRouter>
    <Toaster 
      toastOptions={toastOptions} 
      position="top-right" 
      offset={{ top: '4em', right: "16px", left: "16px" }} 
    />
    <GlobalShortcuts />
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="tech" element={<Technologies />} />
          <Route path="/product" element={<ProductPage />} />
          <Route path="/solutions" element={<SolutionsPage />} />
          <Route path="/developers" element={<DevelopersPage />} />
          <Route path="/docs" element={<DocsPage />} />
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>
        <Route path="/dashboard" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="space-traffic" element={<SpaceTraffic />} />
          <Route path="satellites" element={<Satellites />} />
          <Route path="debris" element={<Debris />} />
          <Route path="collision-center" element={<CollisionCenter />} />
          <Route path="ai-agents" element={<AIAgents />} />
          <Route path="mission-planner" element={<MissionPlanner />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Legacy redirect routes */}
        <Route path="/space-traffic" element={<Navigate to="/dashboard/space-traffic" replace />} />
        <Route path="/satellites" element={<Navigate to="/dashboard/satellites" replace />} />
        <Route path="/debris" element={<Navigate to="/dashboard/debris" replace />} />
        <Route path="/collision-center" element={<Navigate to="/dashboard/collision-center" replace />} />
        <Route path="/ai-agents" element={<Navigate to="/dashboard/ai-agents" replace />} />
        <Route path="/mission-planner" element={<Navigate to="/dashboard/mission-planner" replace />} />
        <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ButtonBackToTop />
    </BrowserRouter>
  );
}

export default App;
