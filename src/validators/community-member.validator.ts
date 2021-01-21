import * as Joi from 'joi';

export const IDValidator = Joi.string().custom((value, helpers) => {
  return isNaN(Number(value)) ? helpers.error('Not Numeric') : value;
});

export const RolesValidator = Joi.array().items(IDValidator);

export const NicknameValidator = Joi.string().optional().min(1).max(30);
