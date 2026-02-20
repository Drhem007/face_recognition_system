import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  RiCloseLine, 
  RiDeviceLine, 
  RiWifiLine, 
  RiCheckboxCircleLine
} from 'react-icons/ri';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, ip_address: string) => void;
}

const AddDeviceModal = ({ isOpen, onClose, onAdd }: AddDeviceModalProps) => {
  const [name, setName] = useState('');
  const [ip_address, setIp_address] = useState('');

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setName('');
      setIp_address('');
    }
    
    // Lock body scroll
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Don't render anything if modal is closed
  if (!isOpen) return null;

  const validateName = (value: string) => {
    return value.trim().length > 0;
  };

  const validateIpAddress = (value: string) => {
    const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate both fields
    if (!validateName(name)) {
      toast.error('Device name is required');
      return;
    }
    
    if (!validateIpAddress(ip_address)) {
      toast.error('Please enter a valid IP address');
      return;
    }
    
    onAdd(name, ip_address);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#005694] to-[#F39C12] p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <RiDeviceLine className="mr-2 text-2xl" />
              Add New Device
            </h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              <RiCloseLine className="text-xl" />
            </button>
          </div>
          <p className="text-white/80 text-sm mt-1">
            Connect a new facial recognition device to your network
          </p>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="flex items-center bg-blue-50 p-4 rounded-lg mb-6">
            <RiWifiLine className="text-blue-500 text-xl mr-3 flex-shrink-0" />
            <p className="text-blue-700 text-sm">
              Make sure the device is powered on and connected to the same network.
            </p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="block mb-2 font-medium text-gray-700">Device Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                placeholder="Enter device name (e.g., Lab Room 101)"
              />
            </div>
            
            <div className="mb-6">
              <label className="block mb-2 font-medium text-gray-700">IP Address</label>
              <input
                type="text"
                value={ip_address}
                onChange={(e) => setIp_address(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                placeholder="192.168.1.x"
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-gradient-to-r from-[#005694] to-[#F39C12] text-white rounded-lg flex items-center"
              >
                <RiCheckboxCircleLine className="mr-2" />
                Add Device
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDeviceModal; 