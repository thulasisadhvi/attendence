import React from 'react';
import { LayoutDashboard, User, ClipboardCheck } from 'lucide-react';

const Sidebar: React.FC = () => {
  return (
    <aside className="bg-white shadow-md w-64 min-h-screen hidden md:block">
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-indigo-50 transition-colors">
              <LayoutDashboard size={20} className="text-indigo-600" />
              <span>Dashboard</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center gap-3 p-3 rounded-lg text-gray-700 hover:bg-indigo-50 transition-colors">
              <User size={20} className="text-indigo-600" />
              <span>Profile</span>
            </a>
          </li>
          <li>
            <a href="#" className="flex items-center gap-3 p-3 rounded-lg bg-indigo-100 text-indigo-700 font-medium">
              <ClipboardCheck size={20} className="text-indigo-600" />
              <span>Mark Attendance</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;