import React, { useState, useEffect } from 'react';
import requestService, { ServiceRequest } from '../../services/requestService';
import CancellationModal from '../../components/CancellationModal';
import CompletionModal from '../../components/CompletionModal';

const RequestsManagement: React.FC = () => {
  // State for requests list and loading status
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');


  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State for request modals
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  // Load requests on component mount
  useEffect(() => {
    fetchRequests();
    // Reset to first page when filter changes
    setCurrentPage(1);
  }, [statusFilter]);

  // Fetch requests from the service
  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters = statusFilter !== 'all' ? { status: statusFilter } : undefined;
      const fetchedRequests = await requestService.getRequests(filters);
      setRequests(fetchedRequests);
    } catch (err) {
      setError('Failed to load booking requests. Please try again.');
      console.error('Error fetching requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle updating a request status
  const handleUpdateStatus = async (requestId: string, newStatus: 'confirmed' | 'completed' | 'cancelled', cancellationReason?: string, completedPrice?: number, servicePersonnelName?: string) => {
    setIsLoading(true);
    try {
      if (newStatus === 'cancelled' && cancellationReason) {
        await requestService.updateRequestStatus(requestId, newStatus, cancellationReason);
      } else if (newStatus === 'completed') {
        // For completed status, we need the completed price and service personnel name
        await requestService.updateRequestStatus(requestId, newStatus, undefined, completedPrice, servicePersonnelName);
      } else {
        await requestService.updateRequestStatus(requestId, newStatus);
      }
      // Refresh request list
      await fetchRequests();
    } catch (err) {
      setError('Failed to update request status. Please try again.');
      console.error('Error updating request status:', err);
    } finally {
      setIsLoading(false);
      setIsCancellationModalOpen(false);
      setIsCompletionModalOpen(false);
    }
  };
  
  // Handle cancellation with reason
  const handleCancellation = (requestId: string) => {
    if (!requestId) return;
    
    // Find the request to be cancelled
    const requestToCancel = requests.find(req => req._id === requestId);
    if (requestToCancel) {
      setSelectedRequest(requestToCancel);
      setIsCancellationModalOpen(true);
    }
  };
  
  // Handle completion with final price and service personnel name
  const handleCompletion = (requestId: string) => {
    if (!requestId) return;
    
    // Find the request to be completed
    const requestToComplete = requests.find(req => req._id === requestId);
    if (requestToComplete) {
      setSelectedRequest(requestToComplete);
      setIsCompletionModalOpen(true);
    }
  };
  
  // Confirm completion with final price and service personnel name
  const confirmCompletion = (completedPrice: number, servicePersonnelName: string) => {
    if (selectedRequest) {
      handleUpdateStatus(selectedRequest._id, 'completed', undefined, completedPrice, servicePersonnelName);
    }
  };
  
  // Confirm cancellation with reason
  const confirmCancellation = (reason: string) => {
    if (selectedRequest) {
      handleUpdateStatus(selectedRequest._id, 'cancelled', reason);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge class based on status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Booking Requests</h2>
        <div className="flex space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={() => fetchRequests()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading && requests.length === 0 ? (
        <div className="text-center py-4">
          <div className="w-10 h-10 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading requests...</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {requests.length === 0 ? (
              <li className="px-6 py-4 text-center text-gray-500">
                No booking requests found.
              </li>
            ) : (
              // Apply pagination to the requests array
              requests
                .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                .map((request) => (
                <li key={request.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-indigo-600 truncate">
                          {request.service.name}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            {request.user.name}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            {request.user.email}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          <p>
                            {formatDate(request.date)} at {request.time}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-5 flex-shrink-0 flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsViewModalOpen(true);
                        }}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        View
                      </button>
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(request._id, 'confirmed')}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleCancellation(request._id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {request.status === 'confirmed' && (
                        <button
                          onClick={() => handleCompletion(request._id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
          
          {/* Pagination Controls */}
          {requests.length > 0 && (
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(requests.length / itemsPerPage)))}
                  disabled={currentPage >= Math.ceil(requests.length / itemsPerPage)}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{Math.min((currentPage - 1) * itemsPerPage + 1, requests.length)}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * itemsPerPage, requests.length)}</span> of{' '}
                    <span className="font-medium">{requests.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, Math.ceil(requests.length / itemsPerPage)) }, (_, i) => {
                      // Calculate page number to display (handle case when current page is near the end)
                      const totalPages = Math.ceil(requests.length / itemsPerPage);
                      let pageNum;
                      
                      if (totalPages <= 5) {
                        // If 5 or fewer pages, show all page numbers
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        // If near the start, show first 5 pages
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        // If near the end, show last 5 pages
                        pageNum = totalPages - 4 + i;
                      } else {
                        // Otherwise show current page and 2 pages on each side
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(requests.length / itemsPerPage)))}
                      disabled={currentPage >= Math.ceil(requests.length / itemsPerPage)}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancellation Modal */}
      <CancellationModal
        isOpen={isCancellationModalOpen}
        onClose={() => setIsCancellationModalOpen(false)}
        onConfirm={confirmCancellation}
        title="Cancel Booking Request"
      />
      
      {/* Completion Modal */}
      <CompletionModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        onConfirm={confirmCompletion}
        title="Complete Booking"
        initialPrice={selectedRequest?.startingPrice || 0}
      />
      
      {/* View Request Modal */}
      {isViewModalOpen && selectedRequest && (
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
                    Booking Request Details
                  </h3>
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Service</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedRequest.service.name}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedRequest.status)}`}>
                            {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                          </span>
                        </dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Customer</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedRequest.user.name}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedRequest.user.email}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Date</dt>
                        <dd className="mt-1 text-sm text-gray-900">{formatDate(selectedRequest.date)}</dd>
                      </div>
                      <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-500">Time</dt>
                        <dd className="mt-1 text-sm text-gray-900">{selectedRequest.time}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500">Price</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                          ${selectedRequest.completedPrice || selectedRequest.startingPrice}
                        </dd>
                      </div>
                      {selectedRequest.address && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Address</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedRequest.address}</dd>
                        </div>
                      )}
                      {selectedRequest.status === 'cancelled' && selectedRequest.cancellationReason && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Cancellation Reason</dt>
                          <dd className="mt-1 text-sm text-gray-900 p-2 bg-red-50 rounded-md">{selectedRequest.cancellationReason}</dd>
                        </div>
                      )}
                      {selectedRequest.notes && (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Notes</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedRequest.notes}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsManagement;