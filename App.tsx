import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { VoterDashboard } from './pages/VoterDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { User, UserRole } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <AccessibilityProvider>
      <Navbar user={user} onLogout={handleLogout} />
      <main className="transition-all duration-200 ease-in-out">
        {!user ? (
          <Login onLogin={handleLogin} />
        ) : (
          user.role === UserRole.ADMIN ? (
            <AdminDashboard />
          ) : (
            <VoterDashboard user={user} />
          )
        )}
      </main>
    </AccessibilityProvider>
  );
}

export default App;