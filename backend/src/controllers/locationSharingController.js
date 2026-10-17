const mongoose = require("mongoose");
const LocationSharing = require("../models/LocationSharing");
const User = require("../models/User");
const apiResponse = require("../utils/apiResponse");

/**
 * Search user by ID or Email
 */
const searchUser = async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query || !query.trim()) {
      return apiResponse.error(res, "Search query is required.", 400);
    }

    const trimmed = query.trim();
    const myId = req.user._id;

    // Check if searching own ID or own email
    if (
      String(trimmed).toLowerCase() === String(req.user.email).toLowerCase() ||
      String(trimmed) === String(myId)
    ) {
      return apiResponse.error(res, "You cannot request location access to your own account.", 400);
    }

    let targetUser = null;

    // 1. Exact ObjectId match
    if (mongoose.Types.ObjectId.isValid(trimmed) && String(trimmed).length === 24) {
      targetUser = await User.findOne({
        _id: { $ne: myId, $eq: trimmed },
        isActive: true,
      }).select("_id firstName lastName email profilePhoto role");
    }

    // 2. Exact email match (case-insensitive)
    if (!targetUser) {
      targetUser = await User.findOne({
        _id: { $ne: myId },
        email: trimmed.toLowerCase(),
        isActive: true,
      }).select("_id firstName lastName email profilePhoto role");
    }

    // 3. Name or partial match
    if (!targetUser && trimmed.length >= 2) {
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      targetUser = await User.findOne({
        _id: { $ne: myId },
        isActive: true,
        $or: [
          { firstName: { $regex: escaped, $options: "i" } },
          { lastName: { $regex: escaped, $options: "i" } },
          { email: { $regex: escaped, $options: "i" } },
        ],
      }).select("_id firstName lastName email profilePhoto role");
    }

    if (!targetUser) {
      return apiResponse.error(res, "No user found with the provided ID, Name, or Email.", 404);
    }

    // Check existing sharing status with this user
    const existing = await LocationSharing.findOne({
      $or: [
        { requester: myId, recipient: targetUser._id },
        { requester: targetUser._id, recipient: myId },
      ],
    });

    return apiResponse.success(res, {
      user: targetUser,
      existingConnection: existing || null,
    }, "User found.");
  } catch (error) {
    next(error);
  }
};

/**
 * Send request to access another user's location (Max 10 users allowed)
 */
const sendRequest = async (req, res, next) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return apiResponse.error(res, "Target User ID or email is required.", 400);
    }

    if (
      String(targetUserId) === String(req.user._id) ||
      String(targetUserId).toLowerCase() === String(req.user.email).toLowerCase()
    ) {
      return apiResponse.error(res, "You cannot request access to your own location.", 400);
    }

    let recipient = null;
    if (mongoose.Types.ObjectId.isValid(targetUserId)) {
      recipient = await User.findById(targetUserId);
    }
    if (!recipient && typeof targetUserId === "string") {
      recipient = await User.findOne({ email: targetUserId.toLowerCase().trim() });
    }

    if (!recipient || !recipient.isActive) {
      return apiResponse.error(res, "Recipient user does not exist or is inactive.", 404);
    }

    // Hard Limit Check: 10 users max
    const activeRequestsCount = await LocationSharing.countDocuments({
      requester: req.user._id,
      status: { $in: ["pending", "accepted"] },
    });

    if (activeRequestsCount >= 10) {
      return apiResponse.error(
        res,
        "You have reached the maximum limit of 10 location access requests. Please remove an existing connection or request to add another user.",
        400
      );
    }

    // Check existing relationship
    let connection = await LocationSharing.findOne({
      $or: [
        { requester: req.user._id, recipient: recipient._id },
        { requester: recipient._id, recipient: req.user._id },
      ],
    });

    if (connection) {
      if (connection.status === "blocked") {
        if (connection.blockedBy && String(connection.blockedBy) !== String(req.user._id)) {
          return apiResponse.error(res, "Cannot request location access from this user.", 403);
        }
        // Current user previously blocked them, reset block and allow new request
        connection.blockedBy = null;
      }
      if (connection.status === "pending") {
        return apiResponse.error(res, "A location request is already pending between you and this user.", 400);
      }
      if (connection.status === "accepted") {
        return apiResponse.error(res, "You already have active location sharing with this user.", 400);
      }

      // If previously declined or resetting, renew the request
      connection.requester = req.user._id;
      connection.recipient = recipient._id;
      connection.status = "pending";
      connection.isRequesterSharing = true;
      connection.isRecipientSharing = true;
      connection.blockedBy = null;
      await connection.save();
    } else {
      connection = await LocationSharing.create({
        requester: req.user._id,
        recipient: recipient._id,
        status: "pending",
        isRequesterSharing: true,
        isRecipientSharing: true,
      });
    }

    // Create an in-app notification for the recipient
    try {
      const Notification = require("../models/Notification");
      await Notification.create({
        userId: recipient._id,
        title: "Live Location Access Request",
        message: `${req.user.firstName || "A commuter"} ${req.user.lastName || ""} requested access to share live locations with you on the Route Map.`,
        type: "system",
        category: "broadcast_by_admin",
        severity: "info",
      });
    } catch (notifErr) {
      console.warn("Could not dispatch location request notification:", notifErr);
    }

    await connection.populate("recipient", "_id firstName lastName email profilePhoto");
    return apiResponse.success(res, connection, "Location access request sent successfully.");
  } catch (error) {
    next(error);
  }
};

