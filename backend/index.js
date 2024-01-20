const {Server} = require('socket.io');
const express = require('express');
const cors = require("cors");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const app = express();
const corsOptions = {
    origin: "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
  };

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
} = require("./database/db");
const io = new Server(5000, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
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


io.on('connection', socket => {
    socket.on('get-document',async (documentId,email) => {
        let userID = await getUserID(email);
        userID = userID[0][0].user_id;
        await addNewID(documentId,userID,email);
        const document = await getDocument(documentId);
        if(document[0][0].data.length!=0){
        let info = JSON.parse(document[0][0].data);
        socket.join(documentId);
        socket.emit('load-document', info);
        }

        socket.on('send-changes', delta => {
            socket.broadcast.to(documentId).emit('receive-changes', delta);
        })

        socket.on('save-document', async data => {
            await updateDocument(documentId, JSON.stringify(data.ops));
        })
    })
});

app.post("/updateAccess", async (req,res)=>{
    try {
      const {doc_id,email,role,notify,message} = req.body;
      let val = await updateAccess(doc_id,email,role);
      let allowedMailIDs = await checkAuhtorized(doc_id,email);
      allowedMailIDs = allowedMailIDs[0][0].access_to;
      allowedMailIDs = JSON.parse(allowedMailIDs);

      res.send(allowedMailIDs);
      
    }catch (error) {
      console.log(error);
      return error;
    }
});

app.post("/checkAuthorized", async(req,res)=>{
    try {
      const {doc_id,email } = req.body;
      let allowedMailIDs = await checkAuhtorized(doc_id,email);
      allowedMailIDs = allowedMailIDs[0][0].access_to;
      allowedMailIDs = JSON.parse(allowedMailIDs);
      
      for(let i =0;i<allowedMailIDs.length;i++){
        let emaiID = allowedMailIDs[i].split("-")[0];
        let role = allowedMailIDs[i].split("-")[1];
        if(emaiID==email){
            res.status(200).send({success: true,role: role});
            return;
        }
      }
      res.status(404).send({success: false});
    } catch (error) {
        console.log(error);
        return error;
    }
})

app.post("/getUsersWithAccess",async(req,res)=>{
 try {
    const {doc_id} = req.body;
    let allowedMailIDs = await checkAuhtorized(doc_id);
    allowedMailIDs = allowedMailIDs[0][0].access_to;
    res.send(allowedMailIDs);
 } catch (error) {
    console.log(error);
    return error;
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

app.post("/changeDocTitle",async(req,res)=>{
  try {
    let {docTitle, docID} = req.body;
    let data = await updateDocTitle(docID,docTitle);

    res.send({success:true});
  } catch (error) {
    console.log(error);
    return error;
  }
})

app.post("/doc",async(req,res)=>{
  try {
    let {docID} = req.body;
    let docInfo = await getDocInfo(docID);
    docInfo = docInfo[0][0];
    res.send(docInfo);
  } catch (error) {
    console.log(error);
    return error;
  }
})
app.get("/test",async(req,res)=>{
  try {
    res.clearCookie("email");
    res.send({success:true});
  } catch (error) {
    console.log(error);
    return error;
  }
});

app.get("/email",async(req,res)=>{
  try {
    res.send({email: req.cookies.email});
  } catch (error) {
    console.log(error);
    return error;
  }
})

app.get("/api/logout", async (req, res) => {
  res.clearCookie("email");
  res.send({ success: true });
});

app.post("/docOwnerID", async(req,res)=>{
  try {
    const {doc_id} = req.body;
    let ownerID = await getOwnerID(doc_id);
    ownerID = ownerID[0][0].user_id;
    res.send(ownerID);
  } catch (error) {
    console.log(error);
    return error;
  }
});

app.post("/docOwnerEmail", async(req,res)=>{
  try {
    const {ownerID} = req.body;
    let ownerEmail = await getOwnerEmail(ownerID);
    ownerEmail = ownerEmail[0][0];
    res.send(ownerEmail);
  } catch (error) {
    console.log(error);
    return error;
  }
});

app.listen(5001,()=>{
    console.log("running on 5001...");
})