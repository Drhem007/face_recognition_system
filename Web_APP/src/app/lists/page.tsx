"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useDeviceContext } from '../context/DeviceContext';
import { useAttendanceContext } from '../context/AttendanceContext';
import toast from 'react-hot-toast';
import { 
  RiArrowLeftSLine, 
  RiArrowRightSLine, 
  RiLogoutBoxLine, 
  RiListCheck2, 
  RiVoiceRecognitionLine,
  RiDeviceLine,
  RiGroupLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiPercentLine,
  RiDownloadLine,
  RiCalendarLine,
  RiTimeLine,
  RiFileExcelLine,
  RiSearchLine,
  RiFilterLine,
  RiRefreshLine
} from 'react-icons/ri';

export default function ListsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const { user, signOut } = useAuth();
  const { devices } = useDeviceContext();
  const { reports, isLoading, refreshReports } = useAttendanceContext();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/signin');
    }
  }, [user, router]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
      toast.error('Logout failed. Please try again.');
    }
  };

  // Filter reports based on selected device and search term
  const filteredReports = reports.filter(report => {
    const matchesDevice = selectedDevice === 'all' || report.deviceId === selectedDevice;
    const matchesSearch = 
      report.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.date.includes(searchTerm) ||
      report.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesDevice && matchesSearch;
  });

  // Calculate overall statistics
  const totalStudents = filteredReports.reduce((sum, report) => sum + report.totalStudents, 0);
  const totalPresent = filteredReports.reduce((sum, report) => sum + report.presentStudents, 0);
  const totalAbsent = filteredReports.reduce((sum, report) => sum + report.absentStudents, 0);
  const overallAttendanceRate = totalStudents > 0 ? (totalPresent / totalStudents) * 100 : 0;

  const handleDownload = (reportId: string, fileName: string) => {
    try {
      // Create download URL
      const downloadUrl = `/api/attendance/download/${reportId}`;
      
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloading ${fileName}...`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const handleRefresh = async () => {
    await refreshReports();
    toast.success('Reports refreshed');
  };

  const navigateToDevices = () => {
    router.push('/devices');
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out fixed h-full z-10 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
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
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-3">
            <li>
              <button 
                onClick={navigateToDevices}
                className="sidebar-item flex items-center px-3 py-3 rounded-lg hover:bg-gray-100 transition-all group w-full text-left"
              >
                <RiDeviceLine className={`icon text-xl text-gray-500 ${!sidebarCollapsed && 'mr-3'}`} />
                {!sidebarCollapsed && <span className="text-gray-700">Devices</span>}
              </button>
            </li>
            <li>
              <a 
                href="#" 
                className="sidebar-item active flex items-center px-3 py-3 rounded-lg bg-gray-100 text-primary transition-all group"
              >
                <RiListCheck2 className={`icon text-xl ${!sidebarCollapsed && 'mr-3'}`} />
                {!sidebarCollapsed && <span className="font-medium">Lists</span>}
              </a>
            </li>
          </ul>
        </nav>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
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
      <div className={`flex-1 flex flex-col bg-gray-50 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-20' : 'ml-64'
      }`}>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
              <p className="text-gray-600 mt-1">Monitor exam attendance across all devices</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RiRefreshLine className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <div className="flex items-center space-x-2">
                <RiFilterLine className="text-gray-400" />
                <select
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005694] focus:border-transparent"
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                >
                  <option value="all">All Devices</option>
                  {devices.map(device => (
                    <option key={device.id} value={device.id}>{device.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Statistics Cards */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Students */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{totalStudents}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <RiGroupLine className="text-2xl text-blue-600" />
                  </div>
                </div>
              </div>

              {/* Present Students */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Present</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{totalPresent}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {totalStudents > 0 ? ((totalPresent / totalStudents) * 100).toFixed(1) : 0}% of total
                    </p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <RiCheckboxCircleLine className="text-2xl text-green-600" />
                  </div>
                </div>
              </div>

              {/* Absent Students */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Absent</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{totalAbsent}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {totalStudents > 0 ? ((totalAbsent / totalStudents) * 100).toFixed(1) : 0}% of total
                    </p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <RiCloseCircleLine className="text-2xl text-red-600" />
                  </div>
                </div>
              </div>

              {/* Attendance Rate */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                    <p className="text-3xl font-bold text-[#005694] mt-2">{overallAttendanceRate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500 mt-1">Overall average</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <RiPercentLine className="text-2xl text-[#005694]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Reports Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Search Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Generated Reports</h2>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search reports..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#005694] focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Reports List */}
              <div className="divide-y divide-gray-200">
                {isLoading ? (
                  <div className="p-12 text-center">
                    <div className="animate-spin text-4xl text-gray-300 mx-auto mb-4">
                      <RiRefreshLine />
                    </div>
                    <p className="text-gray-500">Loading attendance reports...</p>
                  </div>
                ) : filteredReports.length === 0 ? (
                  <div className="p-12 text-center">
                    <RiFileExcelLine className="text-4xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {searchTerm || selectedDevice !== 'all' 
                        ? 'No reports found matching your criteria' 
                        : 'No attendance reports yet'}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchTerm || selectedDevice !== 'all'
                        ? 'Try adjusting your search or filter settings'
                        : 'Reports will appear here when generated by Raspberry Pi devices'}
                    </p>
                    {!searchTerm && selectedDevice === 'all' && (
                      <button
                        onClick={handleRefresh}
                        className="mt-4 px-4 py-2 bg-gradient-to-r from-[#005694] to-[#F39C12] text-white rounded-lg hover:shadow-md transition-all duration-300"
                      >
                        <RiRefreshLine className="mr-2 inline" />
                        Check for New Reports
                      </button>
                    )}
                  </div>
                ) : (
                  filteredReports.map((report) => {
                    // Extract original filename without extension
                    const getOriginalFileName = (fileName: string) => {
                      // Remove the extension first
                      const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
                      
                      // Check if it has the pattern: originalname_YYYY-MM-DD_HH-MM_HH-MM
                      // This pattern is added by the ConfigureModal when uploading
                      const match = nameWithoutExt.match(/^(.+)_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}_\d{2}-\d{2}$/);
                      
                      if (match) {
                        return match[1]; // Return the original name part
                      }
                      
                      // If no pattern match, return the name without extension
                      return nameWithoutExt;
                    };

                    const originalFileName = getOriginalFileName(report.fileName);

                    return (
                      <div key={report.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4">
                              <div className="bg-gradient-to-r from-[#005694] to-[#F39C12] p-2 rounded-lg">
                                <RiFileExcelLine className="text-white text-xl" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{report.deviceName}</h3>
                                <p className="text-sm font-medium text-[#005694] mt-1">{originalFileName}</p>
                                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <RiCalendarLine className="mr-1" />
                                    {report.date}
                                  </div>
                                  <div className="flex items-center">
                                    <RiTimeLine className="mr-1" />
                                    {report.time}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-6">
                            <div className="text-center">
                              <p className="text-sm text-gray-500">Total</p>
                              <p className="font-semibold text-gray-900">{report.totalStudents}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-500">Present</p>
                              <p className="font-semibold text-green-600">{report.presentStudents}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-500">Absent</p>
                              <p className="font-semibold text-red-600">{report.absentStudents}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-500">Rate</p>
                              <p className="font-semibold text-[#005694]">{report.attendanceRate.toFixed(1)}%</p>
                            </div>
                            <button
                              onClick={() => handleDownload(report.id, report.fileName)}
                              className="flex items-center px-4 py-2 bg-gradient-to-r from-[#005694] to-[#F39C12] text-white rounded-lg hover:shadow-md transition-all duration-300"
                            >
                              <RiDownloadLine className="mr-2" />
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 