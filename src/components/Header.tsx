import React from 'react';
import { ClipboardCheck } from 'lucide-react';

interface HeaderProps {
  username?: string;
  rollNumber?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  username = "Alex Johnson", 
  rollNumber = "CSE2023001" 
}) => {
  return (
    <header className="bg-indigo-600 text-white p-4 flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-500 rounded-full w-10 h-10 flex items-center justify-center text-white font-bold">
          <ClipboardCheck size={20} />
        </div>
        <span className="text-xl font-semibold">AttendCheck</span>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-right mr-2">
          <div className="font-medium">Welcome, {username}</div>
          <div className="text-xs text-indigo-200">Role: Faculty</div>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
          <img 
            src="https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=100" 
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;