const ROLES = Object.freeze({
  CUSTOMER: "CUSTOMER",
  STAFF: "STAFF",
  ADMIN: "ADMIN",
});

const ROLE_RANK = Object.freeze({
  [ROLES.CUSTOMER]: 1,
  [ROLES.STAFF]: 2,
  [ROLES.ADMIN]: 3,
});

function hasMinimumRole(userRole, requiredRole) {
  return (ROLE_RANK[userRole] || 0) >= (ROLE_RANK[requiredRole] || 0);
}

module.exports = {
  ROLES,
  ROLE_RANK,
  hasMinimumRole,
};
