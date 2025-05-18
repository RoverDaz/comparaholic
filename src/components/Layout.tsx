import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../contexts/CategoryContext';
import { GitCompareIcon as CompareIcon, LogOutIcon, UserIcon, MenuIcon, XIcon, Settings, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Layout() {
  const { user, signOut } = useAuth();
  const { categories, isLoading: isCategoriesLoading, error: categoriesError } = useCategories();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);
  const isHomePage = location.pathname === '/';

  // Check admin status when user changes
  useEffect(() => {
    let isMounted = true;

    async function checkAdminStatus() {
      if (!user) {
        if (isMounted) {
          setIsAdmin(false);
          setIsCheckingAdmin(false);
        }
        return;
      }

      try {
        const { data: adminStatus, error } = await supabase.rpc('is_admin');
        
        if (error) {
          console.error('Error checking admin status:', error);
          if (isMounted) {
            setIsAdmin(false);
          }
        } else if (isMounted) {
          console.log('Admin status:', adminStatus);
          setIsAdmin(adminStatus);
        }
      } catch (err) {
        console.error('Error in admin check:', err);
        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setIsCheckingAdmin(false);
        }
      }
    }

    checkAdminStatus();

    return () => {
      isMounted = false;
    };
  }, [user]);

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
    if (!user) return '?';
    const name = user.user_metadata?.full_name;
    if (name) return name[0].toUpperCase();
    if (user.email) return user.email[0].toUpperCase();
    return '?';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
    }
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
              
              {/* Always show categories in navigation */}
              <div className="hidden md:ml-6 md:flex md:space-x-4">
                {!isCategoriesLoading && categories.map((category) => (
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
            
            <div className="flex items-center space-x-4">
              {isAdmin && (
                <Link
                  to="/admin"
                  className={`inline-flex items-center px-2 py-1.5 text-xs font-medium rounded-md ${
                    location.pathname === '/admin'
                      ? 'text-theme-300 bg-theme-800'
                      : 'text-theme-100 hover:text-theme-300 hover:bg-theme-800'
                  }`}
                >
                  Admin
                </Link>
              )}

              {user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 text-theme-100 hover:text-theme-300"
                  >
                    <div className="w-8 h-8 rounded-full bg-theme-800 flex items-center justify-center">
                      <span className="text-sm font-medium">{getUserInitial()}</span>
                    </div>
                    <ChevronDown className="h-4 w-4" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-theme-800 ring-1 ring-black ring-opacity-5">
                      <div className="py-1">
                        <Link
                          to="/settings"
                          className="flex items-center px-4 py-2 text-sm text-theme-100 hover:bg-theme-700"
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
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/auth"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-theme-100 bg-theme-800 hover:bg-theme-700"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isCategoriesLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-300"></div>
          </div>
        ) : categoriesError ? (
          <div className="text-center text-theme-300">{categoriesError}</div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}