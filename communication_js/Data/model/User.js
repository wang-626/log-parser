class User {
  constructor({ index, id, username, id_card, balance, start_balance, now_balance, powerstatus,
    identity, can_control_power, can_open_door, start_amount_110, now_amount_110,
    start_amount_220, now_amount_220, start_date }) {
    this.index = index;
    this.id = id;
    this.username = username;
    this.id_card = id_card;
    this.balance = parseFloat(balance);
    this.powerstatus = powerstatus;
    this.identity = identity;
    this.can_control_power = Boolean(can_control_power);
    this.can_open_door = Boolean(can_open_door);
    this.start_balance = parseFloat(start_balance);
    this.now_balance = parseFloat(now_balance);
    this.start_amount_110 = parseFloat(start_amount_110);
    this.now_amount_110 = parseFloat(now_amount_110);
    this.start_amount_220 = parseFloat(start_amount_220);
    this.now_amount_220 = parseFloat(now_amount_220);
    this.start_date = start_date;
  }

  getMode() {
    const ccp = this.can_control_power ? 0 : 1;
    const cod = this.can_open_door ? 0 : 1;
    return this.powerstatus | (ccp << 5) | (cod << 6) | (this.identity << 7);
  }
}

module.exports = { User };
