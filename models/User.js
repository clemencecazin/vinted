const mongoose = require("mongoose");

const User = mongoose.model("User", {
    email: {
        unique: true, // Je peux rentrer un  user que si cet e-mail n'existe pas
        type: String,
    },
    account: {
        username: {
            required: true, // Je peux pas créer un nouveau user si pas username
            type: String,
        },
        phone: String,
        avatar: Object, // nous verrons plus tard comment uploader une image
    },
    token: String,
    hash: String,
    salt: String,
});

module.exports = User;
