import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { FlashQuiz } from "./pages/FlashQuiz";
import { Login } from "./pages/Login";
import { ManagerDashboard } from "./pages/ManagerDashboard";
import { PixelCover } from "./pages/PixelCover";
import { Register } from "./pages/Register";
import { Rolengamos } from "./pages/Rolengamos";

import { SpeedLyrics } from "./pages/SpeedLyrics";
import { OnlineArena } from "./pages/OnlineArena";

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-center text-slate-400">Chargement…</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function ManagerOnly({ children }: { children: React.ReactNode }) {
  const { user, loading, isManager } = useAuth();
  if (loading) return null;
  if (!user || !isManager) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading, isManager } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <img src="./logo-tempo.jfif" alt="" className="h-20 w-20 animate-pulse rounded-full" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={isManager ? "/manager" : "/arena"} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route
        path="/manager"
        element={
          <ManagerOnly>
            <Layout>
              <ManagerDashboard />
            </Layout>
          </ManagerOnly>
        }
      />
      <Route
        path="/*"
        element={
          <Protected>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/arena" element={<Dashboard />} />
                <Route path="/online" element={<OnlineArena />} />
                <Route path="/flashquiz" element={<FlashQuiz />} />
                <Route path="/rolengamos" element={<Rolengamos />} />
                <Route path="/pixelcover" element={<PixelCover />} />
                <Route path="/sample-hunter" element={<Navigate to="/flashquiz" replace />} />
                <Route path="/speed-lyrics" element={<SpeedLyrics />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Protected>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}