const { Resend } = require('resend');

const sendMail = async (options) => {
        const resend = new Resend(process.env.RESEND_KEY);

        const mailOptions = {
            from: process.env.EMAIL,
            to: options.email,
            subject: options.subject,
            text: options.message,
        };
        console.log(mailOptions,"mailOption");
        const { data, error } =  await resend.emails.send(mailOptions);
        if (error) {
            return console.error({ error });
        }
};

module.exports = sendMail;

