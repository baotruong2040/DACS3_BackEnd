const { env } = require("../config/env");

function getPublicBaseUrl(req) {
  if (env.PUBLIC_BASE_URL) {
    return env.PUBLIC_BASE_URL.replace(/\/$/, "");
  }

  return `${req.protocol}://${req.get("host")}`;
}

function buildPublicUrl(req, relativePath) {
  if (!relativePath) {
    return null;
  }

  const normalizedPath = relativePath.startsWith("/")
    ? relativePath
    : `/${relativePath}`;

  return `${getPublicBaseUrl(req)}${normalizedPath}`;
}

module.exports = {
  getPublicBaseUrl,
  buildPublicUrl,
};
