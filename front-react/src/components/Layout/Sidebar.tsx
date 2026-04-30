import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, Tags, Settings, LogOut, Wallet, ChevronLeft, ChevronRight, BarChart3, PiggyBank, Repeat } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import ThemeToggle from './ThemeToggle';

const navItems = [
  { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: List },
  { path: '/wallets', label: 'Portefeuilles', icon: Wallet },
  { path: '/categories', label: 'Catégories', icon: Tags },
  { path: '/subscriptions', label: 'Charges', icon: Repeat },
  { path: '/analysis', label: 'Analyse', icon: BarChart3 },
  { path: '/savings', label: 'Épargne', icon: PiggyBank },
  { path: '/settings', label: 'Paramètres', icon: Settings },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const { isCollapsed, toggleSidebar, currentSlide, setCurrentSlide, isPaused, setIsPaused } = useSidebar();
  const location = useLocation();

  const slides = [
    {
      title: "Stash : Votre futur",
      text: "L'argent intelligent travaille pour vous. Chaque centime épargné aujourd'hui est une liberté demain.",
      icon: PiggyBank,
      gradient: "from-primary-600 to-indigo-700",
      shadow: "shadow-primary-600/20",
      link: "/savings",
      linkText: "Voir mes progrès"
    },
    {
      title: "Vision & Clarté",
      text: "Anticipez vos dépenses et analysez vos habitudes pour une croissance accélérée.",
      icon: BarChart3,
      gradient: "from-emerald-600 to-teal-700",
      shadow: "shadow-emerald-600/20",
      link: "/analysis",
      linkText: "Analyser mes flux"
    },
    {
      title: "Dépenses Récurrentes",
      text: "Gardez le contrôle sur vos abonnements et ne laissez plus les frais cachés grignoter votre réserve.",
      icon: Repeat,
      gradient: "from-orange-500 to-red-600",
      shadow: "shadow-orange-500/20",
      link: "/subscriptions",
      linkText: "Gérer mes charges"
    },
    {
      title: "Organisation Intelligente",
      text: "Classez vos dépenses par catégories pour savoir précisément où va chaque centime de votre Stash.",
      icon: Tags,
      gradient: "from-blue-500 to-cyan-600",
      shadow: "shadow-blue-500/20",
      link: "/categories",
      linkText: "Optimiser mes catégories"
    },
    {
      title: "Coffre-fort Stash",
      text: "Vos données sont chiffrées et vos économies sont en sécurité dans votre réserve personnelle.",
      icon: Wallet,
      gradient: "from-purple-600 to-violet-700",
      shadow: "shadow-purple-600/20",
      link: "/wallets",
      linkText: "Consulter mes coffres"
    }
  ];

  useEffect(() => {
    if (isCollapsed || isPaused) return;
    const timer = setInterval(() => {
      setCurrentSlide((currentSlide + 1) % slides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [isCollapsed, isPaused, slides.length, currentSlide, setCurrentSlide]);

  const handleManualNavigation = (index: number) => {
    setCurrentSlide(index);
    setIsPaused(true);
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'}  bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen sticky top-0 transition-all duration-300 `}>
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 max-h-[73px]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Stash</h1>
              <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest">Smart Money</p>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-primary-700 transition-colors z-10 cursor-pointer"
        title={isCollapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const ItemIcon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : undefined}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-lg transition-colors
                ${isCollapsed ? 'justify-center' : ''}
                ${isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }
              `}
            >
              <ItemIcon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>
      
      {/* Motivational / Promotion Carousel */}
      {!isCollapsed && (
        <div className="px-4 py-6 border-t border-gray-100 dark:border-gray-700">
          <div className={`relative overflow-hidden bg-gradient-to-br ${slide.gradient} rounded-2xl p-4 shadow-lg ${slide.shadow} group transition-all duration-500`}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex gap-1.5">
                  {slides.map((_, i) => (
                    <button 
                      key={i} 
                      onClick={(e) => {
                        e.preventDefault();
                        handleManualNavigation(i);
                      }}
                      className={`h-1.5 rounded-full transition-all duration-300 hover:scale-125 cursor-pointer ${i === currentSlide ? 'w-4 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'}`} 
                      title={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
              <h4 className="text-white font-bold text-sm mb-1">{slide.title}</h4>
              <p className="text-white/80 text-[10px] leading-relaxed h-[30px] line-clamp-2">
                {slide.text}
              </p>
              <NavLink 
                to={slide.link}
                onClick={() => setIsPaused(true)}
                className="mt-3 flex items-center gap-2 group-hover:translate-x-1 transition-transform cursor-pointer"
              >
                <span className="text-[10px] text-white font-bold uppercase tracking-wider">{slide.linkText}</span>
                <ChevronRight className="w-3 h-3 text-white" />
              </NavLink>
            </div>
            {/* Decorative background circle */}
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          </div>
        </div>
      )}

      {/* Footer Actions (Theme & Logout) */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-3 py-2 justify-between'} mb-1`}>
          <ThemeToggle />
        </div>
        <button
          onClick={logout}
          title={isCollapsed ? 'Déconnexion' : undefined}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
