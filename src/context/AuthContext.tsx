// File: AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'; // Added ReactNode

interface User {
  id: string;
  name: string;
  email: string;
  role: 'faculty' | 'student' | 'admin'; // <-- ADDED 'admin' role here
  department?: string;
  rollNumber?: string;
  facultyId?: string;
  // You might want to add empId directly here if it's consistently used as an identifier
  // empId?: string;
}

interface LoginResult {
  user: User;
  redirectUrl: string;
}

interface AuthContextType {
  user: User | null;
  // Updated the role parameter to include 'admin'
  login: (identifier: string, password: string, role: 'faculty' | 'student' | 'admin') => Promise<LoginResult | null>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  isLoggedIn: boolean; // Added isLoggedIn for convenience
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with true to check for existing user
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // Initialize isLoggedIn

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      try {
        const parsedUser: User = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsLoggedIn(true); // Set isLoggedIn to true if user found
      } catch (error) {
        console.error('Error parsing saved user:', error);
        // Clear corrupted data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setIsLoggedIn(false); // Ensure isLoggedIn is false on error
      }
    }
    setIsLoading(false);
  }, []);

  // Updated login function to return User object and redirectUrl, or null
  const login = async (identifier: string, password: string, role: 'faculty' | 'student' | 'admin'): Promise<LoginResult | null> => {
    setIsLoading(true);
    setError(null);
    setIsLoggedIn(false); // Reset isLoggedIn state at the start of login attempt

    try {
      // Create payload based on role (matching your original login page logic)
      // Note: The 'role' sent in the payload here will be 'faculty' or 'student'
      // from the LoginPage tabs. The backend will determine the *actual* role
      // and send it back.
      const payload = role === 'faculty' // This check needs to cover how admin logs in.
                                          // If admin uses empId via faculty tab, this is fine.
        ? { empId: identifier, password, role }
        : { email: identifier, password, role };

      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success && data.user) {
        // Ensure data.user matches the User interface, casting data.user.role to 'faculty' | 'student' | 'admin'
        const loggedInUser: User = {
          id: data.user.id || data.user.empId || data.user.email, // Use a consistent ID if available from backend
          name: data.user.name,
          email: data.user.email || '',
          role: data.user.role as 'faculty' | 'student' | 'admin', // Cast the role from backend
          department: data.user.department,
          rollNumber: data.user.rollNumber,
          facultyId: data.user.empId, // Map empId from backend to facultyId if needed
        };
        setUser(loggedInUser);
        setIsLoggedIn(true); // Set isLoggedIn to true on successful login
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        localStorage.setItem('token', data.token);
        
        // Return both user and redirectUrl
        return { user: loggedInUser, redirectUrl: data.redirectUrl || '/' };
      } else {
        setError(data.message || 'Invalid credentials');
        setIsLoggedIn(false); // Ensure isLoggedIn is false on login failure
        return null; // Return null on failure
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Try again.');
      setIsLoggedIn(false); // Ensure isLoggedIn is false on error
      return null; // Return null on error
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false); // Set isLoggedIn to false on logout
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};