import nodemailer from "nodemailer";
const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail", 
      auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASS, // your app password
      },
    });


    const mailOptions = {
      from: `DocBooker ${process.env.EMAIL_USER}`,
      to,
      subject,
      text,
    };

    const info=await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
  } catch (error) {
    console.error("Failed to send email:", error.message);
    console.error("Full error:", error);
  }
};

export default sendEmail;
