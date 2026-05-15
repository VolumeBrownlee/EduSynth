import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import AppShell from './components/edusynth/AppShell';
import ProtectedRoute from './components/ProtectedRoute';

// Public pages
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <Router>
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* All authenticated views are handled inside AppShell via Zustand state */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/*" element={<AppShell />} />
                </Route>
              </Routes>
            </Router>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
