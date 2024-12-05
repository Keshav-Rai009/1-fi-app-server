// const mongoose = require("mongoose");
// const dns = require("dns");

// const connectDB = async () => {
//   try {
//     // dns.resolveSrv("_mongodb._tcp.cluster0.mongodb.net", (err, addresses) => {
//     //   if (err) console.error(err);
//     //   else console.log(addresses);
//     // });

//     await mongoose.connect(process.env.MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });
//     console.log("MongoDB connected...");
//   } catch (err) {
//     console.error("Error Connecting to Mongo DB", err.message);
//     process.exit(1);
//   }
// };

// module.exports = connectDB;
