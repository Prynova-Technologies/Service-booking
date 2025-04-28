import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface CompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (completedPrice: number, servicePersonnelName: string) => void;
  title?: string;
  initialPrice?: number;
}

const CompletionModal: React.FC<CompletionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Complete Booking',
  initialPrice = 0,
}) => {
  const [completedPrice, setCompletedPrice] = useState<number>(initialPrice);
  const { user } = useAuth();
  
  // Use the current admin's name as the service personnel name
  const servicePersonnelName = user?.name || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(completedPrice, servicePersonnelName);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <div className="mt-3 text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {title}
              </h3>
              <div className="mt-2">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="completedPrice" className="block text-sm font-medium text-gray-700 mb-1">
                      Final Price ($)
                    </label>
                    <input
                      type="number"
                      id="completedPrice"
                      value={completedPrice}
                      onChange={(e) => setCompletedPrice(parseFloat(e.target.value) || 0)}
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm shadow-sm"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="servicePersonnelName" className="block text-sm font-medium text-gray-700 mb-1">
                      Service Personnel Name
                    </label>
                    <input
                      type="text"
                      id="servicePersonnelName"
                      value={servicePersonnelName}
                      disabled
                      className="appearance-none relative block w-full px-3 py-2 border border-gray-300 bg-gray-50 text-gray-500 rounded-md focus:outline-none sm:text-sm shadow-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">This is your name as the admin completing this service.</p>
                  </div>
                  
                  <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Complete Booking
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompletionModal;