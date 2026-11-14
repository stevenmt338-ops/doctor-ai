import React, { useState } from 'react';
import { Globe, Menu, Moon, Sun, User, X, LogOut, LogIn } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { AppView, Language } from '../types/medical';
import { COPY } from '../services/i18n';

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onStartNewAssessment: () => void;
  user: FirebaseUser | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  darkMode,
  onToggleDark,
  currentView,
  onNavigate,
  onStartNewAssessment,
  user,
  onSignIn,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [utilityOpen, setUtilityOpen] = useState(false);
  const t = COPY[lang];

  const navItems: { view: AppView; label: string }[] = [
    { view: 'home', label: t.navHome },
    { view: 'consultation', label: t.navConsult },
    { view: 'reports', label: t.navReports },
    { view: 'profile', label: t.navProfile },
    { view: 'about', label: t.navAbout },
  ];

  const handleNavClick = (view: AppView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    setUtilityOpen(false);
  };

  return (
    <header className="no-print sticky top-0 z-40 bg-[#FAFBF9]/95 dark:bg-[#0D140F]/95 backdrop-blur-md border-b border-[#E3E8E1] dark:border-[#1E2B20]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="text-lg sm:text-xl font-bold tracking-tight text-[#1F3323] dark:text-[#E8EFE9] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#4B644A]"
        >
          {lang === 'ar' ? 'دكتور AI' : 'DOCTOR AI'}
        </button>

        {/* Zone 2: Clean Single-Line Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4A554C] dark:text-[#9DB09F]">
          {navItems.map((item) => {
            const active = currentView === item.view;
            return (
              <button
                key={item.view}
                type="button"
                onClick={() => handleNavClick(item.view)}
                className={`whitespace-nowrap shrink-0 py-1 transition-colors cursor-pointer ${
                  active
                    ? 'text-[#1F3323] dark:text-white underline underline-offset-8 decoration-2 decoration-[#4B644A]'
                    : 'hover:text-[#1F3323] dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action + Compact Settings Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => setUtilityOpen((prev) => !prev)}
              aria-label={lang === 'ar' ? 'الإعدادات والحساب' : 'Settings & Account'}
              className="h-10 px-2.5 flex items-center gap-2 rounded-lg border border-[#DCE3DA] dark:border-[#243427] text-[#3B483D] dark:text-[#C5D4C7] hover:bg-[#F0F4EE] dark:hover:bg-[#162218] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-medium max-w-[90px] truncate">
                {user
                  ? user.displayName?.split(' ')[0] || (lang === 'ar' ? 'حسابي' : 'Account')
                  : lang === 'ar'
                  ? 'الخيارات'
                  : 'Options'}
              </span>
            </button>

            {utilityOpen && (
              <div
                className={`absolute top-12 ${
                  lang === 'ar' ? 'left-0' : 'right-0'
                } w-64 bg-white dark:bg-[#131D15] border border-[#DCE3DA] dark:border-[#243427] rounded-xl shadow-lg p-3 space-y-2 z-50`}
              >
                {user ? (
                  <div className="px-2 py-2 border-b border-[#E5EAE3] dark:border-[#243427]">
                    <p className="text-xs font-semibold text-[#1F3323] dark:text-[#E8EFE9] truncate">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-[11px] text-[#607063] dark:text-[#8FA392] truncate">
                      {user.email}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityOpen(false);
                      onSignIn();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg bg-[#1F3323] text-white hover:bg-[#2C432F] transition-colors cursor-pointer"
                  >
                    <span>{lang === 'ar' ? 'تسجيل الدخول بحساب Google' : 'Sign in with Google'}</span>
                    <LogIn className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onToggleLang();
                    setUtilityOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-[#2E3A30] dark:text-[#D1DDD3] hover:bg-[#F3F6F1] dark:hover:bg-[#1C2A1F] transition-colors cursor-pointer"
                >
                  <span>{lang === 'ar' ? 'اللغة: العربية / English' : 'Language: English / العربية'}</span>
                  <Globe className="w-3.5 h-3.5 text-[#4B644A]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onToggleDark();
                    setUtilityOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-[#2E3A30] dark:text-[#D1DDD3] hover:bg-[#F3F6F1] dark:hover:bg-[#1C2A1F] transition-colors cursor-pointer"
                >
                  <span>{darkMode ? (lang === 'ar' ? 'الوضع النهاري' : 'Light Mode') : (lang === 'ar' ? 'الوضع الليلي' : 'Dark Mode')}</span>
                  {darkMode ? (
                    <Sun className="w-3.5 h-3.5 text-[#4B644A]" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-[#4B644A]" />
                  )}
                </button>

                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      setUtilityOpen(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  >
                    <span>{t.signOut}</span>
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onStartNewAssessment();
            }}
            className="h-10 px-4 text-xs sm:text-sm font-semibold text-white bg-[#1F3323] hover:bg-[#2C432F] dark:bg-[#4B644A] dark:hover:bg-[#5B7A5A] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {lang === 'ar' ? 'ابدأ التقييم' : 'Start Assessment'}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={lang === 'ar' ? 'القائمة' : 'Menu'}
            className="md:hidden h-10 w-10 flex items-center justify-center rounded-lg border border-[#DCE3DA] dark:border-[#243427] text-[#1F3323] dark:text-[#E8EFE9]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E3E8E1] dark:border-[#1E2B20] bg-white dark:bg-[#0D140F] px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.view}
              type="button"
              onClick={() => handleNavClick(item.view)}
              className={`w-full text-start px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === item.view
                  ? 'bg-[#EEF3EC] dark:bg-[#18261B] text-[#1F3323] dark:text-white'
                  : 'text-[#4A554C] dark:text-[#9DB09F]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
