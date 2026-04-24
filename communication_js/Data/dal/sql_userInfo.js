const connect = require('./connect');

async function queryRoomForStudentsExistIdcard(roomId, idCard) {
  const conn = await connect.getLocalConnection();
  if (!conn) return false;
  try {
    const [rows] = await conn.execute(
      `SELECT COUNT(*) AS cnt FROM member
       WHERE room_strings = (SELECT name FROM room WHERE id=? LIMIT 1) AND id_card=?`,
      [roomId, idCard]
    );
    return (rows[0]?.cnt || 0) > 0;
  } finally {
    conn.release();
  }
}

module.exports = { queryRoomForStudentsExistIdcard };
