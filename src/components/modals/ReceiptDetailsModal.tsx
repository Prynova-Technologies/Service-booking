import React from 'react';
import { Receipt } from '../../services/receiptService';
import { format } from 'date-fns';

interface ReceiptDetailsModalProps {
  receipt: Receipt | null;
  onClose: () => void;
  isOpen: boolean;
}

const ReceiptDetailsModal: React.FC<ReceiptDetailsModalProps> = ({ receipt, onClose, isOpen }) => {
  if (!isOpen || !receipt) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Receipt Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Receipt ID</h3>
                <p className="mt-1 text-base font-medium text-gray-900">{receipt._id}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Booking ID</h3>
                <p className="mt-1 text-base font-medium text-gray-900">{receipt.booking._id}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Customer</h3>
                <p className="mt-1 text-base font-medium text-gray-900">{receipt.booking.user.name}</p>
                <p className="text-sm text-gray-500">{receipt.booking.user.email}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Service</h3>
                <p className="mt-1 text-base font-medium text-gray-900">{receipt.booking.service.name}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Final Price</h3>
                <p className="mt-1 text-xl font-bold text-indigo-600">{formatCurrency(receipt.finalPrice)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Service Personnel</h3>
                <p className="mt-1 text-base font-medium text-gray-900">{receipt.servicePersonnelName}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${receipt.booking.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {receipt.booking.status}
                </span>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Completion Date</h3>
                <p className="mt-1 text-base font-medium text-gray-900">{formatDate(receipt.completionDate)}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                <p className="mt-1 text-base font-medium text-gray-900">{formatDate(receipt.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Notes section - uncomment if notes field is added to Receipt interface
          {receipt.notes && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500">Notes</h3>
              <p className="mt-1 text-base text-gray-900">{receipt.notes}</p>
            </div>
          )}
          */}

          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptDetailsModal;