import React, { useState } from 'react';
import Modal from './Modal';

interface CancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title?: string;
}

const CancellationModal: React.FC<CancellationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Cancel Booking'
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }
    
    onConfirm(reason);
    setReason(''); // Reset the reason after confirmation
    setError('');
  };

  const handleClose = () => {
    setReason(''); // Reset the reason when closing
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title}>
      <div className="p-4">
        <p className="mb-4 text-gray-600">
          Please provide a reason for cancelling this booking. This reason will be shared with the customer.
        </p>
        
        {error && (
          <div className="mb-4 text-sm text-red-600">
            {error}
          </div>
        )}
        
        <div className="mb-4">
          <label htmlFor="cancellation-reason" className="block text-sm font-medium text-gray-700 mb-1">
            Cancellation Reason
          </label>
          <textarea
            id="cancellation-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter reason for cancellation"
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Confirm Cancellation
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CancellationModal;