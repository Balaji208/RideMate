const riderModel = require("../../models/rider/rider.model");
const jwt = require("jsonwebtoken");

module.exports.authRider = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await riderModel.findById(decoded._id);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized access denied" });
    }
};