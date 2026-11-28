import { isValidIndianPincode } from "./financials.ts";

export interface PincodeLocationResult {
  valid: boolean;
  pincode: string;
  city: string;
  state: string;
  source: "postalpincode" | "prefix_fallback";
}

const CITY_PREFIX_MAP: Array<[string, string, string]> = [
  ["110", "New Delhi", "Delhi"],
  ["122", "Gurugram", "Haryana"],
  ["121", "Faridabad", "Haryana"],
  ["141", "Ludhiana", "Punjab"],
  ["143", "Amritsar", "Punjab"],
  ["160", "Chandigarh", "Chandigarh"],
  ["201", "Noida", "Uttar Pradesh"],
  ["208", "Kanpur", "Uttar Pradesh"],
  ["221", "Varanasi", "Uttar Pradesh"],
  ["226", "Lucknow", "Uttar Pradesh"],
  ["248", "Dehradun", "Uttarakhand"],
  ["302", "Jaipur", "Rajasthan"],
  ["313", "Udaipur", "Rajasthan"],
  ["342", "Jodhpur", "Rajasthan"],
  ["360", "Rajkot", "Gujarat"],
  ["364", "Bhavnagar", "Gujarat"],
  ["370", "Bhuj", "Gujarat"],
  ["380", "Ahmedabad", "Gujarat"],
  ["382", "Gandhinagar", "Gujarat"],
  ["388", "Anand", "Gujarat"],
  ["390", "Vadodara", "Gujarat"],
  ["395", "Surat", "Gujarat"],
  ["400", "Mumbai", "Maharashtra"],
  ["401", "Thane", "Maharashtra"],
  ["403", "Panaji", "Goa"],
  ["411", "Pune", "Maharashtra"],
  ["422", "Nashik", "Maharashtra"],
  ["440", "Nagpur", "Maharashtra"],
  ["452", "Indore", "Madhya Pradesh"],
  ["462", "Bhopal", "Madhya Pradesh"],
  ["492", "Raipur", "Chhattisgarh"],
  ["500", "Hyderabad", "Telangana"],
  ["520", "Vijayawada", "Andhra Pradesh"],
  ["530", "Visakhapatnam", "Andhra Pradesh"],
  ["560", "Bengaluru", "Karnataka"],
  ["570", "Mysuru", "Karnataka"],
  ["575", "Mangaluru", "Karnataka"],
  ["600", "Chennai", "Tamil Nadu"],
  ["620", "Tiruchirappalli", "Tamil Nadu"],
  ["625", "Madurai", "Tamil Nadu"],
  ["641", "Coimbatore", "Tamil Nadu"],
  ["682", "Kochi", "Kerala"],
  ["695", "Thiruvananthapuram", "Kerala"],
  ["700", "Kolkata", "West Bengal"],
  ["734", "Siliguri", "West Bengal"],
  ["751", "Bhubaneswar", "Odisha"],
  ["781", "Guwahati", "Assam"],
  ["800", "Patna", "Bihar"],
  ["834", "Ranchi", "Jharkhand"],
];

