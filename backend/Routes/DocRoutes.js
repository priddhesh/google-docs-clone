const express = require("express");
const router = express.Router();
const {
  doc,
  changeDocTitle,
  updateRecentDocument,
  recentDocs,
  docOwnerEmail,
  searchDocuments,
  templates,
} = require("../Controllers/DocController");

router.post("/doc", doc);
router.post("/changeDocTitle", changeDocTitle);
router.post("/updateRecentDocs", updateRecentDocument);
router.post("/recentDocs", recentDocs);
router.post("/docOwnerEmail", docOwnerEmail);
router.post("/searchDocs",searchDocuments);
router.get("/templates",templates);
module.exports = router;
