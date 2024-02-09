const { Server } = require("socket.io");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const {encrypt,decrypt}  = require("./Utilities/Crypto");
const app = express();
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
};

passport.use(
  new GoogleStrategy(
    {
      clientID:
        "643066909657-3d9qhdkckl1iqh0ok3vr47b58llrv31o.apps.googleusercontent.com",
      clientSecret: "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",
      callbackURL: `http://localhost:5001/auth/google/redirect`,
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

app.use(passport.initialize());
app.use(express.json());
app.use(cors(corsOptions));
app.use(
  session({
    secret: "test",
    resave: true,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.session());

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/redirect",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res) => {
    try {
      const user = {
        email: req.user._json.email,
      };
      //const data = await checkRegistered(req.user._json.email);
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: "1h" });
      if (token != "") {
        let val = await updateJWT(user.email, token);
        if (req.hostname === "localhost") {
          res.cookie("email", email, { httpOnly: true, secure: false });
        }
        // } else if (req.hostname === "*.webmobi.in") {
        //   res.cookie("email", email, {
        //     httpOnly: true,
        //     secure: true,
        //     sameSite: "None",
        //   });
        // } else if (req.hostname === "*.webmobi.com") {
        //   res.cookie("email", email, {
        //     httpOnly: true,
        //     secure: true,
        //     sameSite: "Strict",
        //   });
        // }
        res.redirect(`http://localhost:3000/home`);
      } else {
        console.log("Login failed for user: ", email);
        res.status(401).send({ success: false });
      }
    } catch (error) {
      console.log(error);
      return error;
    }
  }
);

const {
  getDocument,
  updateDocument,
  addNewID,
  updateDocTitle,
  getDocInfo,
  updateRecentDoc,
  getRecentDocs,
  searchDoc,
  getTemplates,
  getTemplateData,
  updateVersion,
  getVersions,
} = require("./Models/DocModel");

const {
  updateAccess,
  updateJWT,
  checkDuplicateUserId,
  register,
  getJWT,
  getUserID,
  getOwnerID,
  getOwnerEmail,
  checkAuhtorized,
} = require("./Models/UserModel");

const { checkValidUser } = require("./database/db");

const DocRouter = require("./Routes/DocRoutes");
app.use("/", DocRouter);

const io = new Server(5000, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

async function verifyToken(req, res, next) {
  let email = req.cookies.email;
  let token = await getJWT(email);
  if (token[0].length !== 0) {
    token = token[0][0].jwt_token;
  } else {
    token = undefined;
  }
  if (token != undefined) {
    (req.token = token), next();
  } else {
    res.send({ result: "Token is not valid" });
  }
}

async function generateRandomDigitNumber() {
  let randomDigits = "";
  for (let i = 0; i < 5; i++) {
    randomDigits += Math.floor(Math.random() * 10);
  }
  const firstDigit = Math.floor(Math.random() * 9) + 1;
  const randomNumber = `${firstDigit}${randomDigits}`;
  return randomNumber;
}

io.on("connection", (socket) => {
  socket.on(
    "get-document",
    async (documentId, email, templateID, templateTitle) => {
      let userID = await getUserID(email);
      userID = userID[0][0].user_id;
      let templateData = "";
      if (templateID != "" && templateID != undefined && templateID != null) {
        templateData = await getTemplateData(templateID);
        templateData = templateData[0][0].data;
      } else {
        templateTitle = "";
      }
      //let encryptedData = encrypt(templateData);
      await addNewID(documentId, userID, email, templateData, templateTitle);
      const document = await getDocument(documentId);
      if (document[0][0].data.length != 0) {
        let info = JSON.parse(document[0][0].data);
        //let decryptedData = decrypt(info);
        socket.join(documentId);
        socket.emit("load-document", info);
      }

      socket.on("send-changes", (delta) => {
        socket.broadcast.to(documentId).emit("receive-changes", delta);
      });

      socket.on("save-document", async (data) => {
        await updateDocument(documentId, JSON.stringify(data.ops));
        await updateVersion(documentId, JSON.stringify(data.ops));
      });
    }
  );
});

app.post("/updateAccess", async (req, res) => {
  try {
    const { doc_id, email, role, notify, message } = req.body;
    let val = await updateAccess(doc_id, email, role);
    let allowedMailIDs = await checkAuhtorized(doc_id, email);
    allowedMailIDs = allowedMailIDs[0][0].access_to;
    allowedMailIDs = JSON.parse(allowedMailIDs);
    res.send(allowedMailIDs);
  } catch (error) {
    console.log(error);
    return error;
  }
});

app.post("/checkAuthorized", async (req, res) => {
  try {
    const { doc_id, email } = req.body;
    let allowedMailIDs = await checkAuhtorized(doc_id, email);
    if (allowedMailIDs[0][0] == undefined) {
      res.cookie("role", "0", { httpOnly: true, secure: false });
      res.send({ success: true, role: "0" });
    } else {
      allowedMailIDs = allowedMailIDs[0][0].access_to;
      allowedMailIDs = JSON.parse(allowedMailIDs);

      for (let i = 0; i < allowedMailIDs.length; i++) {
        let emaiID = allowedMailIDs[i].split("-")[0];
        let role = allowedMailIDs[i].split("-")[1];
        if (emaiID == email) {
          res.cookie("role", role, { httpOnly: true, secure: false });
          res.status(200).send({ success: true, role: role });
          return;
        }
      }
      res.status(404).send({ success: false });
    }
  } catch (error) {
    console.log(error);
    return error;
  }
});

app.post("/getUsersWithAccess", async (req, res) => {
  try {
    const { doc_id } = req.body;
    let allowedMailIDs = await checkAuhtorized(doc_id);
    if (allowedMailIDs[0][0] !== undefined) {
      allowedMailIDs = allowedMailIDs[0][0].access_to;
      res.send(allowedMailIDs);
    } else {
      let ownerEmail = req.cookies.email;
      res.send([`${ownerEmail}-0`]);
    }
  } catch (error) {
    console.error("Error in handling request:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/api/register", async (req, res) => {
  let email = req.body.email;
  let password = req.body.password;

  while (true) {
    let userID = await generateRandomDigitNumber();
    let check = await checkDuplicateUserId(userID);
    if (check.success) {
      let res = await register(userID, email, password);
      break;
    }
  }
  res.send({ success: true });
});

app.post("/api/signin", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  let data = await checkValidUser(email, password);
  if (data[0].length !== 0) {
    const user = {
      email: data[0][0].email,
    };
    const token = jwt.sign({ user }, "riddhesh", { expiresIn: "1h" });
    let val = await updateJWT(email, token);
    res.cookie("email", email, { httpOnly: true, secure: false });
    res.json({ token });
  } else {
    console.log("Login failed for user: ", email);
    res.status(401).send({ success: false });
  }
});

app.get("/api/authorize", verifyToken, (req, res) => {
  jwt.verify(req.token, "riddhesh", (err, authData) => {
    if (err) {
      res.send({ result: "invalid token" });
    } else {
      res.json({
        message: "access allowed",
        authData,
      });
    }
  });
});

app.get("/test", async (req, res) => {
  try {
    res.clearCookie("email");
    res.send({ success: true });
  } catch (error) {
    console.log(error);
    return error;
  }
});

app.get("/email", async (req, res) => {
  try {
    let userID = await getUserID(req.cookies.email);
    userID = userID[0][0].user_id;
    res.send({ email: req.cookies.email, userID: userID });
  } catch (error) {
    console.log(error);
    return error;
  }
});

app.get("/api/logout", async (req, res) => {
  res.clearCookie("email");
  res.send({ success: true });
});

app.post("/docOwnerID", async (req, res) => {
  try {
    const { doc_id } = req.body;

    let ownerID;

    if (doc_id) {
      ownerID = await getOwnerID(doc_id, undefined);

      if (ownerID[0][0] !== undefined) {
        ownerID = ownerID[0][0].user_id;
        return res.send(ownerID);
      }
    }

    let email = req.cookies.email;
    ownerID = await getOwnerID(undefined, email);

    if (ownerID[0][0] !== undefined) {
      ownerID = ownerID[0][0].user_id;
      return res.send(ownerID);
    }

    res.status(404).send("Owner ID not found");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/role", async (req, res) => {
  try {
    let role = req.cookies.role;
    res.send({ role: role });
  } catch (error) {
    console.log(error);
    return error;
  }
});

app.post("/versions", async (req, res) => {
  try {
    const { doc_id } = req.body;
    let data = await getVersions(doc_id);
    data = data[0][0].version;
    data = Buffer.from(data, "hex");
    data = data.toString("utf-8");
    res.send(data);
  } catch (error) {
    console.log(error);
    return error;
  }
});
app.listen(5001, () => {
  console.log("running on 5001...");
});
