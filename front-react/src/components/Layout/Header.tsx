import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  title: string;
  actions?: React.ReactNode;
}

export default function Header({ title, actions }: HeaderProps) {
  const { user } = useAuth();
  
  const getInitials = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
        
        {user && (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-inner ring-2 ring-primary-500/20">
              {getInitials(user.name)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
