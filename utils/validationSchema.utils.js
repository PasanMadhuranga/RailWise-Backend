import BaseJoi from 'joi';
import sanitizeHtml from 'sanitize-html';

const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML!'
    },
    rules: {
        escapeHTML: {
            validate(value, helpers) {
                const clean = sanitizeHtml(value, {
                    allowedTags: [],
                    allowedAttributes: {},
                });
                if (clean !== value) return helpers.error('string.escapeHTML', { value })
                return clean;
            }
        }
    }
});

const Joi = BaseJoi.extend(extension)

export const pendingSchema = Joi.object({
    userId: Joi.string().allow(null),  
    scheduleId: Joi.string().required(),
    date: Joi.date().min('now').required(),
    fromHaltId: Joi.string().required(),
    toHaltId: Joi.string().required(),
    selectedSeatIds: Joi.array().items(Joi.string()).required(),
    selectedClassId: Joi.string().required(),
});

export const userRegistrationSchema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(6).required(),
});