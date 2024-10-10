import BaseJoi from 'joi';

// This is a library that allows you to sanitize HTML input to prevent XSS attacks.
import sanitizeHtml from 'sanitize-html';

// This is a custom Joi extension that sanitizes HTML input.
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

// This extends the Joi library with the custom extension.
const Joi = BaseJoi.extend(extension)
// pendingBooking   schema
export const pendingSchema = Joi.object({
    userId: Joi.string().allow(null),  // userId can be a string or null
    scheduleId: Joi.string().required(),
    date: Joi.date().min('now').required(),
    fromHaltId: Joi.string().required(),
    toHaltId: Joi.string().required(),
    selectedSeatIds: Joi.array().items(Joi.string()).required(),
    selectedClassId: Joi.string().required(),
});

// for user registration
export const userRegistrationSchema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    password: Joi.string().min(6).required(),
});