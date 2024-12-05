const express = require("express");
//const connectDB = require("./config/db");
const bodyParser = require("body-parser");
const appRoutes = require("./routes/appRoutes");
//const transactionRoutes = require("./routes/transactionRoutes");

require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use("/api/v1/", appRoutes);
//app.use("/api/transactions", transactionRoutes);

// Connect to DB
//connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
