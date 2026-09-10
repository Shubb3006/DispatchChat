import { Router } from "express";
import { protectedRoute } from "../middlewares/auth.middleware.js";
import { requireCustomer } from "../middlewares/customer.middleware.js";
import { upload } from "../config/multer.js";

import {
  getPortalLoadDetail,
  listPortalLoadDocuments,
  downloadPortalLoadDocument,
  portalTrackLookup,
} from "../controllers/portalLoad.controller.js";

import {
  listLoadMessages,
  sendLoadMessage,
  markLoadMessagesRead,
  unreadMessageCounts,
} from "../controllers/portalMessages.controller.js";

import {
  listPortalNotifications,
  markPortalNotificationsRead,
  portalNotificationStream,
  getNotifyPrefs,
  updateNotifyPrefs,
} from "../controllers/portalNotifications.controller.js";

import {
  uploadRateRequestAttachment,
  listRateRequestAttachments,
  downloadRateRequestAttachment,
  deleteRateRequestAttachment,
} from "../controllers/portalRates.controller.js";

// ---------------------------------------------------------------------------
// /api/portal/* — the customer/broker surface.
//
// Load- and rate-scoped routes use protectedRoute only: their controllers call
// resolveLoadForRequest / resolveRateRequest, which allow the OWNING customer
// or dispatch staff (so dispatchers can answer a broker's messages from the
// same endpoints). Account-scoped routes add requireCustomer.
// ---------------------------------------------------------------------------
const router = Router();

/* Notifications (this account only) */
router.get("/notifications", protectedRoute, listPortalNotifications);
router.post("/notifications/read", protectedRoute, markPortalNotificationsRead);
router.get("/notifications/stream", protectedRoute, portalNotificationStream);
router.get("/notify-prefs", protectedRoute, requireCustomer, getNotifyPrefs);
router.patch("/notify-prefs", protectedRoute, requireCustomer, updateNotifyPrefs);

/* Message unread badges across the customer's loads */
router.get("/messages/unread", protectedRoute, requireCustomer, unreadMessageCounts);

/* Rate request attachments */
router.get("/rates/:id/attachments", protectedRoute, listRateRequestAttachments);
router.post("/rates/:id/attachments", protectedRoute, upload.single("file"), uploadRateRequestAttachment);
router.get("/rates/:id/attachments/:attachmentId", protectedRoute, downloadRateRequestAttachment);
router.delete("/rates/:id/attachments/:attachmentId", protectedRoute, deleteRateRequestAttachment);

/* Track-a-shipment lookup. Registered before the /loads routes so no :id
   pattern can ever shadow it. */
router.get("/track", protectedRoute, requireCustomer, portalTrackLookup);

/* One shipment: detail, documents, conversation */
router.get("/loads/:id", protectedRoute, getPortalLoadDetail);
router.get("/loads/:id/documents", protectedRoute, listPortalLoadDocuments);
router.get("/loads/:id/documents/:documentId", protectedRoute, downloadPortalLoadDocument);
router.get("/loads/:id/messages", protectedRoute, listLoadMessages);
router.post("/loads/:id/messages", protectedRoute, sendLoadMessage);
router.post("/loads/:id/messages/read", protectedRoute, markLoadMessagesRead);

export default router;
