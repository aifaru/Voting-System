import React from 'react';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { User, UserRole } from '../types';
import { LogOut, User as UserIcon, Settings, Eye, Type } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const { fontSize, setFontSize, toggleHighContrast, highContrast } = useAccessibility();

  return (
    <nav className="bg-brand-900 text-white p-4 sticky top-0 z-50 shadow-md">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Logo / Brand */}
        <div className="flex items-center gap-2">
           <div className="bg-white text-brand-900 p-2 rounded-full font-bold text-xl h-10 w-10 flex items-center justify-center">
             V
           </div>
           <span className="text-xl font-bold tracking-wide">VoteSecure</span>
        </div>

        {/* Accessibility Controls */}
        <div className="flex items-center bg-brand-800 rounded-lg p-1 gap-2 border border-brand-700">
           <button 
             onClick={() => toggleHighContrast()}
             className={`p-2 rounded hover:bg-brand-700 transition ${highContrast ? 'bg-yellow-400 text-black font-bold' : ''}`}
             aria-label="Toggle High Contrast"
             title="High Contrast Mode"
           >
             <Eye size={20} />
           </button>
           <div className="h-6 w-px bg-brand-600 mx-1"></div>
           <button 
             onClick={() => setFontSize(1)}
             className={`p-2 rounded hover:bg-brand-700 transition ${fontSize === 1 ? 'bg-brand-600' : ''}`}
             aria-label="Normal Font Size"
           >
             <Type size={16} />
           </button>
           <button 
             onClick={() => setFontSize(1.25)}
             className={`p-2 rounded hover:bg-brand-700 transition ${fontSize === 1.25 ? 'bg-brand-600' : ''}`}
             aria-label="Large Font Size"
           >
             <Type size={20} />
           </button>
           <button 
             onClick={() => setFontSize(1.5)}
             className={`p-2 rounded hover:bg-brand-700 transition ${fontSize === 1.5 ? 'bg-brand-600' : ''}`}
             aria-label="Extra Large Font Size"
           >
             <Type size={24} />
           </button>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="flex items-center gap-2">
                <UserIcon size={20} />
                <span className="font-semibold hidden sm:inline">{user.name} ({user.role})</span>
              </div>
              <button 
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center gap-2 transition"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <span className="text-sm opacity-80">Please Login</span>
          )}
        </div>
      </div>
    </nav>
  );
};