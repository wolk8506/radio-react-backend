const { NewsSource, NewsItem, UserInterest } = require("../models/newsModels");

//  ~ Персонализация: релевантность новости профилю пользователя  ------------------------------
function scoreOf(item, interest) {
  if (!interest) return 0;
  let score = 0;
  const cats = interest.categories || [];
  if (cats.includes(item.category)) score += 5;

  const weights = {};
  (interest.tags || []).forEach((t) => {
    weights[t.tag.toLowerCase()] = t.weight || 1;
  });
  (item.tags || []).forEach((t) => {
    const w = weights[t.toLowerCase()];
    if (w) score += w * 2;
  });
  return score;
}

//  ~ Лента (auth опционален: с токеном — персональная сортировка)  -----------------------------
const list = async (req, res) => {
  const { page = 1, limit = 20, category, tag, personalized = "true" } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (tag) filter.tags = tag;

  const usePersonal = Boolean(req.user) && personalized !== "false";

  // Для персонализации берём расширенное окно, затем сортируем по релевантности.
  const windowSize = usePersonal ? 400 : Number(limit);
  const skip = usePersonal ? 0 : (Math.max(1, parseInt(page, 10)) - 1) * Number(limit);

  let items = await NewsItem.find(filter)
    .populate("source", "title url")
    .sort({ publishedAt: -1 })
    .skip(skip)
    .limit(windowSize);

  const total = await NewsItem.countDocuments(filter);

  if (usePersonal) {
    const interest = await UserInterest.findOne({ user: req.user._id });
    items = items
      .map((it) => {
        const obj = it.toObject();
        obj._score = scoreOf(obj, interest);
        return obj;
      })
      .sort((a, b) => b._score - a._score || new Date(b.publishedAt) - new Date(a.publishedAt));

    const start = (Math.max(1, parseInt(page, 10)) - 1) * Number(limit);
    const paged = items.slice(start, start + Number(limit));
    return res.json({
      items: paged,
      total,
      page: parseInt(page, 10),
      limit: Number(limit),
      hasMore: start + Number(limit) < items.length,
      personalized: true,
    });
  }

  return res.json({
    items,
    total,
    page: parseInt(page, 10),
    limit: Number(limit),
    hasMore: skip + items.length < total,
    personalized: false,
  });
};

//  ~ Фасеты (категории и популярные теги) для фильтров и настройки интересов  ---------------
const facets = async (req, res) => {
  const categoryAgg = await NewsItem.aggregate([
    { $match: {} },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  const tagAgg = await NewsItem.aggregate([
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 40 },
  ]);
  res.json({
    categories: categoryAgg.map((c) => ({ name: c._id, count: c.count })),
    tags: tagAgg.map((t) => ({ name: t._id, count: t.count })),
  });
};

//  ~ Профиль интересов пользователя  ----------------------------------------------------------
const getInterests = async (req, res) => {
  let interest = await UserInterest.findOne({ user: req.user._id });
  if (!interest) {
    interest = await UserInterest.create({ user: req.user._id, tags: [], categories: [] });
  }
  res.json(interest);
};

const updateInterests = async (req, res) => {
  const { tags = [], categories = [] } = req.body;
  const normalizedTags = Array.isArray(tags)
    ? tags
        .map((t) => ({
          tag: String(t.tag || t).toLowerCase().trim(),
          weight: Number(t.weight) || 1,
        }))
        .filter((t) => t.tag)
    : [];
  const normalizedCats = Array.isArray(categories)
    ? categories.map((c) => String(c).toLowerCase().trim()).filter(Boolean)
    : [];

  const interest = await UserInterest.findOneAndUpdate(
    { user: req.user._id },
    { tags: normalizedTags, categories: normalizedCats },
    { new: true, upsert: true }
  );
  res.json(interest);
};

//  ~ Источники (только admin)  ----------------------------------------------------------------
const listSources = async (req, res) => {
  const sources = await NewsSource.find().sort({ createdAt: -1 });
  res.json(sources);
};

const addSource = async (req, res) => {
  const source = await NewsSource.create(req.body);
  res.status(201).json(source);
};

const updateSource = async (req, res) => {
  const source = await NewsSource.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!source) return res.status(404).json({ message: "Source not found" });
  res.json(source);
};

const removeSource = async (req, res) => {
  const source = await NewsSource.findByIdAndDelete(req.params.id);
  if (!source) return res.status(404).json({ message: "Source not found" });
  res.json({ message: "removed" });
};

module.exports = {
  list,
  facets,
  getInterests,
  updateInterests,
  listSources,
  addSource,
  updateSource,
  removeSource,
};
