const Joi = require("joi");

const validatePostCreation = (data) => {
  const schema = Joi.object({
    // title: Joi.string().min(3).max(100).required(),
    content: Joi.string().min(10).required(),
    mediaIds: Joi.array().items(Joi.string().length(24)),
  });
  return schema.validate(data);
};

module.exports = { validatePostCreation };
