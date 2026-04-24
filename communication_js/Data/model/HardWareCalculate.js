require('dotenv').config();

const paymentMethod = process.env.PAYMENT_METHOD || 'EasyCard';

function studentIDToBytes(studentID) {
  const s = String(studentID).padStart(10, '0');
  return [
    s.charCodeAt(s.length - 4),
    s.charCodeAt(s.length - 3),
    s.charCodeAt(s.length - 2),
    s.charCodeAt(s.length - 1),
  ];
}

function idCardToBytes(idCard) {
  if (paymentMethod === 'EasyCard') {
    const n = parseInt(String(idCard).padStart(10, '0')) >>> 0;
    return [(n >>> 24) & 0xFF, (n >>> 16) & 0xFF, (n >>> 8) & 0xFF, n & 0xFF];
  } else {
    const n = parseInt(String(idCard).padStart(8, '0').substring(0, 8), 16) >>> 0;
    return [(n >>> 24) & 0xFF, (n >>> 16) & 0xFF, (n >>> 8) & 0xFF, n & 0xFF];
  }
}

function balanceToBytes(balance) {
  const b = Math.round(parseFloat(balance) * 1000);
  const buf = Buffer.allocUnsafe(4);
  buf.writeInt32BE(b, 0);
  return [buf[0], buf[1], buf[2], buf[3]];
}

function bytesToFloat(byteList) {
  const buf = Buffer.from(byteList.slice(0, 4));
  return parseFloat(buf.readFloatLE(0).toFixed(2));
}

// Pack float as little-endian bytes (equivalent to Python struct.pack('f', balance))
function BbalanceToInt(balance) {
  const buf = Buffer.allocUnsafe(4);
  buf.writeFloatLE(parseFloat(balance), 0);
  return [buf[0], buf[1], buf[2], buf[3]];
}

// Interpret 4 bytes as big-endian signed int32, divide by 1000
function BbalanceToIntToFloat(bbalance) {
  const buf = Buffer.from(bbalance.slice(0, 4));
  return buf.readInt32BE(0) / 1000;
}

// Interpret 4 bytes as little-endian float, divide by 1000
function BbalanceToSingle(bbalance) {
  const buf = Buffer.from(bbalance.slice(0, 4));
  return buf.readFloatLE(0) / 1000;
}

function accessPasswordToBytes(accessPassword) {
  const result = new Array(8).fill(255);
  for (let i = 0; i < Math.min(accessPassword.length, 8); i++) {
    result[i] = accessPassword.charCodeAt(i);
  }
  return result;
}

function BidcardToStr(bidCard) {
  if (paymentMethod === 'EasyCard') {
    const n = (((bidCard[0] << 24) | (bidCard[1] << 16) | (bidCard[2] << 8) | bidCard[3]) >>> 0);
    return n.toString().padStart(10, '0');
  } else {
    const n = (((bidCard[3] << 24) | (bidCard[2] << 16) | (bidCard[1] << 8) | bidCard[0]) >>> 0);
    return n.toString(16).toUpperCase().padStart(8, '0');
  }
}

function BstudentIDToStr(studentIDs) {
  return studentIDs.map(b => String.fromCharCode(b)).join('');
}

function BdegreeToFdegree(bdegree, scale = 100.0) {
  if (bdegree.length <= 2) {
    const degree = (bdegree[0] << 8) + bdegree[1];
    return degree !== 0 ? degree / scale : 0;
  }
  const degree = ((bdegree[0] << 24) | (bdegree[1] << 16) | (bdegree[2] << 8) | bdegree[3]) >>> 0;
  return degree !== 0 ? degree / scale : 0;
}

function Byte2ToValue(bdegree, scale = 100.0, signed = false) {
  if (bdegree.length < 2) return 0.0;
  const buf = Buffer.from([bdegree[0], bdegree[1]]);
  const raw = signed ? buf.readInt16BE(0) : buf.readUInt16BE(0);
  return raw !== 0 ? raw / scale : 0.0;
}

function BtimeToTime(btime) {
  try {
    const year = 2000 + btime[0];
    return new Date(year, btime[1] - 1, btime[2], btime[3], btime[4], btime[5]);
  } catch {
    return new Date(1995, 0, 1);
  }
}

function checksum(data) {
  let sum = 0;
  for (let i = 1; i < data.length - 2; i++) {
    sum += data[i];
  }
  return sum & 0xFF;
}

module.exports = {
  studentIDToBytes, idCardToBytes, balanceToBytes, bytesToFloat,
  BbalanceToInt, BbalanceToIntToFloat, BbalanceToSingle,
  accessPasswordToBytes, BidcardToStr, BstudentIDToStr,
  BdegreeToFdegree, Byte2ToValue, BtimeToTime, checksum,
};