/**
 * Get all outgoing and incoming requests + count for limit
 */
const getConnections = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [outgoing, incoming] = await Promise.all([
      LocationSharing.find({ requester: userId })
        .populate("recipient", "_id firstName lastName email profilePhoto")
        .sort({ updatedAt: -1 }),
      LocationSharing.find({ recipient: userId })
        .populate("requester", "_id firstName lastName email profilePhoto")
        .sort({ updatedAt: -1 }),
    ]);

    const activeCount = await LocationSharing.countDocuments({
      requester: userId,
      status: { $in: ["pending", "accepted"] },
    });

    return apiResponse.success(res, {
      outgoing,
      incoming,
      activeCount,
      limit: 10,
    }, "Connections retrieved.");
  } catch (error) {
    next(error);
  }
};

/**
 * Accept or decline a location sharing request
 */
const respondToRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' | 'decline' | 'block'

    const connection = await LocationSharing.findById(id);
    if (!connection) {
      return apiResponse.error(res, "Location request not found.", 404);
    }

    // Only recipient can accept or decline an incoming request
    if (String(connection.recipient) !== String(req.user._id)) {
      return apiResponse.error(res, "You are not authorized to respond to this request.", 403);
    }

    if (action === "accept") {
      connection.status = "accepted";
      connection.isRecipientSharing = true;
      connection.isRequesterSharing = true;
    } else if (action === "decline") {
      connection.status = "declined";
    } else if (action === "block") {
      connection.status = "blocked";
      connection.blockedBy = req.user._id;
    } else {
      return apiResponse.error(res, "Invalid action. Use accept, decline, or block.", 400);
    }

    await connection.save();
    return apiResponse.success(res, connection, `Request ${action}ed successfully.`);
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle location sharing ON/OFF for an accepted connection
 */
