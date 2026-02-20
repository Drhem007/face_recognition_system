import React from 'react';
import { RiCloseLine, RiAlertLine } from 'react-icons/ri';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  deviceName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmationModal = ({ 
  isOpen, 
  deviceName, 
  onConfirm, 
  onCancel 
}: DeleteConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-[2px] bg-black/50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 flex items-center border-b border-gray-100 dark:border-gray-700">
          <div className="mr-3 bg-red-50 dark:bg-red-900/20 p-2 rounded-full">
            <RiAlertLine className="text-xl text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Confirm Deletion</h3>
          <button 
            onClick={onCancel}
            className="ml-auto text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
          >
            <RiCloseLine className="text-xl" />
          </button>
        </div>
        
        <div className="px-6 py-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete device &quot;<span className="font-semibold">{deviceName}</span>&quot;?
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This action cannot be undone.
          </p>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal; 