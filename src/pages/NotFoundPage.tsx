import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Home } from 'lucide-react';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8 text-center"
        >
          <div>
            <div className="flex justify-center">
              <AlertCircle className="h-20 w-20 text-indigo-400" />
            </div>
            <h2 className="mt-6 text-4xl font-extrabold text-gray-900">404 - Page Not Found</h2>
            <p className="mt-2 text-lg text-gray-600">
              The page you are looking for might have been removed or is temporarily unavailable.
            </p>
          </div>
          
          <div className="mt-8">
            <Link 
              to="/" 
              className="btn btn-primary inline-flex items-center"
            >
              <Home className="h-5 w-5 mr-2" />
              Return to Home
            </Link>
          </div>
        </motion.div>
      </main>
      
    </div>
  );
};

export default NotFoundPage;