const toggleSharing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { enabled } = req.body; // boolean

    const connection = await LocationSharing.findById(id);
    if (!connection) {
      return apiResponse.error(res, "Connection not found.", 404);
    }

    const isRequester = String(connection.requester) === String(req.user._id);
    const isRecipient = String(connection.recipient) === String(req.user._id);

    if (!isRequester && !isRecipient) {
      return apiResponse.error(res, "Not authorized.", 403);
    }

    if (isRequester) {
      connection.isRequesterSharing = !!enabled;
    } else {
      connection.isRecipientSharing = !!enabled;
    }

    await connection.save();
    return apiResponse.success(
      res,
      connection,
      `Location sharing ${enabled ? "turned ON" : "turned OFF"}.`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Block user or remove connection
 */
const blockOrRemoveConnection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { block } = req.query; // ?block=true to block, otherwise remove

    const connection = await LocationSharing.findById(id);
    if (!connection) {
      return apiResponse.error(res, "Connection not found.", 404);
    }

    const isRequester = String(connection.requester) === String(req.user._id);
    const isRecipient = String(connection.recipient) === String(req.user._id);

    if (!isRequester && !isRecipient) {
      return apiResponse.error(res, "Not authorized.", 403);
    }

    if (block === "true") {
      connection.status = "blocked";
      connection.blockedBy = req.user._id;
      await connection.save();
      return apiResponse.success(res, connection, "User has been blocked from accessing your location.");
    } else {
      await LocationSharing.findByIdAndDelete(id);
      return apiResponse.success(res, null, "Location sharing connection removed.");
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Periodically post user's current GPS location for authorized peers
 */
const updateMyLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    const numLat = typeof lat === "number" ? lat : parseFloat(lat);
    const numLng = typeof lng === "number" ? lng : parseFloat(lng);

    if (isNaN(numLat) || isNaN(numLng)) {
      return apiResponse.error(res, "Valid lat and lng numbers are required.", 400);
    }

    const now = new Date();

    await Promise.all([
      // Update as requester where sharing is active
      LocationSharing.updateMany(
        {
          requester: req.user._id,
          status: "accepted",
          isRequesterSharing: true,
        },
        {
          $set: {
            "requesterLocation.lat": lat,
            "requesterLocation.lng": lng,
            "requesterLocation.updatedAt": now,
          },
        }
      ),
      // Update as recipient where sharing is active
      LocationSharing.updateMany(
        {
          recipient: req.user._id,
          status: "accepted",
          isRecipientSharing: true,
        },
        {
          $set: {
            "recipientLocation.lat": lat,
            "recipientLocation.lng": lng,
            "recipientLocation.updatedAt": now,
          },
        }
      ),
    ]);

    return apiResponse.success(res, { lat, lng, updatedAt: now }, "Location updated.");
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch all accepted peers whose location should display on the commuter's map
 */
const getPeerLocations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Find accepted connections where the other person has sharing ON
    const [asRequester, asRecipient] = await Promise.all([
      LocationSharing.find({
        requester: userId,
        status: "accepted",
        isRecipientSharing: true, // Recipient has permitted sharing their location
      }).populate("recipient", "_id firstName lastName email profilePhoto"),

      LocationSharing.find({
        recipient: userId,
        status: "accepted",
        isRequesterSharing: true, // Requester has permitted sharing their location
      }).populate("requester", "_id firstName lastName email profilePhoto"),
    ]);

    const peers = [];

    asRequester.forEach((conn) => {
      if (conn.recipient && conn.recipientLocation && conn.recipientLocation.lat) {
        peers.push({
          connectionId: conn._id,
          userId: conn.recipient._id,
          name: `${conn.recipient.firstName} ${conn.recipient.lastName}`.trim(),
          email: conn.recipient.email,
          profilePhoto: conn.recipient.profilePhoto,
          lat: conn.recipientLocation.lat,
          lng: conn.recipientLocation.lng,
          updatedAt: conn.recipientLocation.updatedAt,
          mySharingEnabled: conn.isRequesterSharing,
          peerSharingEnabled: conn.isRecipientSharing,
        });
      }
    });

    asRecipient.forEach((conn) => {
      if (conn.requester && conn.requesterLocation && conn.requesterLocation.lat) {
        peers.push({
          connectionId: conn._id,
          userId: conn.requester._id,
          name: `${conn.requester.firstName} ${conn.requester.lastName}`.trim(),
          email: conn.requester.email,
          profilePhoto: conn.requester.profilePhoto,
          lat: conn.requesterLocation.lat,
          lng: conn.requesterLocation.lng,
          updatedAt: conn.requesterLocation.updatedAt,
          mySharingEnabled: conn.isRecipientSharing,
          peerSharingEnabled: conn.isRequesterSharing,
        });
      }
    });

    return apiResponse.success(res, peers, "Peer locations retrieved.");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchUser,
  sendRequest,
  getConnections,
  respondToRequest,
  toggleSharing,
  blockOrRemoveConnection,
  updateMyLocation,
  getPeerLocations,
};
