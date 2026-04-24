const connect = require('./connect');

async function queryRoomsSet(centerId) {
  const conn = await connect.getLocalConnection();
  if (!conn) return null;
  try {
    const [rows] = await conn.execute(
      `SELECT room.mode, room.price_degree, COUNT(member.id) AS member_count
       FROM room LEFT JOIN member ON member.room_strings = room.name
       WHERE room.center_id=?
       GROUP BY room.id, room.mode, room.price_degree
       ORDER BY room.meter_id`,
      [centerId]
    );
    return rows;
  } catch (e) {
    console.error(e);
    return null;
  } finally {
    conn.release();
  }
}

module.exports = { queryRoomsSet };
