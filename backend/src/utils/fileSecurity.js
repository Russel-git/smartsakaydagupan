const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

/**
 * Magic numbers (file signatures) for allowed image formats
 */
const MAGIC_BYTES = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  riff: [0x52, 0x49, 0x46, 0x46], // "RIFF"
  webp: [0x57, 0x45, 0x42, 0x50], // "WEBP" at byte 8
};

function matchBytes(buffer, pattern, offset = 0) {
  if (buffer.length < offset + pattern.length) return false;
  for (let i = 0; i < pattern.length; i++) {
    if (buffer[offset + i] !== pattern[i]) return false;
  }
  return true;
}

/**
 * Validates binary buffer against real image file headers.
 * Protects against MIME-type spoofing, polyglots, and disguised scripts.
 */
function validateImageBuffer(buffer) {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: "File buffer is too small or empty." };
  }

  let detectedType = null;
  let ext = null;

  if (matchBytes(buffer, MAGIC_BYTES.jpeg, 0)) {
    detectedType = "image/jpeg";
    ext = ".jpg";
  } else if (matchBytes(buffer, MAGIC_BYTES.png, 0)) {
    detectedType = "image/png";
    ext = ".png";
  } else if (
    matchBytes(buffer, MAGIC_BYTES.riff, 0) &&
    matchBytes(buffer, MAGIC_BYTES.webp, 8)
  ) {
    detectedType = "image/webp";
    ext = ".webp";
  } else {
    return {
      valid: false,
      error: "Invalid file signature. Only legitimate JPEG, PNG, or WebP images are allowed.",
    };
  }

  // Scan head and tail for embedded script / polyglot payloads (e.g. PHP scripts, HTML/SVG XSS)
  const sampleHead = buffer.subarray(0, Math.min(buffer.length, 4096)).toString("latin1").toLowerCase();
  const sampleTail = buffer.subarray(Math.max(0, buffer.length - 4096)).toString("latin1").toLowerCase();
  const dangerousPatterns = [
    "<?php",
    "<?=",
    "<% ",
    "<script",
    "<html",
    "<svg",
  ];

  for (const pattern of dangerousPatterns) {
    if (sampleHead.includes(pattern) || sampleTail.includes(pattern)) {
      return {
        valid: false,
        error: "File rejected: disallowed script tag detected inside file payload.",
      };
    }
  }

  return { valid: true, detectedType, ext };
}

/**
 * Generates a completely secure, random UUID filename with canonical extension.
 * Eliminates directory traversal and filename-based injection attacks.
 */
function generateSafeFilename(ext) {
  const safeExt = ext.startsWith(".") ? ext : `.${ext}`;
  const randomId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");
  return `avatar-${Date.now()}-${randomId}${safeExt}`;
}

module.exports = {
  validateImageBuffer,
  generateSafeFilename,
};
