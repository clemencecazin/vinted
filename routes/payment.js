const express = require("express");
const formidable = require("express-formidable");
const router = express.Router();
const stripe = require("stripe")(process.env.API_STRIPE_KEY);

router.get("/", (req, res) => {
    res.json("OK");
});

router.post("/payment", async (req, res) => {
    console.log(req.fields.stripeToken);
    try {
        const response = await stripe.charges.create({
            amount: Number(req.fields.price) * 100,
            currency: "eur",
            description: req.fields.description, // req.fields.description
            source: req.fields.stripeToken,
        });
        console.log(response);
        if (response.status === "succeeded") {
            // Créer la commande (BDD)
            // Répondre au client
            res.status(200).json({ message: "Paiement validé" });
        }
    } catch (error) {
        console.log(error.message);
    }
});

const app = express();
app.use(formidable());

module.exports = router;
