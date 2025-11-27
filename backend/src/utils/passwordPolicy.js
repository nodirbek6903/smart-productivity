// utils/passwordPolicy.js
module.exports = function validatePasswordStrength(password) {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push("Parol kamida 8 ta belgidan iborat bo‘lishi kerak.");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Parolda kamida bitta katta harf bo‘lishi kerak (A–Z).");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Parolda kamida bitta kichik harf bo‘lishi kerak (a–z).");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Parolda kamida bitta raqam bo‘lishi kerak (0–9).");
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Parolda kamida bitta maxsus belgi bo‘lishi kerak (!@#$ va h.k.).");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
