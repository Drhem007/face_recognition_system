import { useState, useEffect } from 'react';
import { ExamTiming } from '../types';
import { RiCloseLine, RiTimeLine, RiCalendarCheckLine, RiFileExcel2Line, RiArrowUpSLine, RiArrowDownSLine } from 'react-icons/ri';
import { toast } from 'react-hot-toast';

interface ConfigureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (timing: ExamTiming) => void;
  initialTiming: ExamTiming;
}

// Create a list of formatted time options (every 15 minutes)
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      options.push(`${h}:${m}`);
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

const ConfigureModal = ({ isOpen, onClose, onSave, initialTiming }: ConfigureModalProps) => {
  const [startTime, setStartTime] = useState(initialTiming.startTime || '');
  const [endTime, setEndTime] = useState(initialTiming.endTime || '');
  const [showStartOptions, setShowStartOptions] = useState(false);
  const [showEndOptions, setShowEndOptions] = useState(false);
  
  useEffect(() => {
    // Reset values when modal opens
    setStartTime(initialTiming.startTime || '');
    setEndTime(initialTiming.endTime || '');
    setShowStartOptions(false);
    setShowEndOptions(false);
    
    // Lock body scroll
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialTiming]);

  // Don't render anything if modal is closed
  if (!isOpen) return null;

  // Format a time string to a more readable format
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    try {
      const [hours, minutes] = timeString.split(':');
      const h = parseInt(hours, 10);
      const m = minutes;
      
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHour = h % 12 || 12;
      
      return `${displayHour}:${m} ${period}`;
    } catch {
      return timeString;
    }
  };

  const handleSave = () => {
    // Validate that both times are set
    if (!startTime) {
      toast.error('Please set a start time');
      return;
    }
    
    if (!endTime) {
      toast.error('Please set an end time');
      return;
    }
    
    // Call onSave only when both times are valid
    onSave({
      startTime,
      endTime
    });
  };

  // Close dropdown when clicking outside
  const handleClickOutside = () => {
    setShowStartOptions(false);
    setShowEndOptions(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" 
         style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
         onClick={handleClickOutside}>
      <div className="bg-white w-full max-w-md rounded-lg shadow-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#005694] to-[#F39C12] p-4 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <RiCalendarCheckLine className="mr-2 text-2xl" />
              Configure Exam Time
            </h2>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-200"
            >
              <RiCloseLine className="text-xl" />
            </button>
          </div>
          <p className="text-white/80 text-sm mt-1">
            Set the time period when facial recognition will be active
          </p>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* File info */}
          <div className="flex items-center bg-blue-50 p-4 rounded-lg mb-6">
            <RiFileExcel2Line className="text-blue-500 text-xl mr-3 flex-shrink-0" />
            <div>
              <p className="text-blue-700 text-sm font-medium">File Selected</p>
              <p className="text-blue-600 text-xs mt-0.5">Please set the time period for exam monitoring</p>
            </div>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block mb-2 font-medium text-gray-700">Exam Start Time</label>
              <div className="relative">
                {/* Time input with dropdown */}
                <div 
                  className="w-full border border-gray-300 rounded-lg p-3 pl-10 pr-10 flex justify-between items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStartOptions(!showStartOptions);
                    setShowEndOptions(false);
                  }}
                >
                  <span className={startTime ? 'text-gray-900' : 'text-gray-400'}>
                    {startTime ? formatTime(startTime) : 'Select start time'}
                  </span>
                  {showStartOptions ? <RiArrowUpSLine className="text-gray-400" /> : <RiArrowDownSLine className="text-gray-400" />}
                </div>
                <RiTimeLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                
                {/* Standard time input for accessibility and manual entry */}
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="sr-only"
                  id="start-time-input"
                />
                
                {/* Time options dropdown */}
                {showStartOptions && (
                  <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                    {timeOptions.map((time) => (
                      <div 
                        key={time}
                        className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${time === startTime ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                        onClick={() => {
                          setStartTime(time);
                          setShowStartOptions(false);
                        }}
                      >
                        {formatTime(time)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block mb-2 font-medium text-gray-700">Exam End Time</label>
              <div className="relative">
                {/* Time input with dropdown */}
                <div 
                  className="w-full border border-gray-300 rounded-lg p-3 pl-10 pr-10 flex justify-between items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEndOptions(!showEndOptions);
                    setShowStartOptions(false);
                  }}
                >
                  <span className={endTime ? 'text-gray-900' : 'text-gray-400'}>
                    {endTime ? formatTime(endTime) : 'Select end time'}
                  </span>
                  {showEndOptions ? <RiArrowUpSLine className="text-gray-400" /> : <RiArrowDownSLine className="text-gray-400" />}
                </div>
                <RiTimeLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                
                {/* Standard time input for accessibility and manual entry */}
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="sr-only"
                  id="end-time-input"
                />
                
                {/* Time options dropdown */}
                {showEndOptions && (
                  <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-y-auto">
                    {timeOptions.map((time) => (
                      <div 
                        key={time}
                        className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${time === endTime ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                        onClick={() => {
                          setEndTime(time);
                          setShowEndOptions(false);
                        }}
                      >
                        {formatTime(time)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-gradient-to-r from-[#005694] to-[#F39C12] text-white rounded-lg"
            >
              Upload & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigureModal; 