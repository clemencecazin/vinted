const express = require("express");
const formidable = require("express-formidable");
const router = express.Router();
const stripe = require("stripe")(process.env.API_STRIPE_KEY);

router.get("/", (req, res) => {
    res.json("OK");
});

router.post("/payment", async (req, res) => {
    try {
        const response = await stripe.charges.create({
            amount: Number(req.fields.price) * 100,
            currency: "eur",
            description: req.fields.description,
            source: req.fields.stripeToken,
        });
        if (response.status === "succeeded") {
            // Créer la commande (BDD)
            // Répondre au client
            res.status(200).json({ message: "Paiement validé" });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

const app = express();
app.use(formidable());

module.exports = router;
