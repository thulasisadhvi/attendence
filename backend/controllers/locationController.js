const geolib = require('geolib');
const fs = require('fs');
const path = require('path');

// Load room coordinates from JSON file
// Adjust the path as needed based on your project structure.
// For example, if roomCoordinates.json is in a 'data' folder next to 'controllers',
// the path might be `path.join(__dirname, '../data/roomCoordinates.json')`.
const roomCoordinatesPath = path.join(__dirname, '../roomCoordinates.json'); // Common path assuming 'data' folder
let roomCoordinates = {};
try {
  const rawData = fs.readFileSync(roomCoordinatesPath);
  roomCoordinates = JSON.parse(rawData);
  console.log('Room coordinates loaded successfully.');
} catch (error) {
  console.error('Error loading roomCoordinates.json. Please ensure the file exists and is valid JSON:', error);
  // In a production environment, you might want to gracefully handle this,
  // e.g., by logging an error and preventing server startup if critical data is missing.
}

exports.verifyLocation = async (req, res) => {
  const { studentLatitude, studentLongitude, block, room } = req.body;
  // In a real application, you might also receive a token to verify the period data
  // against the requested block and room for added security and data integrity.

  // Basic validation of incoming data
  if (!studentLatitude || !studentLongitude || !block || !room) {
    return res.status(400).json({ message: 'Missing required location data (studentLatitude, studentLongitude, block, or room).' });
  }

  // Find the expected room coordinates from the loaded JSON data
  const expectedRoom = roomCoordinates[block]?.[room];

  // If the room or block is not found in the configuration
  if (!expectedRoom) {
    console.warn(`Coordinates not found for Block: ${block}, Room: ${room}. Please check roomCoordinates.json.`);
    return res.status(404).json({ message: `Expected room coordinates for Block ${block}, Room ${room} not found in our database.` });
  }

  const { latitude: expectedLat, longitude: expectedLon, radius_meters: allowedRadius } = expectedRoom;

  try {
    // --- Added console logs for coordinates ---
    console.log(`Student's Location: Latitude = ${studentLatitude}, Longitude = ${studentLongitude}`);
    console.log(`Expected Room Location (${block} ${room}): Latitude = ${expectedLat}, Longitude = ${expectedLon}`);
    // ------------------------------------------

    // Calculate the distance between the student's current location and the expected room's location
    // geolib.getDistance is used for accurate calculation based on Haversine formula.
    const distance = geolib.getDistance(
      { latitude: studentLatitude, longitude: studentLongitude },
      { latitude: expectedLat, longitude: expectedLon }
    );

    console.log(`Verification attempt for Block: ${block}, Room: ${room}. Student's distance: ${distance.toFixed(2)} meters.`);

    // Check if the student's location is within the allowed radius of the classroom
    if (distance <= allowedRadius) {
      // Location is verified successfully
      return res.status(200).json({
        status: 'success',
        message: 'Location verified successfully!',
        distance: parseFloat(distance.toFixed(2)), // Return distance for debugging/info
        allowedRadius: allowedRadius
      });
    } else {
      // Location is outside the allowed radius (location mismatch)
      // Sending a 403 Forbidden status is appropriate for this kind of access denial.
      return res.status(403).json({
        status: 'error',
        message: 'Location mismatch. You are not in the correct classroom.', // Specific message for frontend
        distance: parseFloat(distance.toFixed(2)),
        allowedRadius: allowedRadius
      });
    }
  } catch (error) {
    // Catch any unexpected errors during distance calculation or data access
    console.error('Error during location verification process:', error);
    return res.status(500).json({ message: 'Internal server error during location verification.' });
  }
};