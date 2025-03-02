const mongoose = require('mongoose');

function connectToDb() {
    mongoose.connect(process.env.DB_URL)
        .then(() => {
            console.log('Connected to database');
        })
        .catch((err) => {
            console.error('Error connecting to database', err);
        });
}

module.exports = connectToDb;