import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { MarketingLayout } from '@/components/layouts/MarketingLayout';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { LandingPage } from '@/pages/LandingPage';
import { AboutPage } from '@/pages/AboutPage';
import { ProductPage, SolutionsPage, DevelopersPage, DocsPage } from '@/pages/PlaceholderPage';
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

function App() {
  return (
    <BrowserRouter>
    <Toaster 
      toastOptions={toastOptions} 
      position="top-right" 
      offset={{ top: '4em', right: "16px", left: "16px" }} 
    />
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
