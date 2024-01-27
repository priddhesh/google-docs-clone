const { Server } = require("socket.io");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();
const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  optionsSuccessStatus: 200,
};


passport.use(
  new GoogleStrategy(
    {
      clientID: "643066909657-3d9qhdkckl1iqh0ok3vr47b58llrv31o.apps.googleusercontent.com",
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
  updateAccess,
  checkAuhtorized,
  checkValidUser,
  updateJWT,
  checkDuplicateUserId,
  register,
  getJWT,
  updateDocTitle,
  getDocInfo,
  getUserID,
  getOwnerID,
  getOwnerEmail,
  updateRecentDoc,
  getRecentDocs,
  searchDoc,
  getTemplates,
  getTemplateData,
  updateVersion,
  getVersions,
} = require("./database/db");
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
  socket.on("get-document", async (documentId, email,templateID,templateTitle) => {
    let userID = await getUserID(email);
    userID = userID[0][0].user_id;
    let templateData = "";
    if(templateID!="" && templateID!=undefined && templateID!=null){
      templateData = await getTemplateData(templateID);
      templateData = templateData[0][0].data;
    }else{
      templateTitle = "";
    }
    await addNewID(documentId, userID, email,templateData,templateTitle);
    const document = await getDocument(documentId);
    if (document[0][0].data.length != 0) {
      let info = JSON.parse(document[0][0].data);
      socket.join(documentId);
      socket.emit("load-document", info);
    }

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await updateDocument(documentId, JSON.stringify(data.ops));
      await updateVersion(documentId,JSON.stringify(data.ops));
    });
  });
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

app.post("/changeDocTitle", async (req, res) => {
  try {
    let { docTitle, docID } = req.body;
    let data = await updateDocTitle(docID, docTitle);

    res.send({ success: true });
  } catch (error) {
    console.log(error);
    return error;
  }
});

app.post("/doc", async (req, res) => {
  try {
    let { docID } = req.body;
    let docInfo = await getDocInfo(docID);
    if (docInfo[0][0] != undefined) {
      docInfo = docInfo[0][0];
      res.send(docInfo);
    } else {
      res.send({ title: "" });
    }
  } catch (error) {
    console.log(error);
    return error;
  }
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

app.post("/updateRecentDocs", async (req, res) => {
  try {
    const { doc_id, email } = req.body;
    const currentTime = new Date().toLocaleTimeString();
    const currentDate = new Date().toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    let data = await updateRecentDoc(doc_id, email, currentTime, currentDate);
    res.send({ success: true });
  } catch (error) {
    console.log(error);
    return error;
  }
});

app.post("/recentDocs", async (req, res) => {
  try {
    let { user_id } = req.body;
    let docID = [];
    let docDate = [];
    let docTime = [];
    let docTitle = [];
    let data = await getRecentDocs(user_id);
    if (data[0][0].recently_accessed!=null) {
      data = data[0][0].recently_accessed;
      data = JSON.parse(data);
      async function processData(data) {
        await Promise.all(
          data.map(async (item) => {
            let doc_id = item.split(" ")[0];
            let docInfo = await getDocInfo(doc_id);
            let date = `${item.split(" ")[1]} ${item.split(" ")[2]} ${
              item.split(" ")[3]
            }`;
            let time = `${item.split(" ")[4]} ${item.split(" ")[5]}`;
            docID.push(doc_id);
            docDate.push(date);
            docTime.push(time);
            if (docInfo[0][0] != undefined) {
              docTitle.push(docInfo[0][0].title);
            } else {
              docTitle.push("");
            }
          })
        );
      }
      await processData(data);
    }
    res.send({ id: docID, date: docDate, time: docTime, title: docTitle });
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

app.post("/docOwnerEmail", async (req, res) => {
  try {
    const { ownerID } = req.body;
    let ownerEmail = await getOwnerEmail(ownerID);
    ownerEmail = ownerEmail[0][0];
    res.send(ownerEmail);
  } catch (error) {
    console.log(error);
    return error;
  }
});

app.post("/searchDocs", async (req, res) => {
  try {
    let searchedDocs = [];
    const { user_id, search } = req.body;
    const data = await searchDoc(user_id, search);
    for (let i = 0; i < data.length; i++) {
      let doc_id = data[i][1];
      let docInfo = await getDocInfo(doc_id);
      docInfo = docInfo[0][0];
      searchedDocs.push(docInfo);
    }
    res.send(searchedDocs);
  } catch (error) {
    console.log(error);
    return error;
  }
});

app.get("/templates", async (req, res) => {
  try {
    let data = await getTemplates();
    data = data[0];
    res.send(data);
  } catch (error) {
    console.log(error);
    return error;
  }
});

app.get("/role",async(req,res)=>{
   try {
     let role = req.cookies.role;
     res.send({role: role});
   } catch (error) {
    console.log(error);
    return error;
   }
});

app.post("/versions",async (req,res)=>{
  try {
    const {doc_id} = req.body;
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
