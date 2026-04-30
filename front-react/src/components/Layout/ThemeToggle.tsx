import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useSidebar } from '../../context/SidebarContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { isCollapsed } = useSidebar();

  const isDark = theme === 'dark';

  return (
    <div 
      onClick={toggleTheme}
      className={`
        relative p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl cursor-pointer transition-all duration-300
        ${isCollapsed ? 'w-10 h-10 flex items-center justify-center' : 'w-full flex items-center'}
      `}
    >
      {/* Sliding Background (only when expanded) */}
      {!isCollapsed && (
        <div 
          className={`
            absolute inset-y-1 w-[calc(50%-4px)] bg-white dark:bg-gray-600 rounded-lg shadow-sm transition-transform duration-300 ease-in-out
            ${isDark ? 'translate-x-[calc(100%+0px)]' : 'translate-x-[0px]'}
          `}
        />
      )}

      {/* Light Option */}
      <div 
        className={`
          flex-1 flex items-center justify-center gap-2 py-1.5 z-10 transition-colors duration-300
          ${isCollapsed ? (isDark ? 'hidden' : 'block') : (isDark ? 'text-gray-500' : 'text-primary-600 font-medium')}
        `}
      >
        <Sun className="w-4 h-4" />
        {!isCollapsed && <span className="text-sm">Clair</span>}
      </div>

      {/* Dark Option */}
      <div 
        className={`
          flex-1 flex items-center justify-center gap-2 py-1.5 z-10 transition-colors duration-300
          ${isCollapsed ? (isDark ? 'block' : 'hidden') : (isDark ? 'text-white font-medium' : 'text-gray-500')}
        `}
      >
        <Moon className="w-4 h-4" />
        {!isCollapsed && <span className="text-sm">Sombre</span>}
      </div>
    </div>
  );
}
