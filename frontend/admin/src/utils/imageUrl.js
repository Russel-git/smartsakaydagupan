/**
 * Resolves uploaded image path to a full accessible URL.
 * Handles:
 * - Full URLs (http://, https://)
 * - Base64 data URLs (data:image/...)
 * - Local blobs (blob:...)
 * - Server relative upload paths (/uploads/...)
 */
export const getEvidenceImageUrl = (photoUrl) => {
  if (!photoUrl) return "";

  if (
    photoUrl.startsWith("http://") ||
    photoUrl.startsWith("https://") ||
    photoUrl.startsWith("data:") ||
    photoUrl.startsWith("blob:")
  ) {
    return photoUrl;
  }

  const cleanPath = photoUrl.startsWith("/") ? photoUrl : `/${photoUrl}`;

  const apiUrl =
    import.meta.env.VITE_API_URL ||
    (typeof window !== "undefined" &&
    window.location &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
      ? "https://smartsakay-backend.onrender.com/api"
      : "http://localhost:5000/api");

  const backendUrl = apiUrl.replace(/\/api\/?$/, "");

  // If we have an external production backend URL, prefix it; otherwise local proxy will handle /uploads
  if (backendUrl && !backendUrl.includes("localhost") && !backendUrl.includes("127.0.0.1")) {
    return `${backendUrl}${cleanPath}`;
  }

  // In local dev, Vite proxies /uploads -> http://localhost:5000/uploads
  return cleanPath;
};

export default getEvidenceImageUrl;
