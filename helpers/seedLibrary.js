const { Fact, Joke, EventItem } = require("../models/library");

// Заполняет коллекции фактов/шуток/событий из исходных JSON при первом запуске.
// Идемпотентно: заполняет только пустые коллекции.
const seedLibrary = async () => {
  try {
    const [eCount, fCount, jCount] = await Promise.all([
      EventItem.countDocuments(),
      Fact.countDocuments(),
      Joke.countDocuments(),
    ]);

    if (eCount === 0) {
      const eventsJSON = require("../data/events.json");
      const events = [];
      for (const [date, val] of Object.entries(eventsJSON)) {
        for (const ev of val.event || []) {
          events.push({
            date,
            title: ev.title,
            description: ev.description || "",
            emoji: ev.emoji || "",
          });
        }
      }
      if (events.length) await EventItem.insertMany(events);
      console.log(`Library seeded events: ${events.length}`);
    }

    if (fCount === 0) {
      const eventsJSON = require("../data/events.json");
      const facts = [];
      for (const [date, val] of Object.entries(eventsJSON)) {
        for (const f of val.fact || []) {
          if (f && f.trim()) facts.push({ date, text: f.trim() });
        }
      }
      if (facts.length) await Fact.insertMany(facts);
      console.log(`Library seeded facts: ${facts.length}`);
    }

    if (jCount === 0) {
      const anecdoteJSON = require("../data/anecdote.json");
      const jokes = [];
      for (const entry of anecdoteJSON) {
        for (const j of entry.joke || []) {
          if (j && j.trim()) jokes.push({ text: j.trim() });
        }
      }
      if (jokes.length) await Joke.insertMany(jokes);
      console.log(`Library seeded jokes: ${jokes.length}`);
    }
  } catch (e) {
    console.error("Library seed error:", e.message);
  }
};

module.exports = seedLibrary;
