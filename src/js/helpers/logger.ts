const noopLog = (message?: any, ...optionalParams: any[]) => {};

enum LOG_LEVEL {
  ALL = 3,
  WARN = 2,
  ERROR = 1,
  OFF = 0,
}

class Logger {
  constructor(private logLevel: LOG_LEVEL = LOG_LEVEL.ALL) {}

  setLevel(logLevel: LOG_LEVEL): void {
    this.logLevel = logLevel;
  }

  getLevel() {
    return this.logLevel;
  }

  get error() {
    return this.logLevel >= LOG_LEVEL.ERROR ? console.error : noopLog;
  }

  get warn() {
    return this.logLevel >= LOG_LEVEL.WARN ? console.warn : noopLog;
  }

  get log() {
    return this.logLevel >= LOG_LEVEL.ALL ? console.log : noopLog;
  }
}

const globalLogger = new Logger();

export { globalLogger as default, LOG_LEVEL, Logger };
