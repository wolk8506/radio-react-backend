const { Event } = require("../models");
const { NotFound, Forbidden } = require("http-errors");

const serializeEvent = e => ({
  id: e._id.toString(),
  title: e.title,
  description: e.description,
  icon: e.icon,
  startDate: e.startDate,
  endDate: e.endDate,
  periodicity: e.periodicity,
  privacy: e.privacy,
  eventType: e.eventType,
  ownerId: e.owner.toString(),
  createdAt: e.createdAt,
  updatedAt: e.updatedAt,
});

const getEvents = async (req, res) => {
  const events = await Event.find({ owner: req.user._id }).sort({ startDate: 1 });
  res.json({
    status: "success",
    code: 200,
    data: { result: events.map(serializeEvent) },
  });
};

const getEventById = async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id);
  if (!event) throw new NotFound("Not found");
  if (!event.owner.equals(req.user._id)) throw new Forbidden("Access denied");
  res.json({ status: "success", code: 200, data: { result: serializeEvent(event) } });
};

const createEvent = async (req, res) => {
  const event = await Event.create({ ...req.body, owner: req.user._id });
  res.status(201).json({
    status: "success",
    code: 201,
    data: { result: serializeEvent(event) },
  });
};

const updateEvent = async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id);
  if (!event) throw new NotFound("Not found");
  if (!event.owner.equals(req.user._id)) throw new Forbidden("Access denied");

  Object.keys(req.body).forEach(key => {
    event[key] = req.body[key];
  });
  await event.save();

  res.json({ status: "success", code: 200, data: { result: serializeEvent(event) } });
};

const deleteEvent = async (req, res) => {
  const { id } = req.params;
  const event = await Event.findById(id);
  if (!event) throw new NotFound("Not found");
  if (!event.owner.equals(req.user._id)) throw new Forbidden("Access denied");

  await Event.findByIdAndDelete(id);
  res.json({ status: "success", code: 200, data: { result: { id: event._id.toString() } } });
};

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};
