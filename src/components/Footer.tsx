import React from 'react';
import { Github, Linkedin, Mail, GraduationCap } from 'lucide-react';

const teamMembers = [
  {
    name: 'Thulasi Sadhvi CH',
    role: 'ML Developer',
    linkedinUrl: 'https://www.linkedin.com/in/thulasi-sadhvi-chodapuneedi-7950022a0?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app',
    emailUrl: 'mailto:23A91A4414@aec.edu.in', // Changed email for example
  },
  {
    name: 'Surya Swaritha Y',
    role: 'ML Developer',
   
    linkedinUrl: 'https://www.linkedin.com/in/swaritha-yelamanchili-33b175291?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app',
    emailUrl: 'mailto:23A91A4464@aec.edu.in', // Changed email for example
  },
  {
    name: 'Poorinma Praneetha A',
    role: 'Full-Stack Developer',
    linkedinUrl: 'https://www.linkedin.com/in/poornima-praneetha-333072291?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app',
    emailUrl: 'mailto:23A91A4404@aec.edu.in', // Changed email for example
  },
  {
    name: 'Deepika T',
    role: 'Front-End Developer',
    linkedinUrl: 'https://www.linkedin.com/in/deepika-tharitla-1a1887359?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app',
    emailUrl: 'mailto:23A91A4461@aec.edu.in', // Changed email for example
  },
  {
    name: 'Vishnu Chakradhar G',
    role: 'Full-Stack Developer',
    linkedinUrl: 'https://www.linkedin.com/in/vishnu-chakradhar-gedda-323602261?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_ap',
    emailUrl: 'mailto:24A95A4401@aec.edu.in', // Changed email for example
  },
  {
    name: 'Sai Satish R',
    role: 'Full-Stack Developer',
    linkedinUrl: 'https://www.linkedin.com/in/sai-satish-rajapanthula-817817265?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app',
    emailUrl: 'mailto:24A95A4401@aec.edu.in', // Changed email for example
  }
];

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col md:flex-row justify-between mb-12">
          <div className="mb-8 md:mb-0">
            <div className="flex items-center space-x-2 mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-lg">
                <GraduationCap size={32} className="text-white" />
              </div>
              <h3 className="text-2xl font-bold">Automated Attendance</h3>
            </div>
            <p className="text-gray-450 max-w-md text-lg">
              Revolutionizing attendance tracking with cutting-edge facial recognition technology.
              Making education smarter, one face at a time.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:gap-12">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Quick Links</h3>
              <ul className="space-y-3">
                <li><a href="/" className="text-gray-400 hover:text-white transition-colors">Home</a></li>
                <li><a href="/login" className="text-gray-400 hover:text-white transition-colors">Login</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Aditya University</h3>
           
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-12">
          <h3 className="text-2xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            Meet Our Team
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/10"
              >
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {/* --- CHANGE IS HERE --- */}
                      {member.name.charAt(0).toUpperCase()}
                      {/* --- END CHANGE --- */}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{member.name}</h4>
                    <p className="text-gray-400 text-sm">{member.role}</p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  
                  <a href={member.linkedinUrl} className="text-gray-400 hover:text-white transition-colors transform hover:scale-110">
                    <Linkedin size={20} />
                    <span className="sr-only">LinkedIn</span>
                  </a>
                  <a href={member.emailUrl} className="text-gray-400 hover:text-white transition-colors transform hover:scale-110">
                    <Mail size={20} />
                    <span className="sr-only">Email</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12 pt-8 border-t border-gray-800">
          <p className="text-gray-400">
            &copy; {new Date().getFullYear()} Automated Attendance System. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;