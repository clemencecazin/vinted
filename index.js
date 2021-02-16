require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const formidable = require("express-formidable");

const app = express();
const cloudinary = require("cloudinary").v2;

app.use(formidable());
app.use(cors());

// Import des routes
const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");
const paymentRoutes = require("./routes/payment");

app.use(userRoutes);
app.use(offerRoutes);
app.use(paymentRoutes);

mongoose.connect(process.env.MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/", (req, res) => {
    res.json("API sign up, sign in");
});

app.all("*", (req, res) => {
    res.status(404).json({ message: "Cette route n'existe pas" });
});

app.listen(process.env.PORT, () => {
    console.log("Server Started");
});
