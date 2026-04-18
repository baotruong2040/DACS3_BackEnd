function info(message, context = {}) {
  console.log(`[INFO] ${message}`, context);
}

function warn(message, context = {}) {
  console.warn(`[WARN] ${message}`, context);
}

function error(message, context = {}) {
  console.error(`[ERROR] ${message}`, context);
}

module.exports = {
  logger: {
    info,
    warn,
    error,
  },
};
