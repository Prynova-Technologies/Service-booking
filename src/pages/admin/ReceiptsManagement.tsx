import React, { useState, useEffect } from 'react';
import { toast } from '../../utils/toastUtils';
import receiptService, { Receipt } from '../../services/receiptService';
import { format } from 'date-fns';

const ReceiptsManagement: React.FC = () => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await receiptService.getAllReceipts();
      setReceipts(data);
    } catch (err: any) {
      console.error('Error fetching receipts:', err);
      setError(err.message || 'Failed to load receipts');
      toast.error('Failed to load receipts');
    } finally {
      setIsLoading(false);
    }
  };

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

  const filteredReceipts = receipts.filter(receipt => {
    const searchLower = searchTerm.toLowerCase();
    return (
      receipt._id.toLowerCase().includes(searchLower) ||
      receipt.booking._id.toLowerCase().includes(searchLower) ||
      receipt.booking.user.name.toLowerCase().includes(searchLower) ||
      receipt.booking.user.email.toLowerCase().includes(searchLower) ||
      receipt.booking.service.name.toLowerCase().includes(searchLower) ||
      receipt.servicePersonnelName.toLowerCase().includes(searchLower) ||
      receipt.booking.status.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Receipts Management</h2>
      
      {/* Search and filter */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search receipts..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Error message */}
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

      {/* Loading state */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="w-6 h-6 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading receipts...</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Personnel</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReceipts.length > 0 ? (
                filteredReceipts.map((receipt) => (
                  <tr key={receipt._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{receipt._id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{receipt.booking._id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{receipt.booking.user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{receipt.booking.service.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(receipt.finalPrice)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{receipt.servicePersonnelName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${receipt.booking.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {receipt.booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(receipt.completionDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(receipt.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    {searchTerm ? 'No receipts found matching your search.' : 'No receipts found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReceiptsManagement;