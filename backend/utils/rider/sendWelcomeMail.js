const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

// Transporter setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.PRODUCT_EMAIL,
        pass: process.env.PRODUCT_EMAIL_PASSWORD
    }
});

// Function to get the email template
const getWelcomeEmailTemplate = (displayName) => {
    try {
        let template = fs.readFileSync(
            path.join(__dirname, "../../templates/", "welcomeEmail.html"),
            "utf8"
        );
        return template.replace(/{{displayName}}/g, displayName);
    } catch (err) {
        console.error("❌ Error reading email template:", err);
        return `<h2>Welcome, ${displayName}!</h2><p>Thank you for joining RideMate.</p>`; // Fallback template
    }
};

// Function to send the welcome email
const sendWelcomeEmail = async (email, displayName) => {
    console.log("Send mail function ",displayName,"   : ",email);
    const mailOptions = {
        from: `"RideMate Support" <${process.env.PRODUCT_EMAIL}>`,
        to: email,
        subject: "Welcome to RideMate!!",
        html: getWelcomeEmailTemplate(displayName)
    };

    try {
        await transporter.verify(); 
        await transporter.sendMail(mailOptions);
        console.log(`✅ Welcome mail sent to ${email}`);
    } catch (error) {
        console.error("❌ Error sending mail:", error);
    }
};

module.exports = { sendWelcomeEmail };
