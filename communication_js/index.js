/**
 * Command dispatcher: parses a Python-style command string and calls the corresponding JS handler.
 *
 * Supported command format:
 *   ... python -m <module_path>.<ClassName> [-key value ...]
 *
 * Example:
 *   cd /home/... && python -m test.communication.test_Alive -meter 1 -center 1
 */

const handlers = {
  Alive: require('./Alive'),
  SingleRoomInitialization: require('./SingleRoomInitialization'),
  ChangeMemberInfo: require('./ChangeMemberInfo'),
  ChangeRoomSet: require('./ChangeRoomSet'),
  ChangeLayerRoomSet: require('./ChangeLayerRoomSet'),
  ChangeLayerMemberInfo: require('./ChangeLayerMemberInfo'),
  LayerRoomDegree110: require('./LayerRoomDegree110'),
  LayerRoomDegree220: require('./LayerRoomDegree220'),
  LayerRoomMode: require('./LayerRoomMode'),
  RoomInfo: require('./RoomInfo'),
  RoomPowerMeterData110: require('./RoomPowerMeterData110'),
  RoomPowerMeterData220: require('./RoomPowerMeterData220'),
  SetHardware: require('./SetHardware'),
  KioskAlive: require('./KioskAlive'),
  KioskStop: require('./KioskStop'),
};

/**
 * Parse a command string like:
 *   "cd /path && python -m test.communication.test_Alive -meter 1 -center 1 -r 5 -open false"
 * Returns { moduleName, args } or null if not a Python command.
 */
function parseCommand(cmd) {
  // Extract the python module invocation
  const match = cmd.match(/python\s+-m\s+([\w.]+)(.*)/);
  if (!match) return null;

  const moduleFullPath = match[1]; // e.g. "test.communication.test_Alive"
  const argStr = match[2] || '';

  // Get the last segment (class name), stripping test_ prefix if present
  let moduleName = moduleFullPath.split('.').pop();
  if (moduleName.startsWith('test_')) moduleName = moduleName.slice(5);

  // Parse -key value arguments
  const args = {};
  const argRegex = /-(\w+)\s+(\S+)/g;
  let m;
  while ((m = argRegex.exec(argStr)) !== null) {
    const key = m[1];
    const val = m[2];
    if (val === 'true') args[key] = true;
    else if (val === 'false') args[key] = false;
    else if (!isNaN(val) && val !== '') args[key] = Number(val);
    else args[key] = val;
  }

  return { moduleName, args };
}

/**
 * Execute a parsed command. Returns stdout string or throws.
 */
async function execute(cmd) {
  const parsed = parseCommand(cmd);
  if (!parsed) throw new Error(`Not a recognized python command: ${cmd}`);

  const { moduleName, args } = parsed;
  const handler = handlers[moduleName];
  if (!handler) throw new Error(`Unknown module: ${moduleName}. Available: ${Object.keys(handlers).join(', ')}`);

  return await handler.run(args);
}

/**
 * Check whether a command string matches a known JS handler.
 */
function canHandle(cmd) {
  const parsed = parseCommand(cmd);
  if (!parsed) return false;
  return parsed.moduleName in handlers;
}

module.exports = { execute, canHandle, parseCommand, handlers };
