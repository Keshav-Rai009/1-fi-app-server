const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "1Fijwtsecret@key";

const generateJwtToken = (user) => {
  const payload = {
    uid: user.uid,
    phoneNumber: user.phoneNumber,
    email: user.email || null, // Optional field
  };

  // Sign the token
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: "24h", // Token validity
  });

  return token;
};


const verifyJwtToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Extract token from `Authorization` header

    if (!token) {
        return res.status(401).send({ message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET); // Verify token
        req.user = decoded; // Attach decoded payload to the request object
        //console.log("calling next");
        next(); // Proceed to the next middleware or route
    } catch (error) {
        return res.status(403).send({ message: "Invalid or expired token" });
    }
};

module.exports = { generateJwtToken , verifyJwtToken};
