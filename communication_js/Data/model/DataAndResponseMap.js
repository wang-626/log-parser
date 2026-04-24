class DataAndResponseMap {
  constructor(maxRetries = 3, needLog = true) {
    this._map = new Map();
    this.maxRetries = maxRetries;
    this.needLog = needLog;
  }

  add(sendDataKey, responses) {
    if (!('retry limit exceeded' in responses)) {
      responses['retry limit exceeded'] = (it) =>
        console.log(`Maximum retries exceeded for token ${sendDataKey}`);
    }
    this._map.set(sendDataKey, responses);
    return this;
  }

  getResponses(sendDataKey) {
    return this._map.get(sendDataKey);
  }

  addRetryLimitExceededAction(sendDataKey, action) {
    const responses = this._map.get(sendDataKey);
    if (responses) responses['retry limit exceeded'] = action;
    return this;
  }
}

module.exports = { DataAndResponseMap };
