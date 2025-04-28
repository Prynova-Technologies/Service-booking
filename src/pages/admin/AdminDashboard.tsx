import React, { useState, useEffect } from 'react';
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

  // Check if user is authenticated as admin
  useEffect(() => {
    if (!authService.isAdminUser()) {
      navigate('/admin/login');
    }
  }, [navigate]);

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
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
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

        <div className="border-b border-gray-200 mb-4 sticky top-16 bg-white z-5">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`${activeTab === 'services' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => handleTabChange('services')}
            >
              Services
            </button>
            <button
              className={`${activeTab === 'requests' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => handleTabChange('requests')}
            >
              Requests
            </button>
            <button
              className={`${activeTab === 'customers' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => handleTabChange('customers')}
            >
              Customers
            </button>
            <button
              className={`${activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => handleTabChange('users')}
            >
              Users
            </button>
            <button
              className={`${activeTab === 'receipts' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => handleTabChange('receipts')}
            >
              Receipts
            </button>
            <button
              className={`${activeTab === 'settings' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => handleTabChange('settings')}
            >
              Settings
            </button>
          </nav>
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