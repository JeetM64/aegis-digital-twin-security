import React, { Suspense, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './components/Login';
 
const Dashboard       = React.lazy(() => import('./components/Dashboard'));
const Assets          = React.lazy(() => import('./components/Assets'));
const Scans           = React.lazy(() => import('./components/Scans'));
const Vulnerabilities = React.lazy(() => import('./components/Vulnerabilities'));
const Reports         = React.lazy(() => import('./components/Reports'));
const Settings        = React.lazy(() => import('./components/Settings'));
const NetworkTopology = React.lazy(() => import('./components/NetworkTopology'));
 
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '100vh', background: '#0a1929', color: '#00e5ff', fontSize: 18,
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      Loading...
    </div>
  );
}
 
function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" replace />;
}
 
function LoginGuard({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <LoadingScreen />;
  return user ? <Navigate to="/dashboard" replace /> : children;
}
 
function NotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
      height: '100vh', background: '#0a1929', color: '#00e5ff',
    }}>
      <h1 style={{ margin: 0 }}>404</h1>
      <p style={{ marginTop: 8 }}>Page not found</p>
      <a href="/dashboard" style={{ color: '#00e5ff', marginTop: 12 }}>Go to dashboard</a>
    </div>
  );
}
 
function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
 
        <Route path="/login" element={
          <LoginGuard><Login /></LoginGuard>
        } />
 
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
 
        <Route path="/assets" element={
          <ProtectedRoute><Assets /></ProtectedRoute>
        } />
 
        <Route path="/scans" element={
          <ProtectedRoute><Scans /></ProtectedRoute>
        } />
 
        <Route path="/vulnerabilities" element={
          <ProtectedRoute><Vulnerabilities /></ProtectedRoute>
        } />
 
        <Route path="/reports" element={
          <ProtectedRoute><Reports /></ProtectedRoute>
        } />
 
        <Route path="/settings" element={
          <ProtectedRoute><Settings /></ProtectedRoute>
        } />
 
        <Route path="/topology" element={
          <ProtectedRoute><NetworkTopology /></ProtectedRoute>
        } />
 
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFound />} />
 
      </Routes>
    </Suspense>
  );
}
 
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}