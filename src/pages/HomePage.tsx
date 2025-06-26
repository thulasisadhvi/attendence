import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useAnimation, useInView } from 'framer-motion';
import { 
  QrCode, 
  MapPin, 
  Scan, 
  Check, 
  Users, 
  BarChart4, 
  Shield, 
  Clock,
  School
} from 'lucide-react';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnimatedBackground from '../components/AnimatedBackground';
import { useAuth } from '../context/AuthContext';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <AnimatedBackground>
        <main className="flex-grow">
          {/* Hero Section */}
          <HeroSection user={user} />
          
          {/* Features Section */}
          <FeaturesSection />
          
          {/* How It Works Section */}
          <HowItWorksSection />
          
          
        </main>
      </AnimatedBackground>
      
      <Footer />
    </div>
  );
};

const HeroSection: React.FC<{ user: any }> = ({ user }) => {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-10 mb-10 md:mb-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center mb-6">
                <School className="h-12 w-12 text-indigo-600 mr-4" />
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                  Automated Attendance System
                </h1>
              </div>
              <p className="text-xl text-gray-600 mb-8">
                Leverging Face recognition Technology in Education Institutions
              </p>
              
              <div className="flex flex-wrap gap-4">
                {!user ? (
                  <>
                    <Link to="/login" className="btn btn-primary">
                      Log-in
                    </Link>
                   
                  </>
                ) : user.role === 'faculty' ? (
                  <Link to="/faculty/generate-qr" className="btn btn-primary">
                    Generate QR Code
                  </Link>
                ) : (
                  <Link to="/student/dashboard" className="btn btn-primary">
                    View Attendance
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
          
          <div className="md:w-1/2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.pexels.com/photos/8199562/pexels-photo-8199562.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Students using automated attendance system" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/40 to-transparent"></div>
              </div>
              <div className="absolute -bottom-6 -right-6 p-4 bg-white rounded-lg shadow-lg">
                <QrCode className="h-12 w-12 text-indigo-600" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Feature: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
      }}
      className="card flex flex-col items-start"
    >
      <div className="p-3 bg-indigo-50 rounded-lg mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our automated attendance system combines cutting-edge technology with ease of use.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Feature 
            icon={<QrCode className="h-6 w-6 text-indigo-600" />}
            title="QR-Based Check-In"
            description="Faculty can easily generate unique QR codes for each class session, enabling quick and secure student check-ins."
          />
          <Feature 
            icon={<Scan className="h-6 w-6 text-indigo-600" />}
            title="Facial Recognition"
            description="Advanced facial recognition technology ensures that attendance is marked only for the actual enrolled student."
          />
          <Feature 
            icon={<MapPin className="h-6 w-6 text-indigo-600" />}
            title="Location Verification"
            description="Ensures students are physically present in the correct classroom by verifying their geographic location."
          />
          <Feature 
            icon={<BarChart4 className="h-6 w-6 text-indigo-600" />}
            title="Detailed Analytics"
            description="Comprehensive dashboards provide insights into attendance patterns and help identify at-risk students."
          />
          <Feature 
            icon={<Shield className="h-6 w-6 text-indigo-600" />}
            title="Secure & Reliable"
            description="Built with security in mind, protecting student data while ensuring accurate attendance records."
          />
          <Feature 
            icon={<Clock className="h-6 w-6 text-indigo-600" />}
            title="Real-Time Updates"
            description="Instantaneous attendance marking and real-time status updates for both students and faculty."
          />
        </div>
      </div>
    </section>
  );
};

const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Faculty Generates QR Code',
      description: 'The faculty member logs in, selects the class details (department, section, classroom, subject, and period), and generates a unique QR code for the session.'
    },
    {
      number: '02',
      title: 'Students Scan the QR',
      description: 'Students scan the QR code using their mobile devices, which takes them to the attendance verification page.'
    },
    {
      number: '03',
      title: 'Location Verification',
      description: 'The system verifies that the student is physically present in the correct classroom location.'
    },
    {
      number: '04',
      title: 'Facial Recognition',
      description: 'The student\'s face is scanned and verified against their registered profile to confirm identity.'
    },
    {
      number: '05',
      title: 'Attendance Recorded',
      description: 'Upon successful verification, attendance is automatically recorded in the system.'
    }
  ];

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our automated attendance system follows a simple yet secure process.
          </p>
        </div>
        
        <div className="relative">
          {/* Connection line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-indigo-100 transform -translate-x-1/2"></div>
          
          {/* Steps */}
          <div className="space-y-12 relative">
            {steps.map((step, index) => (
              <Step 
                key={index} 
                number={step.number} 
                title={step.title} 
                description={step.description} 
                isEven={index % 2 === 1}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Step: React.FC<{ 
  number: string; 
  title: string; 
  description: string; 
  isEven: boolean 
}> = ({ number, title, description, isEven }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, x: isEven ? 50 : -50 },
        visible: { 
          opacity: 1, 
          x: 0, 
          transition: { 
            duration: 0.6,
            delay: 0.2 
          } 
        }
      }}
      className={`flex flex-col ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'} items-center`}
    >
      <div className={`md:w-1/2 ${isEven ? 'md:pl-12' : 'md:pr-12'} mb-6 md:mb-0`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 font-bold relative z-10">
              {number}
            </div>
          </div>
          <div className="ml-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>
      </div>
      <div className="md:w-1/2 flex justify-center">
        {/* Placeholder for step illustration */}
        <div className={`w-64 h-48 bg-indigo-50 rounded-lg flex items-center justify-center ${isEven ? 'md:mr-12' : 'md:ml-12'}`}>
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
            {number === '01' && <QrCode className="h-8 w-8 text-indigo-600" />}
            {number === '02' && <Scan className="h-8 w-8 text-indigo-600" />}
            {number === '03' && <MapPin className="h-8 w-8 text-indigo-600" />}
            {number === '04' && <Users className="h-8 w-8 text-indigo-600" />}
            {number === '05' && <Check className="h-8 w-8 text-indigo-600" />}
          </div>
        </div>
      </div>
    </motion.div>
  );
};


export default HomePage;