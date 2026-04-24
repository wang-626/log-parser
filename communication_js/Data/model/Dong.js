const { Room } = require('./Room');

class Dong {
  constructor(systemMode, name, meter110, meter220) {
    this.name = name;
    this.centers = {};
    this.meter_110 = Boolean(meter110);
    this.meter_220 = Boolean(meter220);
    this.system_mode = systemMode;
  }

  addRoom(room) {
    const cid = room.center_id;
    const mid = room.meter_id;
    if (!this.centers[cid]) this.centers[cid] = {};
    this.centers[cid][mid] = room;
  }

  getRoom(centerId, meterId) {
    return this.centers[centerId]?.[meterId] || null;
  }

  getRooms() {
    const all = [];
    for (const center of Object.values(this.centers)) {
      all.push(...Object.values(center));
    }
    return all.sort((a, b) => a.id - b.id);
  }

  getRoomById(roomId) {
    roomId = parseInt(roomId);
    for (const center of Object.values(this.centers)) {
      for (const room of Object.values(center)) {
        if (room.id === roomId) return room;
      }
    }
    return null;
  }

  getRoomsByIds(roomIds) {
    const res = [];
    for (const center of Object.values(this.centers)) {
      for (const room of Object.values(center)) {
        if (roomIds.includes(room.id)) res.push(room);
      }
    }
    return res;
  }

  getRoomByCenterMeter(centerId, meterId) {
    const center = this.centers[centerId];
    if (!center) return null;
    return Object.values(center).find(r => r.meter_id === meterId) || null;
  }

  getRoomsByCenter(centerId) {
    const center = this.centers[centerId] || {};
    return Object.values(center).sort((a, b) => a.id - b.id);
  }

  getCenters() {
    return Object.keys(this.centers).sort();
  }

  findRoomByUserId(userId) {
    for (const center of Object.values(this.centers)) {
      for (const room of Object.values(center)) {
        if (room.Users.some(u => u.id === userId)) return room;
      }
    }
    return null;
  }
}

module.exports = { Dong };