const STATE_BY_2DIGIT: Record<string, { state: string; defaultCity: string }> = {
  "11": { state: "Delhi", defaultCity: "New Delhi" },
  "12": { state: "Haryana", defaultCity: "Gurugram" },
  "13": { state: "Haryana", defaultCity: "Ambala" },
  "14": { state: "Punjab", defaultCity: "Ludhiana" },
  "15": { state: "Punjab", defaultCity: "Bathinda" },
  "16": { state: "Chandigarh", defaultCity: "Chandigarh" },
  "17": { state: "Himachal Pradesh", defaultCity: "Shimla" },
  "18": { state: "Jammu and Kashmir", defaultCity: "Jammu" },
  "19": { state: "Jammu and Kashmir", defaultCity: "Srinagar" },
  "20": { state: "Uttar Pradesh", defaultCity: "Noida" },
  "21": { state: "Uttar Pradesh", defaultCity: "Prayagraj" },
  "22": { state: "Uttar Pradesh", defaultCity: "Lucknow" },
  "23": { state: "Uttar Pradesh", defaultCity: "Mirzapur" },
  "24": { state: "Uttar Pradesh", defaultCity: "Bareilly" },
  "25": { state: "Uttar Pradesh", defaultCity: "Meerut" },
  "26": { state: "Uttarakhand", defaultCity: "Haldwani" },
  "27": { state: "Uttar Pradesh", defaultCity: "Gorakhpur" },
  "28": { state: "Uttar Pradesh", defaultCity: "Agra" },
  "30": { state: "Rajasthan", defaultCity: "Jaipur" },
  "31": { state: "Rajasthan", defaultCity: "Udaipur" },
  "32": { state: "Rajasthan", defaultCity: "Kota" },
  "33": { state: "Rajasthan", defaultCity: "Bikaner" },
  "34": { state: "Rajasthan", defaultCity: "Jodhpur" },
  "36": { state: "Gujarat", defaultCity: "Rajkot" },
  "37": { state: "Gujarat", defaultCity: "Bhuj" },
  "38": { state: "Gujarat", defaultCity: "Ahmedabad" },
  "39": { state: "Gujarat", defaultCity: "Surat" },
  "40": { state: "Maharashtra", defaultCity: "Mumbai" },
  "41": { state: "Maharashtra", defaultCity: "Pune" },
  "42": { state: "Maharashtra", defaultCity: "Nashik" },
  "43": { state: "Maharashtra", defaultCity: "Chhatrapati Sambhajinagar" },
  "44": { state: "Maharashtra", defaultCity: "Nagpur" },
  "45": { state: "Madhya Pradesh", defaultCity: "Indore" },
  "46": { state: "Madhya Pradesh", defaultCity: "Bhopal" },
  "47": { state: "Madhya Pradesh", defaultCity: "Gwalior" },
  "48": { state: "Madhya Pradesh", defaultCity: "Jabalpur" },
  "49": { state: "Chhattisgarh", defaultCity: "Raipur" },
  "50": { state: "Telangana", defaultCity: "Hyderabad" },
  "51": { state: "Andhra Pradesh", defaultCity: "Tirupati" },
  "52": { state: "Andhra Pradesh", defaultCity: "Vijayawada" },
  "53": { state: "Andhra Pradesh", defaultCity: "Visakhapatnam" },
  "56": { state: "Karnataka", defaultCity: "Bengaluru" },
  "57": { state: "Karnataka", defaultCity: "Mysuru" },
  "58": { state: "Karnataka", defaultCity: "Hubballi" },
  "59": { state: "Karnataka", defaultCity: "Belagavi" },
  "60": { state: "Tamil Nadu", defaultCity: "Chennai" },
  "61": { state: "Tamil Nadu", defaultCity: "Thanjavur" },
  "62": { state: "Tamil Nadu", defaultCity: "Madurai" },
  "63": { state: "Tamil Nadu", defaultCity: "Salem" },
  "64": { state: "Tamil Nadu", defaultCity: "Coimbatore" },
  "67": { state: "Kerala", defaultCity: "Kozhikode" },
  "68": { state: "Kerala", defaultCity: "Kochi" },
  "69": { state: "Kerala", defaultCity: "Thiruvananthapuram" },
  "70": { state: "West Bengal", defaultCity: "Kolkata" },
  "71": { state: "West Bengal", defaultCity: "Howrah" },
  "72": { state: "West Bengal", defaultCity: "Kharagpur" },
  "73": { state: "West Bengal", defaultCity: "Siliguri" },
  "74": { state: "West Bengal", defaultCity: "Barasat" },
  "75": { state: "Odisha", defaultCity: "Bhubaneswar" },
  "76": { state: "Odisha", defaultCity: "Berhampur" },
  "77": { state: "Odisha", defaultCity: "Rourkela" },
  "78": { state: "Assam", defaultCity: "Guwahati" },
  "79": { state: "Meghalaya", defaultCity: "Shillong" },
  "80": { state: "Bihar", defaultCity: "Patna" },
  "81": { state: "Bihar", defaultCity: "Bhagalpur" },
  "82": { state: "Bihar", defaultCity: "Gaya" },
  "83": { state: "Jharkhand", defaultCity: "Ranchi" },
  "84": { state: "Bihar", defaultCity: "Muzaffarpur" },
  "85": { state: "Bihar", defaultCity: "Purnia" },
};

/**
 * All Indian States & Union Territories matching India Post normalized names.
 */
export const ALL_INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Delhi NCR",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

/**
 * Normalizes India Post state names to match AVSARAA state dropdown options cleanly.
 */
export function normalizeIndianStateName(rawState: string): string {
  const clean = rawState.trim().toLowerCase();
  if (clean.includes("delhi")) return "Delhi";
  if (clean.includes("jammu")) return "Jammu and Kashmir";
  if (clean.includes("ladakh")) return "Ladakh";
  if (clean.includes("lakshadweep")) return "Lakshadweep";
  if (clean.includes("andaman")) return "Andaman and Nicobar Islands";
  if (clean.includes("dadra") || clean.includes("daman")) return "Dadra and Nagar Haveli and Daman and Diu";
  if (clean.includes("orissa") || clean.includes("odisha")) return "Odisha";
  if (clean.includes("pondicherry") || clean.includes("puducherry")) return "Puducherry";
  return rawState
    .trim()
    .split(/\s+/)
    .map((w) => (w.toLowerCase() === "and" ? "and" : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
    .join(" ");
}

/**
 * Returns an exact 3-digit metro/city match without falling back to state capitals.
 */
export function lookupExactCityByPinPrefix(rawPin: string): PincodeLocationResult | null {
  const pin = String(rawPin || "").trim();
  if (!isValidIndianPincode(pin)) return null;
  const prefix3 = pin.slice(0, 3);
  const cityHit = CITY_PREFIX_MAP.find(([p]) => p === prefix3);
  if (!cityHit) return null;
  return {
    valid: true,
    pincode: pin,
    city: cityHit[1],
    state: cityHit[2],
    source: "prefix_fallback",
  };
}

/**
 * Resolves city & state synchronously from deterministic Indian PIN prefix ranges.
 */
export function lookupPincodeLocally(rawPin: string): PincodeLocationResult | null {
  const pin = String(rawPin || "").trim();
  if (!isValidIndianPincode(pin)) return null;

  const exactCity = lookupExactCityByPinPrefix(pin);
  if (exactCity) return exactCity;

  const prefix2 = pin.slice(0, 2);
  const stateHit = STATE_BY_2DIGIT[prefix2];
  if (stateHit) {
    return {
      valid: true,
      pincode: pin,
      city: stateHit.defaultCity,
      state: stateHit.state,
      source: "prefix_fallback",
    };
  }

  return null;
}
