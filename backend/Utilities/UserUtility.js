async function generateRandomDigitNumber() {
  let randomDigits = "";
  for (let i = 0; i < 5; i++) {
    randomDigits += Math.floor(Math.random() * 10);
  }
  const firstDigit = Math.floor(Math.random() * 9) + 1;
  const randomNumber = `${firstDigit}${randomDigits}`;
  return randomNumber;
}

module.exports = {
  generateRandomDigitNumber,
};
