import { body, validationResult } from 'express-validator';

/**
 * Password policy: length first, then a letter and a number.
 * Length is the property that actually resists cracking, which is why 8 is the
 * floor and character-class rules are kept deliberately light.
 */
export const signupRules = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters.'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter.')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number.'),
];

export const loginRules = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Enter a valid email address.')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

/** Turns validation failures into a field-keyed 422 the form can render inline. */
export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const fields = {};
  for (const issue of result.array()) {
    if (!fields[issue.path]) fields[issue.path] = issue.msg;
  }

  return res.status(422).json({
    error: {
      message: 'Please fix the highlighted fields.',
      code: 'VALIDATION_FAILED',
      fields,
    },
  });
}
