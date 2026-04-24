const connect = require('./connect');

async function queryLayerRoom(centerId) {
  const conn = await connect.getLocalConnection();
  if (!conn) return [];
  try {
    const [rows] = await conn.execute(
      `SELECT id FROM room WHERE center_id=? ORDER BY id`,
      [centerId]
    );
    return rows;
  } finally {
    conn.release();
  }
}

async function queryBuildingCenterId() {
  const conn = await connect.getLocalConnection();
  if (!conn) return [];
  try {
    const [rows] = await conn.execute(
      `SELECT center_id FROM room GROUP BY center_id`
    );
    return rows;
  } finally {
    conn.release();
  }
}

module.exports = { queryLayerRoom, queryBuildingCenterId };
