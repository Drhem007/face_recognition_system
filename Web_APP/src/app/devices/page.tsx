"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import DeviceCard from '../components/DeviceCard';
import AddDeviceModal from '../components/AddDeviceModal';
import toast from 'react-hot-toast';
import { useDeviceContext } from '../context/DeviceContext';
import { getDeviceStatuses } from '../lib/devicePolling';
// ===DEMO MODE===
import { MOCK_DEVICE_STATUSES } from '../lib/mockData';
const DEMO_MODE = true;
// ===END DEMO MODE===
import {
  RiAddLine,
  RiDeviceLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiLogoutBoxLine,
  RiListCheck2,
  RiVoiceRecognitionLine,
  RiSearchLine,
  RiLayoutGridLine,
  RiListUnordered,
  RiDeviceFill
} from 'react-icons/ri';

export default function DevicesPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, boolean>>({});
  const { user, signOut } = useAuth();
  const { devices, isLoading, addDevice } = useDeviceContext();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      router.push('/signin');
    }
  }, [user, router]);

  // Load device statuses from heartbeat system
  useEffect(() => {
    // ===DEMO MODE=== use mock statuses instead of real polling
    if (DEMO_MODE) {
      setDeviceStatuses(MOCK_DEVICE_STATUSES);
      return;
    }
    // ===END DEMO MODE===

    const loadDeviceStatuses = async () => {
      if (devices.length > 0) {
        try {
          const statuses = await getDeviceStatuses();
          setDeviceStatuses(statuses);
        } catch (error) {
          console.error('Error loading device statuses:', error);
        }
      }
    };

    loadDeviceStatuses();

    // Refresh statuses every 30 seconds
    const interval = setInterval(loadDeviceStatuses, 30000);

    return () => clearInterval(interval);
  }, [devices]);

  const handleLogout = async () => {
    try {
      // Let the signOut function in AuthContext handle the navigation
      await signOut();
      // Toast message will not be seen because of the redirect
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  const navigateToLists = () => {
    router.push('/lists');
  };

  // Use real heartbeat-based device status
  const devicesWithStatus = devices.map(device => {
    return {
      ...device,
      isOnline: deviceStatuses[device.ip_address] || false
    };
  });

  // Filter devices based on search term and filter value
  const filteredDevices = devicesWithStatus.filter(device => {
    // First apply the text search filter
    const matchesSearch =
      device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.ip_address.toLowerCase().includes(searchTerm.toLowerCase());

    // Then apply the status filter
    if (filterValue === 'online') {
      return matchesSearch && device.isOnline === true;
    } else if (filterValue === 'offline') {
      return matchesSearch && device.isOnline === false;
    }

    // 'all' filter just uses the search term filter
    return matchesSearch;
  });

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!sidebarCollapsed ? (
            <div className="flex items-center">
              <RiVoiceRecognitionLine className="text-2xl mr-2 text-[#005694]" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#005694] to-[#F39C12]">FaceID</span>
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <RiVoiceRecognitionLine className="text-2xl text-[#005694]" />
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            {sidebarCollapsed ? <RiArrowRightSLine /> : <RiArrowLeftSLine />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 py-4">
          <ul className="space-y-1 px-3">
            <li>
              <a
                href="#"
                className="sidebar-item active flex items-center px-3 py-3 rounded-lg bg-gray-100 text-primary transition-all group"
              >
                <RiDeviceLine className={`icon text-xl ${!sidebarCollapsed && 'mr-3'}`} />
                {!sidebarCollapsed && <span className="font-medium">Devices</span>}
              </a>
            </li>
            <li>
              <button
                onClick={navigateToLists}
                className="sidebar-item flex items-center px-3 py-3 rounded-lg hover:bg-gray-100 transition-all group w-full text-left"
              >
                <RiListCheck2 className={`icon text-xl text-gray-500 ${!sidebarCollapsed && 'mr-3'}`} />
                {!sidebarCollapsed && <span className="text-gray-700">Lists</span>}
              </button>
            </li>
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="sidebar-item flex items-center px-3 py-3 rounded-lg hover:bg-gray-100 text-gray-700 transition-all group w-full text-left"
          >
            <RiLogoutBoxLine className={`icon text-xl text-gray-500 ${!sidebarCollapsed && 'mr-3'}`} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header with search, filter and add button */}
        <div className="bg-gray-50 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          {/* Filter dropdown */}
          <div className="order-2 sm:order-1 w-full sm:w-auto">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
            >
              <option value="all">All Devices</option>
              <option value="online">Online Only</option>
              <option value="offline">Offline Only</option>
            </select>
          </div>

          {/* Central section with search and view options */}
          <div className="order-1 sm:order-2 flex flex-col sm:flex-row gap-3 w-full sm:w-auto lg:mx-auto">
            <div className="relative flex-grow mx-auto sm:max-w-[400px]">
              <input
                type="text"
                placeholder="Search devices..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center p-2 ${viewMode === 'grid' ? 'bg-gray-100 text-primary' : 'text-gray-500'}`}
              >
                <RiLayoutGridLine />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center justify-center p-2 ${viewMode === 'list' ? 'bg-gray-100 text-primary' : 'text-gray-500'}`}
              >
                <RiListUnordered />
              </button>
            </div>
          </div>

          {/* Add device button */}
          <div className="order-3 w-full sm:w-auto flex justify-end">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-[#005694] to-[#F39C12] text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
            >
              <RiAddLine className="mr-2" />
              Add Device
            </button>
          </div>
        </div>

        {/* Device content area */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-pulse text-gray-500">Loading devices...</div>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full" style={{ minHeight: 'calc(100vh - 16rem)' }}>
              <div className="text-center max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-50">
                  {searchTerm ? (
                    <RiSearchLine className="text-4xl text-gray-300" />
                  ) : (
                    <RiDeviceFill className="text-4xl text-gray-300" />
                  )}
                </div>
                <h2 className="text-xl font-medium text-gray-700 mb-2">
                  {searchTerm
                    ? `No matching devices found`
                    : filterValue === 'online'
                      ? 'No online devices found'
                      : filterValue === 'offline'
                        ? 'No offline devices found'
                        : 'No devices available'}
                </h2>
                <p className="text-gray-500 mb-6">
                  {searchTerm
                    ? `No devices found matching "${searchTerm}". Try a different search term or clear your search.`
                    : filterValue === 'online'
                      ? 'There are no devices currently online. Try checking again later.'
                      : filterValue === 'offline'
                        ? 'All devices are currently online. Great!'
                        : 'Add your first device to start monitoring facial recognition activities.'}
                </p>
                {!searchTerm && filterValue === 'all' && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#005694] to-[#F39C12] text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <RiAddLine className="mr-2" />
                    Add Your First Device
                  </button>
                )}
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-primary hover:underline font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                : "flex flex-col space-y-4"
            }>
              {filteredDevices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  viewMode={viewMode}
                  isOnline={device.isOnline}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddDeviceModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(name, ip_address) => {
          addDevice(name, ip_address);
          setShowAddModal(false);
        }}
      />
    </div>
  );
} 