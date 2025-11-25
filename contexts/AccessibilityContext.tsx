import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AccessibilityContextType {
  fontSize: number; // 1 = normal, 1.5 = large, 2 = extra large
  highContrast: boolean;
  setFontSize: (size: number) => void;
  toggleHighContrast: () => void;
  speakText: (text: string) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fontSize, setFontSize] = useState(1);
  const [highContrast, setHighContrast] = useState(false);

  const toggleHighContrast = () => setHighContrast(prev => !prev);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  return (
    <AccessibilityContext.Provider value={{ fontSize, highContrast, setFontSize, toggleHighContrast, speakText }}>
      <div style={{ fontSize: `${fontSize}rem` }} className={highContrast ? 'high-contrast min-h-screen' : 'bg-gray-50 min-h-screen text-slate-900'}>
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return context;
};