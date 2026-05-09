const mongoose = require('mongoose');
const Certificate = require('./models/Certificate');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const count = await Certificate.countDocuments();
        console.log(`Total certificates: ${count}`);
        if (count > 0) {
            const cert = await Certificate.findOne();
            console.log(`Sample Certificate ID: ${cert.certificateId}`);
        } else {
            console.log('No certificates found.');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
