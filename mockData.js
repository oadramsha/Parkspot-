//generate random spots
const generateMockSpots = (count = 5) => {
  const spots = [];
  
  //calgary coordinates
  const calgaryLat = 51.0447;
  const calgaryLng = -114.0719;
  
  //generate random spots within ~5km radius
  for (let i = 0; i < count; i++) {
    const randomLat = calgaryLat + (Math.random() - 0.5) * 0.05;
    const randomLng = calgaryLng + (Math.random() - 0.5) * 0.05;

    spots.push({
      id: Date.now() + i,
      lat: randomLat,
      lng: randomLng,
      createdAt: new Date().toISOString()
    });
  }
  
  return spots;
};

module.exports = { generateMockSpots };
