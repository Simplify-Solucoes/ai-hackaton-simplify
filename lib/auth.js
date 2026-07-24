const crypto = require("crypto");

function hashPassword(senha, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(senha, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(senha, salt, hash) {
  const tentativa = crypto.scryptSync(senha, salt, 64).toString("hex");
  const bufTentativa = Buffer.from(tentativa, "hex");
  const bufHash = Buffer.from(hash, "hex");
  if (bufTentativa.length !== bufHash.length) return false;
  return crypto.timingSafeEqual(bufTentativa, bufHash);
}

module.exports = { hashPassword, verifyPassword };
