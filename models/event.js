const { Schema, model } = require("mongoose");
const Joi = require("joi");

const PERIODICITY = ["none", "daily", "weekly", "monthly", "yearly"];
const PRIVACY = ["private", "public"];
const EVENT_TYPE = ["personal", "work", "holiday", "birthday", "meeting", "other"];

const eventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
    startDate: { type: String, required: true },
    endDate: { type: String, default: "" },
    periodicity: { type: String, enum: PERIODICITY, default: "none" },
    privacy: { type: String, enum: PRIVACY, default: "private" },
    eventType: { type: String, enum: EVENT_TYPE, default: "personal" },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { versionKey: false, timestamps: true }
);

const Event = model("Event", eventSchema);

const createEventJoiSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(""),
  icon: Joi.string().allow(""),
  startDate: Joi.string().required(),
  endDate: Joi.string().allow(""),
  periodicity: Joi.string().valid(...PERIODICITY),
  privacy: Joi.string().valid(...PRIVACY),
  eventType: Joi.string().valid(...EVENT_TYPE),
});

const updateEventJoiSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string().allow(""),
  icon: Joi.string().allow(""),
  startDate: Joi.string(),
  endDate: Joi.string().allow(""),
  periodicity: Joi.string().valid(...PERIODICITY),
  privacy: Joi.string().valid(...PRIVACY),
  eventType: Joi.string().valid(...EVENT_TYPE),
}).min(1);

module.exports = {
  Event,
  createEventJoiSchema,
  updateEventJoiSchema,
};
