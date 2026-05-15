import React, { useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { onAuthChange } from './services/firebase.js';
import { getProfile } from './services/api.js';
import useAppStore from './store/useAppStore.js';
import { initLenis } from './lib/lenis.js';
import { TokenProvider } from './providers/TokenProvider.jsx';
import { ToastProvider } from './components/ui/Toast.jsx';
import { isAdminEmail } from './utils/adminCheck.js';

// Lazy-load all pages for code splitting
const SplashPage      = lazy(() => import('./pages/SplashPage.jsx'));
const OnboardingPage  = lazy(() => import('./pages/OnboardingPage.jsx'));
const SetupPage       = lazy(() => import('./pages/SetupPage.jsx'));
const HomePage        = lazy(() => import('./pages/HomePage.jsx'));
const ScanPage        = lazy(() => import('./pages/ScanPage.jsx'));
const ResultsPage     = lazy(() => import('./pages/ResultsPage.jsx'));
const ComparisonPage  = lazy(() => import('./pages/ComparisonPage.jsx'));
const HistoryPage     = lazy(() => import('./pages/HistoryPage.jsx'));
const ChatPage        = lazy(() => import('./pages/ChatPage.jsx'));
const ProfilePage     = lazy(() => import('./pages/ProfilePage.jsx'));
const RiskPage        = lazy(() => import('./pages/RiskPage.jsx'));
const BudgetPage      = lazy(() => import('./pages/BudgetPage.jsx'));
const PlatePage       = lazy(() => import('./pages/PlatePage.jsx'));
const SupplementPage  = lazy(() => import('./pages/SupplementPage.jsx'));
const AnalyticsPage   = lazy(() => import('./pages/AnalyticsPage.jsx'));
const GroceryPage     = lazy(() => import('./pages/GroceryPage.jsx'));
const RestaurantPage  = lazy(() => import('./pages/RestaurantPage.jsx'));
const FakeDetectPage  = lazy(() => import('./pages/FakeDetectPage.jsx'));
const CommunityPage   = lazy(() => import('./pages/CommunityPage.jsx'));

// Admin pages
const AdminLayout     = lazy(() => import('./pages/admin/AdminLayout.jsx'));
const AdminDashboard  = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const AdminUsers      = lazy(() => import('./pages/admin/AdminUsers.jsx'));
const AdminModeration = lazy(() => import('./pages/admin/AdminModeration.jsx'));

// ── Loading fallback ──────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
    }}>
      <Loader2 size={28} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );
}

// ── Protected route — redirects to /onboarding if not authenticated ───────────
function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAppStore();

  if (authLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/onboarding" replace />;
  return children;
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const { setUser, setProfile, setAuthLoading } = useAppStore();

  // Initialize Lenis smooth scrolling
  useEffect(() => {
    const unsubscribeLenis = initLenis();
    return unsubscribeLenis;
  }, []);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid:         firebaseUser.uid,
          email:       firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL:    firebaseUser.photoURL,
        });
        // Load profile from backend
        try {
          const data = await getProfile();
          if (data.profile) setProfile(data.profile);
        } catch {
          // Profile not found yet — user will set it up
        }
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <TokenProvider>
      <ToastProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          {/* Public routes */}
          <Route path="/"            element={<SplashPage />} />
          <Route path="/onboarding"  element={<OnboardingPage />} />
          <Route path="/setup"       element={<SetupPage />} />

          {/* Protected routes */}
          <Route path="/home"       element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/scan"       element={<ProtectedRoute><ScanPage /></ProtectedRoute>} />
          <Route path="/results"    element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
          <Route path="/compare"    element={<ProtectedRoute><ComparisonPage /></ProtectedRoute>} />
          <Route path="/history"    element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/chat"       element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/profile"    element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/risk"       element={<ProtectedRoute><RiskPage /></ProtectedRoute>} />
          <Route path="/budget"     element={<ProtectedRoute><BudgetPage /></ProtectedRoute>} />
          <Route path="/plate"      element={<ProtectedRoute><PlatePage /></ProtectedRoute>} />
          <Route path="/supplement" element={<ProtectedRoute><SupplementPage /></ProtectedRoute>} />
          <Route path="/grocery"    element={<ProtectedRoute><GroceryPage /></ProtectedRoute>} />
          <Route path="/restaurant" element={<ProtectedRoute><RestaurantPage /></ProtectedRoute>} />
          <Route path="/fake"       element={<ProtectedRoute><FakeDetectPage /></ProtectedRoute>} />
          <Route path="/community"  element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
          <Route path="/analytics"  element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AdminLayout><AdminUsers /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/moderation" element={<ProtectedRoute><AdminLayout><AdminModeration /></AdminLayout></ProtectedRoute>} />
        </Routes>
        </Suspense>
      </ToastProvider>
    </TokenProvider>
  );
}
