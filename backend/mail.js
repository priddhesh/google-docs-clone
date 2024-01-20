const nodemailer = require("nodemailer");
const express = require("express");
const cors = require("cors");

const app = express();
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(express.json());
app.use(cors(corsOptions));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "demoprojectid123@gmail.com",
    pass: "zcgp dkct pjvr inxz",
  },
});

app.post("/mail", (req, res) => {
  try {
    const {receiverEmail, message} = req.body;
    const mailOptions = {
      from: "demoprojectid123@gmail.com",
      to: `${receiverEmail}`,
      subject: "Request to access a doc",
      text:`${message}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
      } else {
        console.log("Email sent:", info.response);
      }
    });
  } catch (error) {
    console.log(error);
    return error;
  }
});

app.listen(5002, () => {
  console.log("Running on port 5002");
});
