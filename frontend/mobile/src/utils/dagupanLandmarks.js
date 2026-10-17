/**
 * Complete Dagupan City Transit & Geographic Directory
 * Includes all 31 official Barangays, major landmarks, hospitals, schools, and malls.
 */

export const DAGUPAN_BARANGAYS = [
  { name: "Barangay Bacayao Norte", category: "Barangay", address: "Bacayao Norte, Dagupan City", lat: 16.0336, lng: 120.3421, keywords: ["bacayao", "norte", "brgy bacayao norte"] },
  { name: "Barangay Bacayao Sur", category: "Barangay", address: "Bacayao Sur, Dagupan City", lat: 16.0275, lng: 120.3458, keywords: ["bacayao", "sur", "brgy bacayao sur"] },
  { name: "Barangay I (Poblacion / Downtown)", category: "Barangay", address: "Barangay 1, Downtown, Dagupan City", lat: 16.0435, lng: 120.3340, keywords: ["barangay 1", "brgy 1", "poblacion", "downtown"] },
  { name: "Barangay II (Poblacion)", category: "Barangay", address: "Barangay 2, Poblacion, Dagupan City", lat: 16.0448, lng: 120.3365, keywords: ["barangay 2", "brgy 2", "poblacion"] },
  { name: "Barangay IV (Poblacion)", category: "Barangay", address: "Barangay 4, Poblacion, Dagupan City", lat: 16.0425, lng: 120.3378, keywords: ["barangay 4", "brgy 4", "poblacion"] },
  { name: "Barangay Bolosan", category: "Barangay", address: "Bolosan, Dagupan City", lat: 16.0535, lng: 120.3635, keywords: ["bolosan", "brgy bolosan", "bolosan highway"] },
  { name: "Barangay Bonuan Binloc", category: "Barangay", address: "Bonuan Binloc, Dagupan City", lat: 16.0885, lng: 120.3710, keywords: ["bonuan", "binloc", "brgy bonuan binloc"] },
  { name: "Barangay Bonuan Boquig", category: "Barangay", address: "Bonuan Boquig, Dagupan City", lat: 16.0815, lng: 120.3595, keywords: ["bonuan", "boquig", "brgy bonuan boquig", "tondaligan"] },
  { name: "Barangay Bonuan Gueset", category: "Barangay", address: "Bonuan Gueset, Dagupan City", lat: 16.0725, lng: 120.3485, keywords: ["bonuan", "gueset", "brgy bonuan gueset", "blue beach"] },
  { name: "Barangay Calmay", category: "Barangay", address: "Calmay Island, Dagupan City", lat: 16.0545, lng: 120.3245, keywords: ["calmay", "brgy calmay"] },
  { name: "Barangay Carael", category: "Barangay", address: "Carael, Dagupan City", lat: 16.0595, lng: 120.3325, keywords: ["carael", "brgy carael"] },
  { name: "Barangay Caranglaan", category: "Barangay", address: "Caranglaan, Dagupan City", lat: 16.0395, lng: 120.3565, keywords: ["caranglaan", "brgy caranglaan", "crossing"] },
  { name: "Barangay Herrero-Perez", category: "Barangay", address: "Herrero-Perez, Dagupan City", lat: 16.0410, lng: 120.3425, keywords: ["herrero", "perez", "herrero-perez", "brgy herrero"] },
  { name: "Barangay Lasip Chico", category: "Barangay", address: "Lasip Chico, Dagupan City", lat: 16.0245, lng: 120.3415, keywords: ["lasip", "chico", "lasip chico", "brgy lasip chico"] },
  { name: "Barangay Lasip Grande", category: "Barangay", address: "Lasip Grande, Dagupan City", lat: 16.0210, lng: 120.3385, keywords: ["lasip", "grande", "lasip grande", "brgy lasip grande"] },
  { name: "Barangay Lomboy", category: "Barangay", address: "Lomboy, Dagupan City", lat: 16.0615, lng: 120.3280, keywords: ["lomboy", "brgy lomboy"] },
  { name: "Barangay Lucao", category: "Barangay", address: "Lucao District, Dagupan City", lat: 16.0285, lng: 120.3185, keywords: ["lucao", "brgy lucao", "csi lucao"] },
  { name: "Barangay Malued", category: "Barangay", address: "Malued, Dagupan City", lat: 16.0285, lng: 120.3315, keywords: ["malued", "brgy malued", "perez extension"] },
  { name: "Barangay Mamalingling", category: "Barangay", address: "Mamalingling, Dagupan City", lat: 16.0465, lng: 120.3665, keywords: ["mamalingling", "brgy mamalingling"] },
  { name: "Barangay Mangin", category: "Barangay", address: "Mangin, Dagupan City", lat: 16.0345, lng: 120.3625, keywords: ["mangin", "brgy mangin", "tebeng road"] },
  { name: "Barangay Mayombo", category: "Barangay", address: "Mayombo District, Dagupan City", lat: 16.0385, lng: 120.3425, keywords: ["mayombo", "brgy mayombo", "villaflor"] },
  { name: "Barangay Pantal", category: "Barangay", address: "Pantal, Dagupan City", lat: 16.0485, lng: 120.3385, keywords: ["pantal", "brgy pantal", "nepo mall", "riverwalk"] },
  { name: "Barangay Poblacion Oeste", category: "Barangay", address: "Poblacion Oeste, Dagupan City", lat: 16.0415, lng: 120.3315, keywords: ["poblacion", "oeste", "brgy poblacion oeste"] },
  { name: "Barangay Pogo Chico", category: "Barangay", address: "Pogo Chico, Dagupan City", lat: 16.0375, lng: 120.3355, keywords: ["pogo", "chico", "pogo chico", "brgy pogo chico"] },
  { name: "Barangay Pogo Grande", category: "Barangay", address: "Pogo Grande, Dagupan City", lat: 16.0335, lng: 120.3375, keywords: ["pogo", "grande", "pogo grande", "brgy pogo grande"] },
  { name: "Barangay Pugaro Suit", category: "Barangay", address: "Pugaro Suit, Dagupan City", lat: 16.0735, lng: 120.3265, keywords: ["pugaro", "suit", "pugaro suit", "brgy pugaro"] },
  { name: "Barangay Salapingao", category: "Barangay", address: "Salapingao, Dagupan City", lat: 16.0685, lng: 120.3235, keywords: ["salapingao", "brgy salapingao"] },
  { name: "Barangay Salisay", category: "Barangay", address: "Salisay, Dagupan City", lat: 16.0475, lng: 120.3705, keywords: ["salisay", "brgy salisay", "old road"] },
  { name: "Barangay Tambac", category: "Barangay", address: "Tambac, Dagupan City", lat: 16.0445, lng: 120.3545, keywords: ["tambac", "brgy tambac"] },
  { name: "Barangay Tapuac", category: "Barangay", address: "Tapuac District, Dagupan City", lat: 16.0345, lng: 120.3295, keywords: ["tapuac", "brgy tapuac", "dcnhs", "psu", "lnu"] },
  { name: "Barangay Tebeng", category: "Barangay", address: "Tebeng, Dagupan City", lat: 16.0315, lng: 120.3685, keywords: ["tebeng", "brgy tebeng"] },
];

