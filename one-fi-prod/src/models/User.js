const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNo: { type: String, unique: true, required: true },
  isPhoneVerified: { type: String, unique: true, required: false },
  email: { type: String, unique: true, required: false },
  isEmailVerified: { type: String, unique: true, required: false },
  kycStatus: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
  otp: {
    value: { type: String, required: false }, // OTP value
    expirationTime: { type: Date, required: false }, // Expiry timestamp
  },
});

module.exports = mongoose.model("User", UserSchema);