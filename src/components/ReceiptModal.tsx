import React from 'react';
import Modal from './Modal';

interface Receipt {
  finalPrice: number;
  servicePersonnelName: string;
  completionDate: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: Receipt | null;
  serviceName: string;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
  serviceName
}) => {
  if (!receipt) return null;

  // Format the date to a more readable format
  const formattedDate = new Date(receipt.completionDate).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receipt Information">
      <div className="p-4">
        <div className="mb-6 text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{serviceName}</h3>
          <p className="text-sm text-gray-500">Service Completed on {formattedDate}</p>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <p className="text-sm text-gray-500">Service Personnel</p>
              <p className="text-lg font-medium text-gray-900">{receipt.servicePersonnelName}</p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-sm text-gray-500">Completion Date</p>
              <p className="text-lg font-medium text-gray-900">{formattedDate}</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-base font-medium text-gray-900">Final Price</span>
            <span className="text-xl font-bold text-green-600">${receipt.finalPrice.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReceiptModal;