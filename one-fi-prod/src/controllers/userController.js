const { verify } = require("jsonwebtoken");
const jwt = require("jsonwebtoken");
//const User = require("../models/User"); // Import the User model
const axios = require("axios"); // Import axios for making HTTP requests
const { admin, saveFirestoreData, firestoreDB } = require("../config/firebase");
const { generateJwtToken } = require("../utils/jwtUtil");

// async function saveFirestoreData(userData) {
//   try {
//     const userRef = db.collection("users").doc(userData.uid); // Use a unique identifier (e.g., phoneNo) as the document ID
//     await userRef.set(userData, { merge: true }); // Use merge to update only specified fields
//     console.log("User data successfully saved to Firestore.");
//   } catch (error) {
//     console.error("Error saving user to Firestore:", error);
//     throw error;
//   }
// }

class UserController {
  constructor() {
    this.signUp = this.signUp.bind(this);
    this.logIn = this.logIn.bind(this);
    this.logInViaFirebase = this.logInViaFirebase.bind(this);
    this.verifyOtpViaFirebase = this.verifyOtpViaFirebase.bind(this);
    this.sendOtp = this.sendOtp.bind(this);
    this.verifyOtp = this.verifyOtp.bind(this);
  }

  // SignUp method
  async signUp(req, res) {
    //console.log("hi 1");
    const { phoneNo, name, email } = req.body;
    // const phoneNo = "+918278700329";
    // const name = "Keshav Rai";
    // const email = "keshav.rai@sap.com";

    if (!phoneNo || !name || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      // Generate OTP
      //console.log("hi 1", this);
      const { success, mobileOtp, expirationTime } = await this.sendOtp(
        phoneNo
      );
      console.log("check", success, mobileOtp, expirationTime);
      //console.log(otpResponse);
      //console.log("hi", otpResponse);

      if (success) {
        console.log("OTP SEND TO ", phoneNo);
        // Store user data in the database with OTP and expiration time
        const otpExpiration = new Date(Date.now() + 5 * 60 * 1000); // OTP expiration time (5 minutes)
        // const user = new User({
        //   name,
        //   phoneNo,
        //   email,
        //   otp: {
        //     value: otpResponse.otp,
        //     expirationTime: otpExpiration,
        //   },
        // });

        // await user.save(); // Save to MongoDB
        //console.log(otpResponse);
        const userData = {
          created_at: new Date().toISOString(), // Matches `created_at` (string)
          display_name: name, // Matches `display_name` (string)
          email: email, // Matches `email` (string)
          first_name: "", // Matches `first_name` (string)
          is_email_verified: false, // Matches `is_email_verified` (boolean)
          is_phone_verified: false, // Matches `is_phone_verified` (boolean)
          kycStatus: "pending", // Matches `kycStatus` (string)
          last_name: "", // Matches `last_name` (string)
          middle_name: "", // Matches `middle_name` (string)
          mobile_otp: mobileOtp, // Matches `mobile_otp` (string)
          mobile_otp_expiry_time: expirationTime || otpExpiration, // Matches `mobile_otp_expiry_time` (timestamp)
          phone_number: phoneNo, // Matches `phone_number` (string)
          photo_url: "https://example.com/photo.jpg", // Matches `photo_url` (string)
          uid: phoneNo, // Matches `uid` (string)
        };

        // Save to Firestore
        await saveFirestoreData("users", userData);

        return res.status(200).json({
          message: "OTP sent successfully and user data saved.",
          data: { phoneNo, name, email },
        });
      } else {
        return res.status(500).json({
          message: "Failed to send OTP",
          // error: otpResponse.error,
        });
      }
    } catch (error) {
      console.error("Error in signUp:", error);
      return res.status(500).json({ message: "Server error", error });
    }
  }

  // login method
  async logIn(req, res) {
    // const user = await admin.auth().createUser({
    //     phoneNumber: req.body.phoneNumber
    // });

    // const token = await admin.auth().createCustomToken(user.uid);
    // console.log(user, token);
    const { phoneNo, email } = req.body;

    // Step 1: Check if user exists
    let userDoc;

    if (phoneNo) {
      userDoc = await firestoreDB.collection("users").doc(phoneNo).get();
    } else {
      userDoc = await firestoreDB.collection("users").doc(email).get();
    }

    if (!userDoc.exists) {
      return res.status(404).send({ message: "User not found" });
    }

    // Step 2: Send OTP to user via SNS
    const { success, mobileOtp, emailOtp, expirationTime } = await this.sendOtp(
      phoneNo
    );
    if (!success) {
      return res.status(500).send({ message: "Failed to send OTP", error });
    }

    // Store OTP temporarily in Firestore for comparison
    await firestoreDB
      .collection("users")
      .doc(phoneNo)
      .update({
        email,
        mobile_otp: mobileOtp || userDoc.mobile_otp, // Store OTP temporarily for verification
        mobile_otp_expiry_time:
          expirationTime || userDoc.mobile_otp_expiry_time,
        email_otp: emailOtp || userDoc.email_otp,
        email_otp_expiry_time: expirationTime || userDoc.email_otp_expiry_time,
      });

    res.status(200).send({ message: "OTP sent to phone no: ", phoneNo });
  }

  //   async logIn(req, res) {
  //     //console.log("hi 1");
  //     const { phoneNo } = req.body;
  //     // const phoneNo = "+918278700329";
  //     // const name = "Keshav Rai";
  //     // const email = "keshav.rai@sap.com";

  //     if (!phoneNo) {
  //       return res.status(400).json({ message: "Phone no is required for login" });
  //     }

  //     try {
  //       // Generate OTP
  //       //console.log("hi 1", this);
  //       const { success, mobileOtp, expirationTime } = await this.sendOtp(
  //         phoneNo
  //       );
  //       console.log("check", success, mobileOtp, expirationTime);
  //       //console.log(otpResponse);
  //       //console.log("hi", otpResponse);

  //       if (success) {
  //         console.log("OTP SEND TO ", phoneNo);
  //         // Store user data in the database with OTP and expiration time
  //         const otpExpiration = new Date(Date.now() + 5 * 60 * 1000); // OTP expiration time (5 minutes)
  //         // const user = new User({
  //         //   name,
  //         //   phoneNo,
  //         //   email,
  //         //   otp: {
  //         //     value: otpResponse.otp,
  //         //     expirationTime: otpExpiration,
  //         //   },
  //         // });

  //         // await user.save(); // Save to MongoDB
  //         //console.log(otpResponse);
  //         const userData = {
  //           created_at: new Date().toISOString(), // Matches `created_at` (string)
  //           display_name: name, // Matches `display_name` (string)
  //           email: email, // Matches `email` (string)
  //           first_name: "", // Matches `first_name` (string)
  //           is_email_verified: false, // Matches `is_email_verified` (boolean)
  //           is_phone_verified: false, // Matches `is_phone_verified` (boolean)
  //           kycStatus: "pending", // Matches `kycStatus` (string)
  //           last_name: "", // Matches `last_name` (string)
  //           middle_name: "", // Matches `middle_name` (string)
  //           mobile_otp: mobileOtp.toString(), // Matches `mobile_otp` (string)
  //           mobile_otp_expiry_time: expirationTime?.toISOString || otpExpiration, // Matches `mobile_otp_expiry_time` (timestamp)
  //           phone_number: phoneNo, // Matches `phone_number` (string)
  //           photo_url: "https://example.com/photo.jpg", // Matches `photo_url` (string)
  //           uid: phoneNo, // Matches `uid` (string)
  //         };

  //         // Save to Firestore
  //         await saveFirestoreData(userData);

  //         return res.status(200).json({
  //           message: "OTP sent successfully and user data saved.",
  //           data: { phoneNo, name, email },
  //         });
  //       } else {
  //         return res.status(500).json({
  //           message: "Failed to send OTP",
  //           // error: otpResponse.error,
  //         });
  //       }
  //     } catch (error) {
  //       console.error("Error in signUp:", error);
  //       return res.status(500).json({ message: "Server error", error });
  //     }
  //   }

  // Generate OTP using the Amazon API endpoint

  // Endpoint to send OTP
  // async logInViaFirebase(req, res) {
  //   const { phoneNumber } = req.body;
  //   const sessionCookieOptions = {
  //     expiresIn: 60 * 60 * 1000, // 1 hour in milliseconds
  //   };

  //   if (!phoneNumber) {
  //     return res.status(400).json({ message: "Phone number is required." });
  //   }

  //   try {
  //     //   const verificationId = await admin.auth().createCustomToken(phoneNumber);
  //     //   return res
  //     //     .status(200)
  //     //     .json({ message: "OTP sent successfully.", verificationId });

  //     const sessionInfo = await admin
  //       .auth()
  //       .createSessionCookie("123", sessionCookieOptions);
  //     return res
  //       .status(200)
  //       .json({ message: "OTP sent successfully.", sessionInfo });
  //   } catch (error) {
  //     console.error("Error sending OTP:", error.message);
  //     return res
  //       .status(500)
  //       .json({ message: "Failed to send OTP.", error: error.message });
  //   }
  // }

  // async verifyOtpViaFirebase(req, res) {
  //   const { phoneNumber, otp, sessionInfo } = req.body;

  //   if (!phoneNumber || !otp || !sessionInfo) {
  //     return res
  //       .status(400)
  //       .json({ message: "Phone number, OTP, and session info are required." });
  //   }

  //   try {
  //     const user = await admin.auth().getUserByPhoneNumber(phoneNumber);

