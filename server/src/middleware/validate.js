const apiResponse = require('../utils/apiResponse');

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return apiResponse.error(res, 'Validation failed', 400, messages);
    }
    next();
  };
};

module.exports = validate;
