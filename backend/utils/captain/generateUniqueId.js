const Captain = require("../../models/captain/captain.model"); 
const generateUniqueDriverId = async () => {
  const prefix = "DRV";
  let isUnique = false;
  let driverId;

  while (!isUnique) {
    // Generate a random 9-digit number (100000000 to 999999999)
    const randomNum = Math.floor(100000000 + Math.random() * 900000000);
    driverId = `${prefix}${randomNum}`;

    // Check if the driverId already exists in the database
    const existingCaptain = await Captain.findOne({ driverId });
    if (!existingCaptain) {
      isUnique = true;
    }
  }

  return driverId;
};

module.exports = generateUniqueDriverId;