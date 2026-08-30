// // import express from "express";
// // import {
// //   getHOSLogs,
// //   getHOSLogByDriverId,
// //   updateHOSStatus
// // } from "../controllers/hos.controller.js";
// // import { protectedRoute } from "../middlewares/auth.middleware.js";

// // const router = express.Router();

// // router.get("/", protectedRoute, getHOSLogs);
// // router.get("/driver/:driverId", protectedRoute, getHOSLogByDriverId);
// // router.put("/driver/:driverId/status", protectedRoute, updateHOSStatus);

// // export default router;


// import express from "express";
// import {
//   getHOSLogs,
//   getHOSLogByDriverId,
//   updateHOSStatus
// } from "../controllers/hos.controller.js";
// import { protectedRoute } from "../middlewares/auth.middleware.js";

// const router = express.Router();

// router.get("/", protectedRoute, getHOSLogs);
// router.get("/driver/:driverId", protectedRoute, getHOSLogByDriverId);
// router.get("/:driverId", protectedRoute, getHOSLogByDriverId);
// router.put("/driver/:driverId/status", protectedRoute, updateHOSStatus);
// router.put("/driver/:driverId", protectedRoute, updateHOSStatus);
// router.put("/:driverId/status", protectedRoute, updateHOSStatus);
// router.put("/:driverId", protectedRoute, updateHOSStatus);

// export default router;




import express from "express";
import {
  getAllHOSLogs,
  getDriverHOSLog,
  getMyHOSLog,
  updateMyHOSStatus,
  // getAllHOSLogs,
} from "../controllers/hos.controller.js";
import { protectedRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Driver endpoints
router.get("/me", protectedRoute, getMyHOSLog);
router.put("/me", protectedRoute, updateMyHOSStatus);

router.get("/", protectedRoute, getAllHOSLogs);
router.get("/:driverId", protectedRoute, getDriverHOSLog);


// Dispatcher/Admin endpoint
// router.get("/", protectedRoute, getAllHOSLogs);

export default router;