const crypto = require("crypto");
const algorithm = "aes-256-cbc";
const key = "5fcfd8d83e57b1b727ee6986e5b1ba49";
const iv = crypto.randomBytes(16);

const cipher = crypto.createCipheriv(algorithm, key, iv);

const encrypt = (dataToEncrypt) => {
  let encryptedData = cipher.update(dataToEncrypt, "utf-8", "hex");
  encryptedData += cipher.final("hex");
  return encryptedData;
};

const decrypt = (dataToDecrypt) => {
  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  let decryptedData = decipher.update(dataToDecrypt, "hex", "utf-8");

  decryptedData += decipher.final("utf-8");
  return decryptedData;
};
module.exports = {
  encrypt,
  decrypt,
};
