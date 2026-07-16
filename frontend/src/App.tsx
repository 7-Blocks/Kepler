import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layouts/MainLayout';
import { LandingPage } from '@/pages/LandingPage';
import { Dashboard } from '@/pages/Dashboard';
import { SpaceTraffic } from '@/pages/SpaceTraffic';
import { Satellites } from '@/pages/Satellites';
import { Debris } from '@/pages/Debris';
import { CollisionCenter } from '@/pages/CollisionCenter';
import { AIAgents } from '@/pages/AIAgents';
import { MissionPlanner } from '@/pages/MissionPlanner';
import { Settings } from '@/pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
