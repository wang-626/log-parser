const connect = require('./connect');

async function queryRoomId(centerId, meterId) {
  const conn = await connect.getLocalConnection();
  if (!conn) return null;
  try {
    const [rows] = await conn.execute(
      `SELECT id FROM room WHERE center_id=? AND meter_id=? LIMIT 1`,
      [centerId, meterId]
    );
    return rows[0] || null;
  } finally {
    conn.release();
  }
}

module.exports = { queryRoomId };
