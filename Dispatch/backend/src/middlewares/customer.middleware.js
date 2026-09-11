// Tenant isolation gate for the customer/broker portal.
//
// Runs AFTER protectedRoute (which sets req.user from the DB, including
// customer_id). A portal request is only valid when the caller is a
// 'customer' user linked to a customers row; req.customerId is then the
// ONLY tenant id downstream handlers are allowed to query with — never a
// customer id taken from the request body or query string.
export const requireCustomer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  if (req.user.role !== "customer") {
    return res.status(403).json({
      success: false,
      message: "Access denied — customer portal accounts only",
    });
  }

  if (!req.user.customer_id) {
    return res.status(403).json({
      success: false,
      message:
        "This account is not linked to a customer company. Ask Nishan Transport contact to link it.",
    });
  }

  req.customerId = req.user.customer_id;
  next();
};
