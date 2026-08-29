const normalizeCity = city => (city || "").split(",")[0].trim().toLowerCase();

const MAX_CITIES = 3;

const getCities = async (req, res) => {
  const cities = req.user.cities || [];
  res.json({
    status: "success",
    code: 200,
    data: { cities },
  });
};

const addCity = async (req, res) => {
  const { city, home = false, favorite = true, lat = null, lon = null } = req.body;

  if (!city) {
    return res.status(400).json({
      status: "error",
      code: 400,
      message: "Название города обязательно.",
    });
  }

  if (!req.user.cities) req.user.cities = [];

  const norm = normalizeCity(city);

  if (req.user.cities.some(c => normalizeCity(c.city) === norm)) {
    return res.status(409).json({
      status: "error",
      code: 409,
      message: "Такой город уже добавлен в избранное.",
    });
  }

  if (req.user.cities.length >= MAX_CITIES) {
    return res.status(409).json({
      status: "error",
      code: 409,
      message: "Достигнут лимит городов (максимум 3).",
    });
  }

  req.user.cities.push({ city, home, favorite, lat, lon });
  await req.user.save();

  res.status(201).json({
    status: "success",
    code: 201,
    data: { cities: req.user.cities },
  });
};

const removeCity = async (req, res) => {
  const norm = normalizeCity(req.params.city);

  if (!req.user.cities) req.user.cities = [];
  req.user.cities = req.user.cities.filter(c => normalizeCity(c.city) !== norm);
  await req.user.save();

  res.json({
    status: "success",
    code: 200,
    data: { cities: req.user.cities },
  });
};

const setHomeCity = async (req, res) => {
  const norm = normalizeCity(req.params.city);
  const { home } = req.body;

  if (!req.user.cities) req.user.cities = [];

  req.user.cities.forEach(c => {
    if (normalizeCity(c.city) === norm) c.home = home;
    else if (home) c.home = false; // одновременно только один "домашний" город
  });

  await req.user.save();

  res.json({
    status: "success",
    code: 200,
    data: { cities: req.user.cities },
  });
};

module.exports = { getCities, addCity, removeCity, setHomeCity };
