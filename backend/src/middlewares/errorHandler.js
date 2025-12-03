// src/middlewares/errorHandler.js

module.exports = (err, req, res, next) => {
  console.error("🔥 ERROR:", err);

  let statusCode = err.statusCode || 500;
  let message = err.message || "Server xatosi";

  // -------------------------
  // 1) Mongoose: CastError (invalid ObjectId)
  // -------------------------
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Noto‘g‘ri ID: ${err.value}`;
  }

  // -------------------------
  // 2) Mongoose: ValidationError
  // -------------------------
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // -------------------------
  // 3) Mongoose: Duplicate key error (E11000)
  // -------------------------
  if (err.code === 11000) {
    statusCode = 400;

    const field = Object.keys(err.keyValue)[0];
    message = `${field} qiymati allaqachon mavjud`;
  }

  // -------------------------
  // 4) JSON Parse Error
  // -------------------------
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "JSON noto‘g‘ri formatda yuborildi";
  }

  // -------------------------
  // 5) Multer Errors
  // -------------------------
  if (err.code === "LIMIT_FILE_SIZE") {
    statusCode = 400;
    message = "Fayl hajmi juda katta. Limit = 10MB";
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    statusCode = 400;
    message = `Noto‘g‘ri fayl turi: ${err.field}`;
  }

  // -------------------------
  // 6) JWT Errors
  // -------------------------
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Token noto‘g‘ri yoki buzilgan";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token muddati tugagan. Qayta login qiling.";
  }

  // -------------------------
  // 7) Express Validator / Joi Errors
  // -------------------------
  if (err.details && Array.isArray(err.details)) {
    statusCode = 400;
    message = err.details.map((d) => d.message).join(", ");
  }

  // -------------------------
  // 8) Custom error handling
  // -------------------------
  if (err.isCustom) {
    statusCode = err.statusCode || 400;
    message = err.message;
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
};