export const DAGUPAN_LANDMARKS = [
  ...DAGUPAN_BARANGAYS,

  // Commercial Malls & Markets
  {
    name: "SM Center Dagupan",
    category: "Mall & Shopping",
    address: "MH Del Pilar St, Downtown District, Dagupan City",
    lat: 16.0441,
    lng: 120.3347,
    keywords: ["sm", "sm dagupan", "sm center", "mall"],
  },
  {
    name: "CSI City Mall Downtown",
    category: "Mall & Shopping",
    address: "AB Fernandez Ave, Downtown, Dagupan City",
    lat: 16.0435,
    lng: 120.3364,
    keywords: ["csi downtown", "csi city mall", "ab fernandez"],
  },
  {
    name: "CSI Mall Lucao",
    category: "Mall & Shopping",
    address: "Lucao District, Dagupan City",
    lat: 16.0278,
    lng: 120.3175,
    keywords: ["csi lucao", "csi mall lucao", "lucao supermarket"],
  },
  {
    name: "Nepo Mall Dagupan",
    category: "Mall & Shopping",
    address: "Arellano St, Pantal, Dagupan City",
    lat: 16.0468,
    lng: 120.3382,
    keywords: ["nepo", "nepo mall", "arellano"],
  },
  {
    name: "Dagupan City Public Market / Malimgas",
    category: "Public Market",
    address: "Galvan St & Rivera St, Downtown, Dagupan City",
    lat: 16.0452,
    lng: 120.3361,
    keywords: ["market", "public market", "malimgas", "galvan"],
  },
  {
    name: "Star Plaza Mall",
    category: "Mall & Shopping",
    address: "AB Fernandez Ave, Dagupan City",
    lat: 16.0438,
    lng: 120.3371,
    keywords: ["star plaza", "star plaza hotel"],
  },

  // Schools & Universities
  {
    name: "University of Luzon (UL)",
    category: "University",
    address: "Perez Blvd, Downtown, Dagupan City",
    lat: 16.0416,
    lng: 120.3353,
    keywords: ["ul", "university of luzon", "perez blvd school"],
  },
  {
    name: "Colegio de Dagupan (CdD)",
    category: "College",
    address: "Arellano St, Dagupan City",
    lat: 16.0475,
    lng: 120.3411,
    keywords: ["cdd", "colegio de dagupan"],
  },
  {
    name: "Universidad de Dagupan (UdD)",
    category: "University",
    address: "Arellano St, Downtown, Dagupan City",
    lat: 16.0461,
    lng: 120.3395,
    keywords: ["udd", "universidad de dagupan", "computronix"],
  },
  {
    name: "Pangasinan State University - Open University",
    category: "University",
    address: "Tapuac District, Dagupan City",
    lat: 16.0352,
    lng: 120.3308,
    keywords: ["psu", "pangasinan state university", "tapuac"],
  },
  {
    name: "Lyceum-Northwestern University (LNU)",
    category: "University",
    address: "Tapuac District, Dagupan City",
    lat: 16.0325,
    lng: 120.3284,
    keywords: ["lnu", "lyceum", "lyceum northwestern"],
  },
  {
    name: "Dagupan City National High School (DCNHS)",
    category: "School",
    address: "Tapuac District, Dagupan City",
    lat: 16.0371,
    lng: 120.3315,
    keywords: ["dcnhs", "city high", "national high school"],
  },

  // Hospitals & Medical Centers
  {
    name: "Region 1 Medical Center (R1MC)",
    category: "Hospital",
    address: "Arellano St, Dagupan City",
    lat: 16.0489,
    lng: 120.3445,
    keywords: ["r1mc", "region 1", "region 1 medical center", "hospital"],
  },
  {
    name: "Dagupan Doctors Villaflor Memorial Hospital",
    category: "Hospital",
    address: "Mayombo District, Dagupan City",
    lat: 16.0398,
    lng: 120.3421,
    keywords: ["villaflor", "doctors villaflor", "mayombo hospital"],
  },
  {
    name: "Nazareth General Hospital",
    category: "Hospital",
    address: "Perez Blvd, Downtown, Dagupan City",
    lat: 16.0409,
    lng: 120.3368,
    keywords: ["nazareth", "nazareth hospital", "perez"],
  },
  {
    name: "Cuison Clinic & Hospital",
    category: "Hospital",
    address: "Tapuac District, Dagupan City",
    lat: 16.0345,
    lng: 120.3302,
    keywords: ["cuison", "cuison clinic", "tapuac hospital"],
  },

  // Government, Parks & Safety
  {
    name: "Dagupan City Hall",
    category: "Government",
    address: "AB Fernandez Ave, Downtown, Dagupan City",
    lat: 16.0428,
    lng: 120.3338,
    keywords: ["city hall", "dagupan city hall", "mayor office"],
  },
  {
    name: "Dagupan City Plaza",
    category: "Public Plaza",
    address: "Downtown District, Dagupan City",
    lat: 16.0431,
    lng: 120.3355,
    keywords: ["plaza", "city plaza", "dagupan plaza"],
  },
  {
    name: "Tondaligan People's Park & Beach",
    category: "Recreation & Beach",
    address: "Bonuan Boquig / Tondaligan, Dagupan City",
    lat: 16.0825,
    lng: 120.3541,
    keywords: ["tondaligan", "tondaligan beach", "beach", "park"],
  },
  {
    name: "Bonuan Blue Beach",
    category: "Beach",
    address: "Bonuan Gueset, Dagupan City",
    lat: 16.0768,
    lng: 120.3462,
    keywords: ["blue beach", "bonuan beach"],
  },
  {
    name: "POSO Headquarters (Public Order & Safety Office)",
    category: "Government & Safety",
    address: "City Hall Compound, AB Fernandez Ave, Dagupan City",
    lat: 16.0425,
    lng: 120.3335,
    keywords: ["poso", "public order and safety", "traffic office"],
  },
  {
    name: "Dagupan Police Station",
    category: "Safety",
    address: "Perez Blvd, Dagupan City",
    lat: 16.0418,
    lng: 120.3341,
    keywords: ["police", "pnp", "dagupan police station"],
  },

  // Bus Terminals & Transit Hubs
  {
    name: "Victory Liner Terminal Dagupan",
    category: "Bus Terminal",
    address: "Perez Blvd, Downtown, Dagupan City",
    lat: 16.0402,
    lng: 120.3385,
    keywords: ["victory liner", "victory liner terminal", "perez bus"],
  },
  {
    name: "Five Star Bus Terminal Dagupan",
    category: "Bus Terminal",
    address: "Perez Blvd, Dagupan City",
    lat: 16.0395,
    lng: 120.3401,
    keywords: ["five star", "five star terminal"],
  },
  {
    name: "Solid North Bus Terminal",
    category: "Bus Terminal",
    address: "Mayombo District, Dagupan City",
    lat: 16.0381,
    lng: 120.3418,
    keywords: ["solid north", "solid north terminal", "mayombo bus"],
  },
  {
    name: "Lucao Multimodal Transit Terminal",
    category: "Transit Hub",
    address: "Lucao District, Dagupan City",
    lat: 16.0265,
    lng: 120.3168,
    keywords: ["lucao terminal", "multimodal", "staging hub"],
  },
  {
    name: "Dagupan-San Carlos Jeepney Terminal",
    category: "Jeepney Terminal",
    address: "Galvan St / Downtown, Dagupan City",
    lat: 16.0445,
    lng: 120.3355,
    keywords: ["san carlos jeepney", "galvan terminal"],
  },
  {
    name: "Bonuan TODA Staging Hub",
    category: "TODA Hub",
    address: "Bonuan Boquig, Dagupan City",
    lat: 16.0810,
    lng: 120.3585,
    keywords: ["bonuan toda", "tricycle hub"],
  },
];

