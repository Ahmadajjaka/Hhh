import React from 'react';
import { Home, BookOpen, Clock, Heart, Radio, MoreHorizontal } from 'lucide-react';

interface BottomNavProps {
  activeScreen: string;
  setActiveScreen: (screen: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeScreen, setActiveScreen }) => {
  const navItems = [
    { id: 'home', title: 'الرئيسية', icon: Home },
    { id: 'quran', title: 'المصحف', icon: BookOpen },
    { id: 'recitations', title: 'التلاوات', icon: Radio },
    { id: 'prayer', title: 'الصلاة', icon: Clock },
    { id: 'adhkar', title: 'الأذكار', icon: Heart },
    { id: 'more', title: 'المزيد', icon: MoreHorizontal },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#031710]/95 backdrop-blur-lg border-t border-amber-500/20 px-2 py-1.5 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            activeScreen === item.id ||
            (item.id === 'adhkar' && activeScreen === 'duas_ruqyah');
          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? 'text-amber-400 font-bold'
                  : 'text-emerald-300/60 hover:text-emerald-100'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? 'bg-amber-500/20 -translate-y-0.5' : 'bg-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{item.title}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
