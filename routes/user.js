const express = require("express");
const router = express.Router();

// Générer l'encryptage
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const User = require("../models/User");

// SIGN  UP

router.post("/user/signup", async (req, res) => {
    try {
        const user = await User.findOne({ email: req.fields.email });
        // console.log(req.fields.email)
        // console.log(user);
        // console.log(user.account.username);
        // console.log(req.fields.username);

        if (!user) {
            // Si non, on fait la suite...
            // est-ce que je reçois tout ce qu'il faut ? (email, username, password)
            if (
                req.fields.email &&
                req.fields.username &&
                req.fields.password
            ) {
                // Je peux faire la création
                // Etape 1 : encrypter le mot de passe
                const salt = uid2(64);
                const hash = SHA256(req.fields.password + salt).toString(
                    encBase64
                );
                const token = uid2(64);
                // Etape 2 : créer le nouvel utilisateur
                const newUser = new User({
                    email: req.fields.email,
                    account: {
                        username: req.fields.username,
                        phone: req.fields.phone,
                    },
                    token: token,
                    hash: hash,
                    salt: salt,
                });
                // Etape 3 : sauvegarde de l'utilisateur
                await newUser.save();
                // Etape 4 : répondre au client
                res.status(200).json({
                    _id: newUser._id,
                    token: newUser.token,
                    account: {
                        username: newUser.account.username,
                        phone: newUser.account.phone,
                    },
                });
            } else {
                res.status(400).json({ message: "Missing parameters" });
            }
        } else {
            // Si oui, on renvoie un message d'erreur
            res.status(400).json({
                message: "This email already has an account",
            });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// LOGIN

router.post("/user/login", async (req, res) => {
    try {
        const loginUser = await User.findOne({ email: req.fields.email });
        // console.log(req.fields.email);
        // console.log(loginUser.salt);
        // console.log(req.fields.password);

        // Si le User est recoonnu dans la BBD grâce à son mail
        if (loginUser) {
            console.log("Hash BDD", loginUser.hash);

            // On génère le mot de passe hash, grâce au salt de la BDD du user et le password qu'il a rentré dans le BODY

            const newHash = SHA256(
                req.fields.password + loginUser.salt
            ).toString(encBase64);
            console.log("New Hash", newHash);

            // Check Hash : Vérifie si le newHash est égale à celui qui est dans la base de donnée

            if (newHash === loginUser.hash) {
                res.status(200).json({
                    _id: loginUser._id,
                    token: loginUser.token,
                    account: {
                        username: loginUser.account.username,
                        phone: loginUser.account.phone,
                    },
                });
            } else {
                res.status(401).json({
                    message: "Unauthorized",
                }); // Si le password n'est pas bon
            }
        } else {
            res.status(401).json({
                message: "Unauthorized",
            }); // Si le nom d'utilisateur n'est pas bon
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
