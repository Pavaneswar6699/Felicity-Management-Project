const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const requireAdminAuth = async (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({ error: "Unauthorized, token missing" });
    }

    const token = authorization.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.SECRET_JWT_KEY);

        if (decoded.role !== "admin") {
            return res.status(403).json({ error: "Admin access required" });
        }

        const admin = await Admin.findById(decoded._id);
        if (!admin) {
            return res.status(401).json({ error: "Admin not found" });
        }

        req.admin = admin;
        next();

    } catch (err) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

module.exports = requireAdminAuth;