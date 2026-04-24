const { ACCESS } = require('./HardWareEnum');

class Access {
  constructor() {
    this.records = {};
  }

  addAccessUserRecord(roomId, idcard, status, time) {
    if (!this.records[roomId]) this.records[roomId] = [];
    this.records[roomId].push({ room_id: roomId, idcard, status, time, result: null });
    this.records[roomId].sort((a, b) => new Date(a.time) - new Date(b.time));
  }

  getRoomIds() {
    return Object.keys(this.records);
  }

  getRecordByRoomId(roomId) {
    return this.records[roomId] || null;
  }
}

module.exports = { Access };
