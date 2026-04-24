const connect = require('./connect');

async function queryHostDong() {
  const conn = await connect.getLocalConnection();
  if (!conn) return null;
  try {
    const [rows] = await conn.execute(
      `SELECT systemmode, dong, has_meter_110, has_meter_220 FROM host`
    );
    return rows[0] || null;
  } finally {
    conn.release();
  }
}

async function queryDongCenterId() {
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

async function queryRoomMembers(roomId) {
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

async function queryMemberRoomId(memberId) {
  const conn = await connect.getLocalConnection();
  if (!conn) return null;
  try {
    const [rows] = await conn.execute(
      `SELECT room.id FROM member LEFT JOIN room ON member.room_strings = room.name WHERE member.id = ?`,
      [memberId]
    );
    return rows[0]?.id || null;
  } finally {
    conn.release();
  }
}

async function queryBuildingRoom() {
  const conn = await connect.getLocalConnection();
  if (!conn) return [];
  try {
    const [rows] = await conn.execute(
      `SELECT id, name, center_id, meter_id, mode, price_degree, amount,
              mode_220, price_degree_220, amount_220, dong, floor, system_mode
       FROM room
       WHERE enable <> 0`
    );
    return rows;
  } finally {
    conn.release();
  }
}

async function querySingleRoom(centerId, meterId) {
  const conn = await connect.getLocalConnection();
  if (!conn) return [];
  try {
    const [rows] = await conn.execute(
      `SELECT id, name, center_id, meter_id, mode, price_degree,
              mode_220, price_degree_220, amount, amount_220,
              dong, floor, system_mode
       FROM room
       WHERE center_id = ? AND meter_id = ?`,
      [centerId, meterId]
    );
    return rows;
  } finally {
    conn.release();
  }
}

async function queryCenterIdCard() {
  const conn = await connect.getLocalConnection();
  if (!conn) return [];
  try {
    const [rows] = await conn.execute(`SELECT DISTINCT id_card FROM member WHERE id_card IS NOT NULL AND id_card != ''`);
    return rows.map(r => r.id_card);
  } finally {
    conn.release();
  }
}

module.exports = {
  queryHostDong, queryDongCenterId, queryRoomMembers, queryMemberRoomId,
  queryBuildingRoom, querySingleRoom, queryCenterIdCard,
};
