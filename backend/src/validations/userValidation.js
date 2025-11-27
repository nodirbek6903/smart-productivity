const Joi = require("joi");

exports.userValidation = {
  create: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Email formati noto'g'ri",
      "any.required": "Email majburiy"
    }),
    password: Joi.string().min(8).required().messages({
      "string.min": "Parol kamida 8 ta belgidan iborat bo'lishi kerak",
      "any.required": "Parol majburiy"
    }),
    fullName: Joi.string().min(3).required().messages({
      "string.min": "Ism kamida 3ta belgidan iborat bo'lishi kerak",
      "any.required": "To'liq ism majburiy"
    }),
    phone: Joi.string()
      .pattern(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .optional(),
    role: Joi.string().required().messages({
      "any.required": "Rol majburiy"
    }),
    department: Joi.string().optional(),
    position: Joi.string().optional()
  }),

  update: Joi.object({
    fullName: Joi.string().min(3).optional(),
    phone: Joi.string()
      .pattern(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)
      .optional(),
    position: Joi.string().optional(),
    department: Joi.string().optional(),
    role: Joi.string().optional(),
    isActive: Joi.boolean().optional()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      "any.required": "Joriy parol majburiy"
    }),
    newPassword: Joi.string().min(8).required().messages({
      "string.min": "Yangi parol kamida 8 ta belgidan iborat bo'lishi kerak",
      "any.required": "Yangi parol majburiy"
    })
  })
};
