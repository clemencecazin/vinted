const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const Offer = require("../models/Offer");
const isAuthenticated = require("../middlewares/isAuthenticated");

router.post("/offer/publish", isAuthenticated, async (req, res) => {
    // console.log(req.files.picture.path); // Local picture basket

    try {
        // Add New Offer

        // console.log(req.fields.title); // Air Max 90
        // console.log(req.fields.description); // Air max 90, très peu portées
        // console.log(req.fields.price); // 80
        // console.log(req.fields.condition); // Neuf
        // console.log(req.fields.city); // Paris
        // console.log(req.fields.brand); // Nike
        // console.log(req.fields.size); // 40
        // console.log(req.fields.color); // Black

        // Destructuring
        const {
            title,
            description,
            price,
            size,
            brand,
            condition,
            city,
            color,
        } = req.fields;

        const newOffer = new Offer({
            product_name: title,
            product_description: description,
            product_price: price,
            product_details: [
                {
                    MARQUE: brand,
                },
                {
                    TAILLE: size,
                },
                {
                    ETAT: condition,
                },
                {
                    COULEUR: color,
                },
                {
                    EMPLACEMENT: city,
                },
            ],

            owner: req.user,
        });

        const pictureToUpload = req.files.picture.path;
        // console.log(pictureToUpload);
        // // Requête pour cloudinary
        const result = await cloudinary.uploader.upload(pictureToUpload, {
            folder: `/vinted/offers/${newOffer._id}`,
        });
        console.log(result); // Cloudinary Object
        // // console.log(result.secure_url); // Secured picture URL

        // Aujouter le resultat de l'upload dans newOffer
        newOffer.product_image = result;

        await newOffer.save();

        await newOffer.populate("owner", "account").execPopulate(); // Dans l'objet newOffer, on populate l'account dans owner qui est en BDD

        res.status(200).json(newOffer); // retourne l'offre
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Filters offers

router.get("/offers", async (req, res) => {
    try {
        let filters = {};

        // Si je reçois une query title
        if (req.query.title) {
            // j'ajoute une clé product_name à l'objet filters
            filters.product_name = new RegExp(req.query.title, "i");
        }

        if (req.query.priceMin) {
            filters.product_price = {
                $gte: Number(req.query.priceMin),
            };
        }

        if (req.query.priceMax) {
            if (filters.product_price) {
                filters.product_price.$lte = Number(req.query.priceMax);
            } else {
                filters.product_price = {
                    $lte: Number(req.query.priceMax),
                };
            }
        }

        let sort = {};

        if (req.query.sort === "price-desc") {
            sort.product_price = -1;
        }
        if (req.query.sort === "price-asc") {
            sort.product_price = 1;
        }

        let page;
        // forcer à afficher la page 1 si la query page n'est pas envoyée ou est envoyée avec 0 ou < -1
        if (req.query.page < 1) {
            page = 1;
        } else {
            // sinon, page est égale à ce qui est demandé
            page = Number(req.query.page);
        }

        // SKIP = ignorer les n premiers résultats
        // L'utilisateur demande la page 1 (on ignore les 0 premiers résultats)
        // (page - 1) * limit = 0

        // L'utilisateur demande la page 2 (on ignore les limit premiers résultats)
        // (page - 1) * limit = 5 (si limit = 5)

        let limit = Number(req.query.limit);

        // Renvoie le nombre de résultats trouvés en fonction des filters

        const offers = await Offer.find(filters)
            .populate({
                path: "owner",
                select: "account",
            })
            .sort(sort)
            .skip((page - 1) * limit) // ignorer les x résultats
            .limit(limit); // renvoyer y résultats

        // cette ligne va nous retourner le nombre d'annonces trouvées en fonction des filtres
        const count = await Offer.countDocuments(filters);

        res.json({
            count: count,
            offers: offers,
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get Offer Params method

router.get("/offer/:id", async (req, res) => {
    try {
        const offer = await Offer.findById(req.params.id).populate({
            path: "owner",
            select: "account.username account.phone account.avatar",
        });
        res.json(offer);
    } catch (error) {
        console.log(error.message);
        res.status(400).json({ message: error.message });
    }
});

// UPDATE OFFER

router.put("/offer/update/:id", isAuthenticated, async (req, res) => {
    const offerToModify = await Offer.findById(req.params.id);
    try {
        if (req.fields.title) {
            offerToModify.product_name = req.fields.title;
        }
        if (req.fields.description) {
            offerToModify.product_description = req.fields.description;
        }
        if (req.fields.price) {
            offerToModify.product_price = req.fields.price;
        }

        const details = offerToModify.product_details;
        for (i = 0; i < details.length; i++) {
            if (details[i].MARQUE) {
                if (req.fields.brand) {
                    details[i].MARQUE = req.fields.brand;
                }
            }
            if (details[i].TAILLE) {
                if (req.fields.size) {
                    details[i].TAILLE = req.fields.size;
                }
            }
            if (details[i].ÉTAT) {
                if (req.fields.condition) {
                    details[i].ÉTAT = req.fields.condition;
                }
            }
            if (details[i].COULEUR) {
                if (req.fields.color) {
                    details[i].COULEUR = req.fields.color;
                }
            }
            if (details[i].EMPLACEMENT) {
                if (req.fields.location) {
                    details[i].EMPLACEMENT = req.fields.location;
                }
            }
        }

        // Notifie Mongoose que l'on a modifié le tableau product_details
        offerToModify.markModified("product_details");

        if (req.files.picture) {
            const result = await cloudinary.uploader.upload(
                req.files.picture.path,
                {
                    public_id: `/vinted/offers/${offerToModify._id}/preview`,
                }
            );
            offerToModify.product_image = result;
        }

        await offerToModify.save();

        res.status(200).json("Offer modified succesfully !");
    } catch (error) {
        console.log(error.message);
        res.status(400).json({ error: error.message });
    }
});

// DELETE OFFER

router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
    try {
        offerToDelete = await Offer.findByIdAndDelete(req.params.id);
        console.log(offerToDelete);

        res.status(200).json("Offer deleted succesfully !");
    } catch (error) {
        console.log(error.message);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
