import { useState, useEffect, useCallback } from 'react';
import { Device, ExamTiming } from '../types';
import { toast } from 'react-hot-toast';
import { useDeviceContext } from '../context/DeviceContext';
import ConfigureModal from './ConfigureModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { isDeviceOnline, queueDeviceTask } from '../lib/devicePolling';
import { supabase } from '../lib/supabase';
import { 
  RiDeviceLine, 
  RiWifiLine, 
  RiWifiOffLine, 
  RiUpload2Line, 
  RiDeleteBinLine,
  RiEditLine,
  RiCloseLine,
} from 'react-icons/ri';

interface DeviceCardProps {
  device: Device;
  viewMode: 'grid' | 'list';
  isOnline?: boolean;
}

const DeviceCard = ({ device, viewMode, isOnline: propIsOnline }: DeviceCardProps) => {
  const { updateDevice, removeDevice } = useDeviceContext();
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(device.name);
  const [editIpAddress, setEditIpAddress] = useState(device.ip_address);
  const [file, setFile] = useState<File | null>(null);
  const [examTiming, setExamTiming] = useState<ExamTiming>({
    startTime: '',
    endTime: '',
  });
  const [isOnline, setIsOnline] = useState<boolean | null>(propIsOnline !== undefined ? propIsOnline : null);

  // Reset edit form when device changes or edit mode is toggled
  useEffect(() => {
    setEditName(device.name);
    setEditIpAddress(device.ip_address);
    
    // Lock body scroll when editing to prevent background scrolling
    if (isEditing) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [device, isEditing]);

  // Update isOnline when propIsOnline changes
  useEffect(() => {
    if (propIsOnline !== undefined) {
      setIsOnline(propIsOnline);
    }
  }, [propIsOnline]);

  const checkDeviceStatus = useCallback(async () => {
    try {
      setIsOnline(null); // Set to loading state
      
      // Use the new polling system to check device status
      const online = await isDeviceOnline(device.ip_address);
      setIsOnline(online);
    } catch (error) {
      console.error('Error checking device status:', error);
      setIsOnline(false);
    }
  }, [device.ip_address]);

  // Check device status when component mounts or IP changes
  useEffect(() => {
    // Only check status if we don't have a prop value and device has an IP
    if (propIsOnline === undefined && device.ip_address) {
      checkDeviceStatus();
    }
  }, [device.ip_address, propIsOnline, checkDeviceStatus]);

  // Refresh status every 30 seconds if we're managing the status ourselves
  useEffect(() => {
    if (propIsOnline === undefined) {
      const interval = setInterval(checkDeviceStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [propIsOnline, checkDeviceStatus]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      toast.success('File selected: ' + e.target.files[0].name);
      // Show time configuration modal right after file selection
      setShowModal(true);
    }
  };

  const handleUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Implement file upload action
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx, .xls';
    input.onchange = (e) => handleFileChange(e as unknown as React.ChangeEvent<HTMLInputElement>);
    input.click();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    removeDevice(device.id);
    toast.success(`Device "${device.name}" deleted`);
    setShowDeleteModal(false);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    // Validate IP address
    const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(editIpAddress)) {
      toast.error('Please enter a valid IP address');
      return;
    }

    // Validate name
    if (editName.trim() === '') {
      toast.error('Device name cannot be empty');
      return;
    }

    updateDevice(device.id, editName, editIpAddress);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset to original values
    setEditName(device.name);
    setEditIpAddress(device.ip_address);
  };

  // Render the edit modal that will appear in the center of the screen
  const renderEditModal = () => {
    if (!isEditing) return null;
    
    return (
      <div 
        className="fixed inset-0 backdrop-blur-[2px] bg-white/10 flex items-center justify-center z-50"
      >
        <div 
          className="bg-white rounded-lg shadow-md w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-lg font-medium text-gray-800">Edit Device</h2>
            <button 
              onClick={handleCancelEdit}
              className="text-gray-400 hover:text-gray-600"
            >
              <RiCloseLine className="text-xl" />
            </button>
          </div>
          
          <div className="px-6 py-5">
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">Device Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-100 focus:border-blue-300"
                placeholder="Enter device name"
              />
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">IP Address</label>
              <input
                type="text"
                value={editIpAddress}
                onChange={(e) => setEditIpAddress(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-100 focus:border-blue-300"
                placeholder="192.168.1.x"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 bg-gradient-to-r from-[#005694] to-[#F39C12] text-white rounded-lg"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Common JSX elements that should appear regardless of view mode
  const commonElements = (
    <>
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        deviceName={device.name}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
      
      {renderEditModal()}
      
      {showModal && (
        <ConfigureModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={async (timing) => {
            // Both times are guaranteed to be valid now as ConfigureModal validates them
            // Apply timing and send file in one go
            
            // Create new filename with date and timing
            const originalName = file!.name;
            const nameWithoutExt = originalName.replace(/\.[^/.]+$/, ""); // Remove extension
            const extension = originalName.split('.').pop(); // Get extension
            // Use Morocco timezone (UTC+1) for consistent date display
            const moroccoTime = new Date(Date.now() + (1 * 60 * 60 * 1000));
            const currentDate = moroccoTime.toISOString().split('T')[0]; // YYYY-MM-DD format
            const startTimeFormatted = timing.startTime.replace(':', '-'); // Convert HH:MM to HH-MM
            const endTimeFormatted = timing.endTime.replace(':', '-'); // Convert HH:MM to HH-MM
            
            const newFileName = `${nameWithoutExt}_${currentDate}_${startTimeFormatted}_${endTimeFormatted}.${extension}`;
            
            // Show loading toast
            const toastId = toast.loading('Queuing file for device...');
            
            try {
              // Get current session for authentication
              const { data: { session } } = await supabase.auth.getSession();
              
              if (!session) {
                throw new Error('User not authenticated');
              }

              // Upload file to cloud storage first
              const formData = new FormData();
              formData.append('file', file!);
              formData.append('originalName', newFileName);
              
              const uploadResponse = await fetch('/api/files/upload', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                },
                body: formData
              });
              
              if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.error || 'Failed to upload file to cloud');
              }
              
              const uploadResult = await uploadResponse.json();
              
              // Queue task for device to download and process the file
              await queueDeviceTask(
                device.ip_address,
                'upload_file',
                uploadResult.fileUrl,
                newFileName,
                {
                  startTime: timing.startTime,
                  endTime: timing.endTime,
                  originalFileName: file!.name
                }
              );
              
              toast.success(`File queued for device. The device will process it when online.`, { id: toastId });
              setShowModal(false);
              setFile(null);
              setExamTiming(timing);
              
            } catch (error) {
              console.error('Error queuing file task:', error);
              toast.error(`Failed to queue file: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: toastId });
            }
          }}
          initialTiming={examTiming}
        />
      )}
    </>
  );

  // Render different layouts based on viewMode
  if (viewMode === 'list') {
    return (
      <>
        <div className="list-device-card bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-all duration-300 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isOnline === null ? 'bg-gray-100' : 
                isOnline ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <RiDeviceLine className={`text-2xl ${
                  isOnline === null ? 'text-gray-400' : 
                  isOnline ? 'text-green-500' : 'text-red-400'
                }`} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold">{device.name}</h3>
                <div className="flex items-center">
                  <p className="text-gray-500 text-sm">{device.ip_address}</p>
                  <div className="flex items-center ml-4">
                    {isOnline === null ? (
                      <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse mr-2"></div>
                    ) : isOnline ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-xs text-green-600">Online</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                        <span className="text-xs text-red-600">Offline</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button 
                onClick={handleUpload}
                className="px-3 py-2 bg-green-50 text-green-600 hover:bg-green-100 transition-colors rounded-lg flex items-center"
                title="Upload file"
                disabled={!isOnline}
              >
                <RiUpload2Line className={`mr-1 ${!isOnline ? 'opacity-50' : ''}`} />
                <span>Upload</span>
              </button>
              <button 
                onClick={handleEdit}
                className="px-3 py-2 rounded-lg hover:bg-gray-100 text-blue-600 transition-colors flex items-center"
                title="Edit device"
              >
                <RiEditLine className="mr-1" />
                <span>Edit</span>
              </button>
              <button 
                onClick={handleDelete}
                className="px-3 py-2 rounded-lg hover:bg-gray-100 text-red-600 transition-colors flex items-center"
                title="Delete device"
              >
                <RiDeleteBinLine className="mr-1" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
        
        {commonElements}
      </>
    );
  }

  // Grid view (default)
  return (
    <>
      <div 
        className="device-card bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-all duration-300 relative group w-full h-full"
        style={{ minHeight: "240px" }}
      >
        <div className="absolute top-4 right-4">
          {isOnline === null ? (
            <div className="w-3 h-3 rounded-full bg-gray-300 animate-pulse"></div>
          ) : isOnline ? (
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm shadow-green-200"></div>
          ) : (
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-200"></div>
          )}
        </div>
        
        <div className="flex items-center mb-6 mt-2">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isOnline === null ? 'bg-gray-100' : 
            isOnline ? 'bg-green-50' : 'bg-red-50'
          }`}>
            {isOnline === null ? (
              <RiDeviceLine className="text-3xl text-gray-400" />
            ) : isOnline ? (
              <RiWifiLine className="text-3xl text-green-500" />
            ) : (
              <RiWifiOffLine className="text-3xl text-red-400" />
            )}
          </div>
          <div className="ml-4">
            <h3 className="text-xl font-semibold">{device.name}</h3>
            <p className="text-gray-500 text-sm">{device.ip_address}</p>
          </div>
        </div>
        
        <div className="border-t border-gray-100 pt-4 mt-2">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Status</span>
            <span className={`font-medium ${
              isOnline === null ? 'text-gray-400' : 
              isOnline ? 'text-green-600' : 'text-red-500'
            }`}>
              {isOnline === null ? 'Checking...' : isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
        
        {/* Action buttons - always visible */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-white via-white to-transparent flex justify-between">
          <div className="flex space-x-2">
            <button 
              onClick={handleEdit}
              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
              title="Edit device"
            >
              <RiEditLine />
            </button>
            <button 
              onClick={handleDelete}
              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              title="Delete device"
            >
              <RiDeleteBinLine />
            </button>
          </div>
          <button 
            onClick={handleUpload}
            className="px-6 py-2.5 bg-green-50 text-green-600 hover:bg-green-100 transition-colors rounded-lg flex items-center justify-center"
            disabled={!isOnline}
          >
            <RiUpload2Line className="mr-2" />
            <span>Upload File</span>
          </button>
        </div>
      </div>
      
      {commonElements}
    </>
  );
};

export default DeviceCard; 