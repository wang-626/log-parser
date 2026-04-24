const connect = require('./connect');

async function queryRoom(roomId) {
  const conn = await connect.getLocalConnection();
  if (!conn) return null;
  try {
    const [rows] = await conn.execute(
      `SELECT id, name, center_id, meter_id, mode, price_degree, mode_220, price_degree_220
       FROM room WHERE id = ? LIMIT 1`,
      [roomId]
    );
    return rows[0] || null;
  } finally {
    conn.release();
  }
}

async function queryRoomForMember(roomId) {
  const conn = await connect.getLocalConnection();
  if (!conn) return [];
  try {
    const [rows] = await conn.execute(
      `SELECT ROW_NUMBER() OVER (ORDER BY m.identity DESC, m.id) AS "index",
              m.id, m.username, m.id_card, m.balance, m.start_balance, m.now_balance,
              m.powerstatus, m.identity, m.can_control_power, m.can_open_door,
              m.start_amount_110, m.now_amount_110, m.start_amount_220, m.now_amount_220,
              m.start_date
       FROM member m
       INNER JOIN room r ON m.room_strings = r.name
       WHERE r.id = ?
       ORDER BY m.identity DESC, m.id`,
      [roomId]
    );
    return rows || [];
  } finally {
    conn.release();
  }
}

module.exports = { queryRoom, queryRoomForMember };
