import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GitCompareIcon as CompareIcon, LogOutIcon, UserIcon, MenuIcon, XIcon, Settings, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Category {
  id: string;
  slug: string;
  name: string;
}

export function Layout() {
  const { user, signOut } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('product_categories')
        .select('id, slug, name')
        .order('name');
      
      if (data) {
        setCategories(data);
      }
    }

    fetchCategories();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUserInitial = () => {
    if (!user?.email) return '?';
    return user.email[0].toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut();
    setIsProfileOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-theme-950">
      <nav className="bg-theme-900 shadow-sm relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <CompareIcon className="h-8 w-8 text-theme-300" />
                <span className="ml-2 text-xl font-bold text-white">Comparaholic</span>
              </Link>
              
              {!isHomePage && (
                <div className="hidden md:ml-6 md:flex md:space-x-4">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/compare/${category.slug}`}
                      className={`inline-flex items-center px-2 py-1.5 text-xs font-medium rounded-md ${
                        location.pathname === `/compare/${category.slug}`
                          ? 'text-theme-300 bg-theme-800'
                          : 'text-theme-100 hover:text-theme-300 hover:bg-theme-800'
                      }`}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {isHomePage && (
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="p-2 rounded-md text-theme-100 hover:text-theme-300 hover:bg-theme-800"
                >
                  {isMenuOpen ? (
                    <XIcon className="h-6 w-6" />
                  ) : (
                    <MenuIcon className="h-6 w-6" />
                  )}
                </button>
              )}
              
              {user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 p-2 rounded-md hover:bg-theme-800"
                  >
                    <div className="w-8 h-8 rounded-full bg-theme-600 flex items-center justify-center text-white font-medium">
                      {getUserInitial()}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-theme-300 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-theme-800 rounded-md shadow-lg py-1">
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-theme-100 hover:bg-theme-700"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-theme-100 hover:bg-theme-700"
                      >
                        <LogOutIcon className="h-4 w-4 mr-2" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-theme-600 hover:bg-theme-700"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
          
          {/* Mobile navigation */}
          {!isHomePage && (
            <div className="md:hidden pb-3">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/compare/${category.slug}`}
                    className={`inline-flex items-center px-2 py-1.5 text-xs font-medium rounded-md ${
                      location.pathname === `/compare/${category.slug}`
                        ? 'text-theme-300 bg-theme-800'
                        : 'text-theme-100 hover:text-theme-300 hover:bg-theme-800'
                    }`}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Homepage dropdown menu */}
      {isHomePage && isMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}>
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="relative bg-theme-900 shadow-lg z-50">
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    to={`/compare/${category.slug}`}
                    className="flex items-center px-4 py-3 rounded-lg hover:bg-theme-800"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div>
                      <div className="font-medium text-white">{category.name}</div>
                      <div className="text-sm text-theme-300">Compare and find the best options</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}