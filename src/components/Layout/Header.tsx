import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bars3Icon, XMarkIcon, WrenchIcon, CalendarDaysIcon, ArrowRightOnRectangleIcon, UserIcon } from '@heroicons/react/24/outline';
import NotificationCenter from '../NotificationCenter';
import notificationService, { Notification } from '../../services/notificationService';
import authService from '../../services/authService';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Load saved notifications when component mounts
    notificationService.loadNotifications();
    
    // Request notification permission
    const requestPermission = async () => {
      await notificationService.checkNotificationPermission();
    };
    
    requestPermission();
    
    // Check authentication status
    setIsAuthenticated(authService.isAuthenticated());
    
    // Set up an event listener to update authentication status when it changes
    const handleAuthChange = () => {
      setIsAuthenticated(authService.isAuthenticated());
    };
    
    // Listen for storage events (for logout in other tabs)
    window.addEventListener('storage', handleAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <img src="/logo-big.png" alt="BluePort Engineering" className="h-8 w-auto mr-2" />
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
            <Link to="/services" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium">
              Services
            </Link>
            {isAuthenticated && (
              <Link to="/bookings" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium">
                My Bookings
              </Link>
            )}
            {!isAuthenticated ? (
              <Link to="/login" className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium">
                Login
              </Link>
            ) : (
              <button 
                onClick={() => {
                  authService.logout();
                  setIsAuthenticated(false);
                  navigate('/');
                }}
                className="text-gray-700 hover:text-indigo-600 px-3 py-2 text-sm font-medium"
              >
                Logout
              </button>
            )}
            <div className="ml-3">
              <NotificationCenter 
                onNotificationClick={(notification) => {
                  // Navigate to the related content when notification is clicked
                  if (notification.type === 'booking_status' && notification.relatedId) {
                    navigate(`/bookings/${notification.relatedId}`);
                  }
                }}
              />
            </div>
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <div className="mr-3">
              <NotificationCenter 
                onNotificationClick={(notification) => {
                  // Navigate to the related content when notification is clicked
                  if (notification.type === 'booking_status' && notification.relatedId) {
                    navigate(`/bookings/${notification.relatedId}`);
                  }
                }}
              />
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="absolute right-4 mt-1 w-48 bg-white rounded-md shadow-lg z-10">
            <Link
              to="/services"
              className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-600"
            >
              <WrenchIcon className="h-5 w-5 mr-2 text-indigo-500" />
              Services
            </Link>
            {isAuthenticated && (
              <Link
                to="/bookings"
                className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-600"
              >
                <CalendarDaysIcon className="h-5 w-5 mr-2 text-indigo-500" />
                My Bookings
              </Link>
            )}
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-600"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 text-indigo-500" />
                Login
              </Link>
            ) : (
              <button
                onClick={() => {
                  authService.logout();
                  setIsAuthenticated(false);
                  navigate('/');
                  setIsMenuOpen(false);
                }}
                className="flex items-center px-4 py-2 hover:bg-gray-100 text-sm font-medium text-gray-600 w-full text-left"
              >
                <UserIcon className="h-5 w-5 mr-2 text-indigo-500" />
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;