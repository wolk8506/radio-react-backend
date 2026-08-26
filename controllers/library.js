const { NotFound } = require("http-errors");
const { Fact, Joke, EventItem } = require("../models/library");

const buildList = Model => async (req, res) => {
  const { search = "", date = "" } = req.query;
  const filter = {};
  if (date && Model.schema.path("date")) filter.date = date;
  if (search) {
    const re = new RegExp(search, "i");
    filter.$or = [{ title: re }, { text: re }, { description: re }];
  }
  const sort = Model.schema.path("date") ? { date: 1 } : { createdAt: -1 };
  const items = await Model.find(filter).sort(sort);
  res.json({ status: "success", code: 200, data: { items } });
};

const buildAdd = Model => async (req, res) => {
  const item = await Model.create(req.body);
  res.status(201).json({ status: "success", code: 201, data: { item } });
};

const buildUpdate = Model => async (req, res) => {
  const { id } = req.params;
  const item = await Model.findByIdAndUpdate(id, req.body, { new: true });
  if (!item) throw new NotFound("Не найдено");
  res.json({ status: "success", code: 200, data: { item } });
};

const buildRemove = Model => async (req, res) => {
  const { id } = req.params;
  const item = await Model.findByIdAndDelete(id);
  if (!item) throw new NotFound("Не найдено");
  res.json({ status: "success", code: 200, message: "Удалено" });
};

const makeCrud = Model => ({
  list: buildList(Model),
  add: buildAdd(Model),
  update: buildUpdate(Model),
  remove: buildRemove(Model),
});

const randomJokes = async (req, res) => {
  const count = parseInt(req.query.count, 10) || 3;
  const items = await Joke.aggregate([{ $sample: { size: count } }]);
  res.json({ status: "success", code: 200, data: { items: items.map(i => i.text) } });
};

module.exports = {
  facts: makeCrud(Fact),
  events: makeCrud(EventItem),
  jokes: { ...makeCrud(Joke), random: randomJokes },
};
