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
} = require("../Models/DocModel");

const { getOwnerEmail } = require("../Models/UserModel");

const doc = async (req, res) => {
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
};

const changeDocTitle = async (req, res) => {
  try {
    let { docTitle, docID } = req.body;
    let data = await updateDocTitle(docID, docTitle);

    res.send({ success: true });
  } catch (error) {
    console.log(error);
    return error;
  }
};

const updateRecentDocument = async (req, res) => {
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
};

const recentDocs = async (req, res) => {
  try {
    let { user_id } = req.body;
    let docID = [];
    let docDate = [];
    let docTime = [];
    let docTitle = [];
    let data = await getRecentDocs(user_id);
    if (data[0][0].recently_accessed != null) {
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
};

const docOwnerEmail = async (req, res) => {
  try {
    const { ownerID } = req.body;
    let ownerEmail = await getOwnerEmail(ownerID);
    ownerEmail = ownerEmail[0][0];
    res.send(ownerEmail);
  } catch (error) {
    console.log(error);
    return error;
  }
};

const searchDocuments = async (req, res) => {
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
  };

  const templates = async (req, res) => {
    try {
      let data = await getTemplates();
      data = data[0];
      res.send(data);
    } catch (error) {
      console.log(error);
      return error;
    }
  };

module.exports = {
  doc,
  changeDocTitle,
  updateRecentDocument,
  recentDocs,
  docOwnerEmail,
  searchDocuments,
  templates,
};
