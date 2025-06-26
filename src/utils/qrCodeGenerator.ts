/**
 * Utility functions for QR code generation and management
 */

/**
 * Generates a unique identifier for the attendance session
 */
export const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Formats the QR code data in a structured way
 */
export const formatQRData = (
  department: string,
  section: string,
  classroom: string
): string => {
  const sessionId = generateSessionId();
  const timestamp = new Date().toISOString();
  
  // Format: protocol://type/department/section/classroom/sessionId/timestamp
  return `attendcheck://attendance/${department}/${section}/${classroom}/${sessionId}/${timestamp}`;
};

/**
 * Generates an API URL to create a QR code
 */
export const getQRCodeUrl = (data: string, size: number = 200): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
};

/**
 * Parse QR code data to extract components
 */
export const parseQRData = (qrData: string): Record<string, string> | null => {
  try {
    const url = new URL(qrData);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    if (pathParts[0] !== 'attendance' || pathParts.length < 5) {
      return null;
    }
    
    return {
      type: pathParts[0],
      department: pathParts[1],
      section: pathParts[2],
      classroom: pathParts[3],
      sessionId: pathParts[4],
      timestamp: pathParts[5] || new Date().toISOString()
    };
  } catch (error) {
    console.error('Failed to parse QR data:', error);
    return null;
  }
};