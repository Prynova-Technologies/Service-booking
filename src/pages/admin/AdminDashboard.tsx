import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import UsersManagement from './UsersManagement';
import ServicesManagement from './ServicesManagement';
import RequestsManagement from './RequestsManagement';
import CustomersManagement from './CustomersManagement';
import SettingsManagement from './SettingsManagement';
import ReceiptsManagement from './ReceiptsManagement';


type TabType = 'services' | 'requests' | 'customers' | 'users' | 'settings' | 'receipts';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('services');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const navRef = useRef<HTMLDivElement>(null);

  // Check if user is authenticated as admin
  useEffect(() => {
    if (!authService.isAdminUser()) {
      navigate('/admin/login');
    }
  }, [navigate]);

  // Handle scroll shadows for tab navigation
  useEffect(() => {
    const navElement = navRef.current?.querySelector('nav');
    const leftShadow = document.getElementById('left-shadow');
    const rightShadow = document.getElementById('right-shadow');
    
    if (!navElement || !leftShadow || !rightShadow) return;
    
    const handleScroll = () => {
      // Show left shadow if scrolled to the right
      if (navElement.scrollLeft > 10) {
        leftShadow.style.opacity = '1';
      } else {
        leftShadow.style.opacity = '0';
      }
      
      // Show right shadow if not scrolled all the way to the end
      const isAtEnd = navElement.scrollWidth - navElement.scrollLeft <= navElement.clientWidth + 10;
      rightShadow.style.opacity = isAtEnd ? '0' : '1';
    };
    
    // Initial check
    handleScroll();
    
    // Add scroll event listener
    navElement.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => {
      navElement.removeEventListener('scroll', handleScroll);
    };
  }, [activeTab]); // Re-run when active tab changes

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-indigo-700 text-white p-4 flex justify-between items-center sticky top-0 z-10">
      <img src="/logo-big.png" alt="BluePort Engineering" className="h-8 w-auto mr-2" />
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-indigo-800 hover:bg-indigo-900 rounded-md text-sm font-medium"
        >
          Logout
        </button>
      </div>

      <div className="flex-1 p-4">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="border-b border-gray-200 mb-4 sticky top-16 bg-white z-5 overflow-hidden">
          {/* Scrollable tabs container with visual indicators */}
          <div className="relative" ref={navRef}>
            {/* Left shadow indicator when scrolled */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none opacity-0 transition-opacity duration-300" id="left-shadow"></div>
            
            {/* Right shadow indicator */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none opacity-100 transition-opacity duration-300" id="right-shadow"></div>
            
            {/* Scrollable navigation */}
            <nav className="-mb-px flex space-x-8 overflow-x-auto scrollbar-hide py-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <button
                className={`${activeTab === 'services' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0`}
                onClick={() => handleTabChange('services')}
              >
                Services
              </button>
              <button
                className={`${activeTab === 'requests' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0`}
                onClick={() => handleTabChange('requests')}
              >
                Requests
              </button>
              <button
                className={`${activeTab === 'customers' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0`}
                onClick={() => handleTabChange('customers')}
              >
                Customers
              </button>
              <button
                className={`${activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0`}
                onClick={() => handleTabChange('users')}
              >
                Users
              </button>
              <button
                className={`${activeTab === 'receipts' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0`}
                onClick={() => handleTabChange('receipts')}
              >
                Receipts
              </button>
              <button
                className={`${activeTab === 'settings' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex-shrink-0`}
                onClick={() => handleTabChange('settings')}
              >
                Settings
              </button>
            </nav>
          </div>
        </div>

        <div className="transition-opacity duration-300 ease-in-out">
          {isLoading ? (
            <div className="text-center py-10">
              <div className="w-6 h-6 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Loading...</p>
            </div>
          ) : (
            <>
              {activeTab === 'services' && <ServicesManagement />}

              {activeTab === 'requests' && <RequestsManagement />}

              {activeTab === 'customers' && <CustomersManagement />}

              {activeTab === 'users' && <UsersManagement />}

              {activeTab === 'receipts' && <ReceiptsManagement />}

              {activeTab === 'settings' && <SettingsManagement />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;