  //     if (!user) {
  //       return res.status(404).json({ message: "User not found." });
  //     }
  //     // Verify OTP using Firebase
  //     const decodedToken = await admin
  //       .auth()
  //       .verifyIdToken(sessionInfo, { otp });

  //     if (decodedToken.phoneNumber !== phoneNumber) {
  //       return res.status(401).json({
  //         message: "Phone number mismatch for firebase login. Use the same no",
  //       });
  //     }

  //     // Update user state in Firestore
  //     const userSnapshot = await db
  //       .collection("users")
  //       .where("phoneNumber", "==", phoneNumber)
  //       .get();
  //     if (userSnapshot.empty) {
  //       return res.status(404).json({ message: "User not found." });
  //     }

  //     //const userId = userSnapshot.docs[0].id;
  //     await db.collection("users").doc(phoneNumber).update({
  //       loggedIn: true,
  //       lastLogin: new Date().toISOString(),
  //     });

  //     //   if (isValidOtp) {
  //     //     // return res
  //     //     //   .status(200)
  //     //     //   .json({ message: "Login successful.", user: isValidOtp });

  //     //     // Update Firestore or any database with login success
  //     //     await db.collection("users").doc(user.uid).update({
  //     //       loggedIn: true,
  //     //       lastLogin: new Date().toISOString(),
  //     //     });

  //     return res
  //       .status(200)
  //       .json({ message: "Login successful.", userId: user.uid });
  //     //   } else {
  //     //     return res.status(401).json({ message: "Invalid OTP." });
  //     //   }
  //   } catch (error) {
  //     console.error("Error verifying OTP:", error.message);
  //     return res
  //       .status(500)
  //       .json({ message: "Failed to verify OTP.", error: error.message });
  //   }
  // }

  sendOtp = async (phoneNo, email = "") => {
    const payload = {
      request: {
        userAttributes: {
          email,
          phone_number: phoneNo,
        },
        clientMetadata: {
          sendEmailOtp: email ? true : false,
          sendMobileOtp: phoneNo ? true : false,
        },
      },
    };

    const amazonEndpoint =
      "https://op4szeto5d.execute-api.ap-south-1.amazonaws.com/dev/sendOtp";
    const config = {
      method: "post",
      url: amazonEndpoint,
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer YOUR_API_KEY", // Replace with actual API key
      },
      data: payload,
    };

    try {
      const response = await axios(config);
      console.log("OTP send to ", phoneNo, response);
      return {
        success: true,
        emailOtp: response.data.emailOtp,
        mobileOtp: response.data.mobileOtp,
        expirationTime: response.data.expirationTime,
      };
    } catch (error) {
      console.error("Error calling Amazon endpoint:", error);
      return { success: false, error };
    }
  };

  async;

  // Verify OTP method
  async verifyOtp(req, res) {
    const { phoneNo, otp, email = "" } = req.body;

    if (!(phoneNo || email) || !otp) {
      return res
        .status(400)
        .json({ message: "Either phone number or email and OTP are required" });
    }

    try {
      // Find the user by phone number
      // Fetch OTP data from Firestore
      const userDoc = await firestoreDB.collection("users").doc(phoneNo).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: `User ${phoneNo} not found.` });
      }

      const userData = userDoc.data();
      const storedOtp = phoneNo ? userData.mobile_otp : userData.email_otp;
      const otpExpiryTime = phoneNo
        ? new Date(userData.mobile_otp_expiry_time._seconds * 1000)
        : new Date(userData.email_otp_expiry_time._seconds * 1000);

      const currentTime = new Date().toISOString();
      // console.log(
      //   currentTime,
      //   otpExpiryTime,
      //   storedOtp,
      //   otp,
      //   storedOtp === otp
      // );

      // Check if OTP has expired
      if (currentTime > otpExpiryTime) {
        return res
          .status(400)
          .json({ message: "OTP expired. Please try with a new otp." });
      }

      // Check if entered OTP matches the stored OTP
      if (storedOtp === otp) {
        const token = generateJwtToken({
          phoneNo,
          phoneNumber: phoneNo,
        });
        await firestoreDB
          .collection("users")
          .doc(phoneNumber)
          .update({
            logged_in: true,
            last_login: new Date().toISOString(),
            is_phone_verified: phoneNo ? true : false,
            is_email_verified: email ? true : false,
          });
        return res.tatus(200).json({ message: "Login successful.", token });
        //return res.status(200).json({ message: "OTP verified successfully" });
      } else {
        return res.status(400).json({
          message:
            "Invalid OTP. Please enter the correct otp or generate a new one.",
        });
      }
    } catch (error) {
      console.error("Error in verifyOtp:", error);
      return res.status(500).json({ message: "Server error", error });
    }
  }
}

module.exports = new UserController();
