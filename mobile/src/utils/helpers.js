// Format currency in Philippine Peso
export const formatPeso = (amount) => {
  return `₱${Number(amount).toFixed(2)}`;
};

// Format date relative or absolute
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

// Format full date/time
export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Calculate distance between two GPS coordinates (Haversine formula)
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (deg) => deg * (Math.PI / 180);

// Format distance
export const formatDistance = (km) => {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)} km`;
};

// Get weather icon name based on condition code or condition text
export const getWeatherIcon = (condition, isDay = true) => {
  if (typeof condition === 'number') {
    if (condition === 1000 || condition === 0) return isDay ? 'weather-sunny' : 'weather-night';
    if (condition === 1003 || condition === 1 || condition === 2) return isDay ? 'weather-partly-cloudy' : 'weather-night-partly-cloudy';
    if ([1006, 1009, 3].includes(condition)) return 'weather-cloudy';
    if ([1030, 1135, 1147, 45, 48].includes(condition)) return 'weather-fog';
    if ([1063, 1150, 1153, 1180, 1183, 51, 53, 55].includes(condition)) return 'weather-partly-rainy';
    if ([1186, 1189, 1192, 1195, 1240, 1243, 1246, 61, 63, 65, 80, 81, 82].includes(condition)) return 'weather-rainy';
    if ([1087, 1273, 1276, 95, 96, 99].includes(condition)) return 'weather-lightning-rainy';
  }
  const text = (typeof condition === 'string' ? condition : condition?.text || '').toLowerCase();
  if (text.includes('thunder') || text.includes('lightning') || text.includes('storm')) return 'weather-lightning-rainy';
  if (text.includes('shower') || text.includes('rain') || text.includes('drizzle')) return 'weather-rainy';
  if (text.includes('cloud') || text.includes('overcast')) return isDay ? 'weather-partly-cloudy' : 'weather-night-partly-cloudy';
  if (text.includes('fog') || text.includes('mist') || text.includes('haze')) return 'weather-fog';
  if (text.includes('clear') || text.includes('sunny')) return isDay ? 'weather-sunny' : 'weather-night';
  return isDay ? 'weather-partly-cloudy' : 'weather-night-partly-cloudy';
};

// Get travel advisory based on weather
export const getTravelAdvisory = (condition, windKph, feelsLikeC) => {
  const alerts = [];
  const text = typeof condition === 'string' ? condition : (condition?.text || '');
  if (text.toLowerCase().includes('rain') || text.toLowerCase().includes('thunder')) {
    alerts.push({ type: 'warning', message: 'Rain expected — carry an umbrella and plan for possible delays.' });
  }
  if (Number(windKph) > 50) {
    alerts.push({ type: 'warning', message: 'Strong winds detected — be cautious during travel.' });
  }
  if (Number(feelsLikeC) > 38) {
    alerts.push({ type: 'info', message: 'Extreme heat — stay hydrated during your commute.' });
  }
  if (alerts.length === 0) {
    alerts.push({ type: 'success', message: 'Good weather conditions for commuting today.' });
  }
  return alerts;
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Get initials from name
export const getInitials = (firstName, lastName) => {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
};

// Validate email
export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// Validate name: only contains letters, not less than 2 chars and not exceeding 16 chars
export const isValidName = (name) => {
  const trimmed = (name || '').trim();
  if (trimmed.length < 2 || trimmed.length > 16) return false;
  return /^[A-Za-z]+(\s[A-Za-z]+)*$/.test(trimmed);
};


// Validate password strength (at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
export const validatePassword = (password) => {
  const errors = [];
  if (!password || password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least 1 uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least 1 lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('At least 1 number');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) errors.push('At least 1 special character');
  return { isValid: errors.length === 0, errors };
};

