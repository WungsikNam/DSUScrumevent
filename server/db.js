const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { getISOWeek, getISOWeekYear } = require('date-fns');

function isoWeekKey(d = new Date()) {
  return `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, '0')}`;
}

let db;

function getDb() {
  if (db) return db;
  const dir = path.join(__dirname, 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  db = new Database(path.join(dir, 'scores.db'));
  db.exec(`
    CREATE TABLE IF NOT EXISTS weekly_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      week_iso TEXT NOT NULL,
      display_name TEXT NOT NULL,
      score INTEGER NOT NULL CHECK (score >= 0),
      recorded_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_week ON weekly_scores (week_iso, display_name);
  `);
  return db;
}

function recordWeeklyScores(players) {
  const d = getDb();
  const week = isoWeekKey();
  const ins = d.prepare(`INSERT INTO weekly_scores (week_iso, display_name, score) VALUES (?, ?, ?)`);
  const trx = d.transaction(() => {
    players.forEach(p => {
      if (!p.name) return;
      ins.run(week, String(p.name).trim().slice(0, 40), Math.max(0, Number(p.score) || 0));
    });
  });
  trx();
}

function getWeeklyLeaderboard(weekIso, limit = 50) {
  const d = getDb();
  const week = weekIso || isoWeekKey();
  const lim = Math.min(200, Math.max(1, Number(limit) || 50));
  const rows = d.prepare(`
    SELECT
      display_name AS displayName,
      SUM(score)   AS totalPoints,
      COUNT(*)     AS gamesFinished
    FROM weekly_scores
    WHERE week_iso = ?
    GROUP BY display_name
    ORDER BY totalPoints DESC, gamesFinished DESC
    LIMIT ?
  `).all(week, lim);
  return rows.map((r, i) => ({
    rank: i + 1,
    displayName: r.displayName,
    totalPoints: r.totalPoints,
    gamesFinished: r.gamesFinished,
  }));
}

module.exports = { getDb, isoWeekKey, recordWeeklyScores, getWeeklyLeaderboard };
