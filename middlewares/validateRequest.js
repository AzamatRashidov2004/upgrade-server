const validateRequest = (schema) => async (req, res, next) => {
  try {
    await schema.validateAsync(req.body, { abortEarly: false });
    next();
  } catch (error) {
    const errors = error.details.map((detail) => ({
      field: detail.context.key,
      message: detail.message,
    }));

    res.status(400).json({
      error: "Validation failed",
      details: errors,
    });
  }
};

module.exports = validateRequest;
