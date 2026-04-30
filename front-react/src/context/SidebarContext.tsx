import { createContext, useContext, useState, type ReactNode } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  currentSlide: number;
  setCurrentSlide: (index: number) => void;
  isPaused: boolean;
  setIsPaused: (paused: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem('sidebarCollapsed', String(newValue));
      return newValue;
    });
  };

  return (
    <SidebarContext.Provider value={{ 
      isCollapsed, 
      toggleSidebar, 
      currentSlide, 
      setCurrentSlide, 
      isPaused, 
      setIsPaused 
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
