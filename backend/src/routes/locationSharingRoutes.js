const express = require("express");
const router = express.Router();
const locationSharingController = require("../controllers/locationSharingController");
const { authMiddleware } = require("../middleware/auth");

router.use(authMiddleware);

// Search user by ID or email
router.get("/search", locationSharingController.searchUser);

// Send request to access location (Max 10 users)
router.post("/request", locationSharingController.sendRequest);

// Get my connections (outgoing, incoming, and limit counts)
router.get("/connections", locationSharingController.getConnections);

// Accept / Decline / Block incoming request
router.patch("/connections/:id/respond", locationSharingController.respondToRequest);

// Toggle sharing ON / OFF
router.patch("/connections/:id/toggle", locationSharingController.toggleSharing);

// Remove connection or block
router.delete("/connections/:id", locationSharingController.blockOrRemoveConnection);

// Update commuter's current location for authorized peers
router.post("/my-location", locationSharingController.updateMyLocation);

// Get live locations of all approved peers for map display
router.get("/peers", locationSharingController.getPeerLocations);

module.exports = router;
