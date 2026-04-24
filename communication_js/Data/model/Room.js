const { Power } = require('./HardWareEnum');

class Room {
  constructor({ id, name, center_id, meter_id, mode, price_degree, mode_220, price_degree_220,
    amount, amount_220, dong, floor, system_mode }) {
    this.id = id;
    this.name = name;
    this.center_id = center_id;
    this.meter_id = meter_id;
    this.system_mode = system_mode || 0;
    this.mode_110 = mode;
    this.price_degree_110 = parseFloat(price_degree);
    this.amount_110 = parseFloat(amount) || 0;
    this.mode_220 = mode_220;
    this.price_degree_220 = parseFloat(price_degree_220);
    this.amount_220 = parseFloat(amount_220) || 0;
    this.dong = dong;
    this.floor = floor;
    this.Users = [];
    this.meter_error_110 = 0;
    this.meter_error_220 = 0;
    this.meter_static_110 = 0;
    this.meter_static_220 = 0;
  }

  getChargeableMemberCount() {
    return this.Users.filter(u => u.powerstatus === Power.ON).length;
  }

  getUserIndex(user) {
    const idx = this.Users.findIndex(u => u.id === user.id);
    return idx >= 0 ? idx + 1 : null;
  }

  getUserByIdcard(idcard) {
    return this.Users.find(u => String(u.id_card) === String(idcard)) || null;
  }

  getUserIsUsingOne() {
    return this.Users.find(u => u.powerstatus === 1) || null;
  }

  getUserIsUsingCount() {
    return this.Users.filter(u => u.powerstatus === 1).length;
  }

  getUsersIsUsing() {
    return this.Users.filter(u => u.powerstatus === 1);
  }

  isIdcardInRoom(idcard) {
    return this.Users.some(u => u.id_card === idcard);
  }

  isRoomUsing() {
    return this.Users.some(u => u.powerstatus === 1);
  }

  getRoomJsonData() {
    const data = {};
    for (const user of this.Users) data[user.id] = user.powerstatus;
    return JSON.stringify(data);
  }

  static compareUsers(oldUsers, newUsers) {
    const oldIds = new Set(oldUsers.map(u => u.id));
    const newIds = new Set(newUsers.map(u => u.id));
    const added = newUsers.filter(u => !oldIds.has(u.id));
    const removed = oldUsers.filter(u => !newIds.has(u.id));
    return { added, removed };
  }
}

module.exports = { Room };