/**
 * Filter landmarks and all 31 barangays matching search query
 */
export const searchDagupanLandmarks = (query) => {
  if (!query || !query.trim()) {
    return DAGUPAN_LANDMARKS.slice(0, 8);
  }
  const rawQ = query.toLowerCase().trim();
  const cleanQ = rawQ.replace(/^(brgy\.?|barangay)\s+/i, "");

  return DAGUPAN_LANDMARKS.filter((item) => {
    const nameMatch = item.name.toLowerCase().includes(rawQ) || item.name.toLowerCase().includes(cleanQ);
    const catMatch = item.category.toLowerCase().includes(rawQ);
    const addrMatch = item.address.toLowerCase().includes(rawQ) || item.address.toLowerCase().includes(cleanQ);
    const kwMatch = item.keywords && item.keywords.some((k) => k.includes(rawQ) || cleanQ.includes(k) || k.includes(cleanQ));
    return nameMatch || catMatch || addrMatch || kwMatch;
  }).slice(0, 10);
};

/**
 * Fallback Geocoder without blocked browser headers
 */
export const geocodeDagupanLocation = async (query) => {
  if (!query || query.trim().length < 3) return [];
  try {
    const encoded = encodeURIComponent(`${query.trim()}, Dagupan, Pangasinan`);
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=5&viewbox=120.28,16.12,120.40,15.98&bounded=0`;
    
    // Do NOT set custom User-Agent in browser fetch to prevent CORS/unsafe header blocks
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    return (data || []).map((item) => ({
      name: item.display_name.split(",")[0] || item.display_name,
      category: item.type ? item.type.toUpperCase() : "Location",
      address: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch (e) {
    return [];
  }
};
