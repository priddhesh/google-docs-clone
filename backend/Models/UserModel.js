const { pool } = require("../Utilities/dbConfig");

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

module.exports = {
  updateAccess,
  updateJWT,
  checkDuplicateUserId,
  register,
  getJWT,
  getUserID,
  getOwnerID,
  getOwnerEmail,
  checkAuhtorized,
};
