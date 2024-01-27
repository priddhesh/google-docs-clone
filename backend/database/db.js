require("dotenv").config();
const e = require("express");
const mysql = require("mysql2");

const pool = mysql
  .createPool({
    host: "localhost",
    user: "root",
    password: "riddhesh@12345",
    port: 3306,
    database: "docs",
  })
  .promise();

const getDocument = async (id) => {
  try {
    let res = await pool.query(
      `SELECT CAST(data AS CHAR) AS data FROM docs WHERE doc_id = ?`,
      [id]
    );
    return res;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const updateDocument = async (id, data) => {
  try {
    let res = await pool.query(`UPDATE docs SET data = ? WHERE doc_id = ?`, [
      data,
      id,
    ]);
    return res;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const addNewID = async (id, uid, email, data, title) => {
  try {
    let access_to = `["${email}-0"]`;

    let res = await pool.query(`SELECT doc_id FROM docs WHERE doc_id=?`, [id]);
    if (res[0].length === 0) {
      await pool.query(
        `INSERT INTO docs(user_id,doc_id,title,data,access_to) VALUES(?,?,?,?,?)`,
        [uid, id, title, data, access_to]
      );
      await pool.query(`INSERT INTO versions(doc_id,version) VALUES(?,?)`, [
        id,
        "[]",
      ]);
    }
    return;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const updateAccess = async (id, email, role) => {
  try {
    let roleID = -1,
      present = 0;
    if (role === "Viewer") roleID = 1;
    else if (role === "Editor") roleID = 2;
    let userList = await pool.query(
      `SELECT access_to FROM docs WHERE doc_id = ?`,
      [id]
    );
    userList = userList[0][0].access_to;
    if (userList == null) {
      userList = [];
    } else {
      userList = JSON.parse(userList);
    }
    for (let i = 0; i < userList.length; i++) {
      let userEmail = userList[i].split("-")[0];
      if (userEmail == email) {
        present = 1;
        userList[i] = `${email}-${roleID}`;
      }
    }
    if (present != 1) {
      userList.push(`${email}-${roleID}`);
    }
    userList = JSON.stringify(userList);
    let updatedData = await pool.query(
      `UPDATE docs SET access_to = ? WHERE doc_id=?`,
      [userList, id]
    );

    return updatedData;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const checkAuhtorized = async (doc_id, email) => {
  try {
    let allowedMailIDs = await pool.query(
      `SELECT access_to FROM docs WHERE doc_id = ?`,
      [doc_id]
    );
    return allowedMailIDs;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const checkValidUser = async (email, password) => {
  try {
    let res = pool.query(
      `SELECT * FROM users WHERE email = ? AND password = ?`,
      [email, password]
    );

    return res;
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};

const updateJWT = async (email, jwt) => {
  try {
    let res = pool.query(`UPDATE users SET jwt_token = ? WHERE email = ?`, [
      jwt,
      email,
    ]);

    return res;
  } catch (error) {
    console.log(error);
    res.send({ success: false });
  }
};

const checkDuplicateUserId = async (id) => {
  try {
    let [data] = await pool.query(
      `SELECT user_id FROM users WHERE user_id = ?`,
      [id]
    );
    if (data.length == 0) {
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};

const register = async (user_id, email, password) => {
  try {
    let recentlyAccessed = "[]";
    let data = pool.query(
      `INSERT INTO users(user_id,email,password,recently_accessed) VALUES(?,?,?,?)`,
      [user_id, email, password, recentlyAccessed]
    );

    return data;
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};

const getJWT = async (email) => {
  try {
    let res = pool.query(`SELECT jwt_token FROM users WHERE email = ?`, [
      email,
    ]);

    return res;
  } catch (error) {
    console.log(error);
    return { success: false };
  }
};

const updateDocTitle = async (docID, docTitle) => {
  try {
    let data = await pool.query(`UPDATE docs SET title = ? WHERE doc_id = ?`, [
      docTitle,
      docID,
    ]);

    return data;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const getDocInfo = async (docID) => {
  try {
    let data = await pool.query(`SELECT * FROM docs WHERE doc_id = ?`, [docID]);
    return data;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const getUserID = async (email) => {
  try {
    let id = await pool.query(`SELECT user_id FROM users WHERE email = ?`, [
      email,
    ]);

    return id;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const getOwnerID = async (id, email) => {
  try {
    if (id != undefined) {
      let ownerID = await pool.query(
        `SELECT user_id FROM docs WHERE doc_id = ?`,
        [id]
      );

      return ownerID;
    }
    let ownerID = await pool.query(
      `SELECT user_id FROM users WHERE email = ?`,
      [email]
    );

    return ownerID;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const getOwnerEmail = async (ownerID) => {
  try {
    let ownerEmail = await pool.query(
      `SELECT email FROM users WHERE user_id = ?`,
      [ownerID]
    );

    return ownerEmail;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const updateRecentDoc = async (doc_id, email, currentTime, currentDate) => {
  try {
    let recently_accessed = await pool.query(
      `SELECT recently_accessed FROM users WHERE email = ?`,
      [email]
    );
    recently_accessed = recently_accessed[0][0].recently_accessed;
    recently_accessed = JSON.parse(recently_accessed);
    for (let idx = 0; idx < recently_accessed.length; idx++) {
      let data = recently_accessed[idx];
      let docID = data.split(" ")[0];
      if (docID === doc_id) {
        recently_accessed.splice(idx, 1);
        break;
      }
    }
    recently_accessed.unshift(`${doc_id} ${currentDate} ${currentTime}`);
    if (recently_accessed.length > 50) recently_accessed.pop();
    recently_accessed = JSON.stringify(recently_accessed);
    let updatedRecentlyAccessed = await pool.query(
      `UPDATE users SET recently_accessed = ? WHERE email = ?`,
      [recently_accessed, email]
    );
    return updatedRecentlyAccessed;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const getRecentDocs = async (user_id) => {
  try {
    let data = await pool.query(
      `SELECT recently_accessed FROM users WHERE user_id = ?`,
      [user_id]
    );
    return data;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const searchDoc = async (user_id, search) => {
  try {
    function countOccurrences(mainString, subString) {
      let count = 0;
      let position = mainString.indexOf(subString);

      while (position !== -1) {
        count++;
        position = mainString.indexOf(subString, position + 1);
      }

      return count;
    }

    let accessedDocIDs = [];
    if (search.length > 0) {
      const withoutSpaces = search.replace(/\s/g, "");
      const lowercaseSearch = withoutSpaces.toLowerCase();
      let userEmail = await getOwnerEmail(user_id);
      userEmail = userEmail[0][0].email;

      let allDocs = await pool.query(`SELECT * FROM docs`);
      allDocs = allDocs[0];
      allDocs.map((doc) => {
        let data = doc.data.toString();
        let access_to = doc.access_to;
        access_to = JSON.parse(access_to);
        let isAllowed = false;
        for (let i = 0; i < access_to.length; i++) {
          let userWithAccessEmail = access_to[i].split("-")[0];
          if (userWithAccessEmail == userEmail) {
            isAllowed = true;
            break;
          }
        }
        if (isAllowed) {
          if (doc.title != null) {
            let withoutSpacesTitle = doc.title.replace(/\s/g, "");
            let lowercaseTitle = withoutSpacesTitle.toLowerCase();
            let wordCountTitle = countOccurrences(
              lowercaseTitle,
              lowercaseSearch
            );
            let wordCountData = countOccurrences(data, lowercaseSearch);
            if (wordCountTitle + wordCountData != 0) {
              accessedDocIDs.push([wordCountTitle + wordCountData, doc.doc_id]);
            }
          }
        }
      });
      accessedDocIDs.sort((a, b) => b[0] - a[0]);
      accessedDocIDs = accessedDocIDs.splice(0, 6);
    }
    return accessedDocIDs;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const getTemplates = async () => {
  try {
    let templates = await pool.query(`SELECT * FROM templates`);

    return templates;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const getTemplateData = async (templateID) => {
  try {
    templateID = `template${templateID}`;
    let data = await pool.query(`SELECT data FROM templates WHERE doc_id=?`, [
      templateID,
    ]);

    return data;
  } catch (error) {
    console.log(error);
    return error;
  }
};
let ans = [];
const updateVersion = async (docID, data) => {
  try {
    let id = await pool.query(`SELECT doc_id FROM versions WHERE doc_id=?`, [
      docID,
    ]);
    id = id[0][0];
    const currentDate = new Date();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const day = currentDate.getDate();
    const hours = currentDate.getHours();
    const minutes = currentDate.getMinutes();
    const seconds = currentDate.getSeconds();

    const dateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    let res = await pool.query(`SELECT version FROM versions WHERE doc_id=?`, [
      docID,
    ]);
    let versions = res[0];
    if (versions.length == 0) {
      versions = [];
      versions.push({
        data: `${data}`,
        time: `${dateTime}`,
      });
    } else {
      versions = versions[0].version;
      versions = Buffer.from(versions, "hex");
      versions = versions.toString("utf-8");
      versions = JSON.parse(versions);
      let prevVersionTimeDate = versions[0].time;
      prevVersionTimeDate = new Date(prevVersionTimeDate);
      let currentVersionTimeDate = new Date();

      let timeDifference = currentVersionTimeDate - prevVersionTimeDate;

      let differenceInMinutes = timeDifference / (1000 * 60);
      if (differenceInMinutes > 30) {
        versions.unshift({
          data: `${data}`,
          time: `${dateTime}`,
        });
        if (versions.length > 10) {
          versions.pop();
        }
      } else {
        versions[0] = {
          data: `${data}`,
          time: `${dateTime}`,
        };
      }
    }
    versions = JSON.stringify(versions);
    if (id === undefined) {
      await pool.query(`INSERT INTO versions VALUES(?,?)`, [docID, versions]);
    } else {
      await pool.query(`UPDATE versions SET version = ? WHERE doc_id = ?`, [
        versions,
        docID,
      ]);
    }
    return res;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const getVersions = async (id)=>{
   let data = await pool.query(`SELECT version FROM versions WHERE doc_id = ?`,[id]);

   return data;
}
module.exports = {
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
};
