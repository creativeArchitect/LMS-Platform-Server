import nodemailer from 'nodemailer';
import AppError from './error.util';


//  async-await is not allowed in global scope, must use a wrapper.
const sendEmail = async (email, subject, body)=>{
    // create reusable transporter obj using the default SMTP transport
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,  // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USERNAME,
            pass: process.env.SMTP_PASSWORD,
        }
    })

    //  send mail with defined transport obj
    const info = await transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL,
        to: email,
        subject: subject,
        html: body
    });

    console.log("Message sent: " + info.messageId);
}


export default sendEmail;

