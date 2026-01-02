export const VENUE_CATEGORIES = [
  'Food & Beverage',
  'Beauty & Wellness',
  'Fitness & Sports',
  'Nightlife & Entertainment',
  'Retail & Fashion',
  'Hotels & Accommodation',
  'Events & Experiences',
  'Arts & Culture',
  'Health & Medical Services',
  'Services',
  'Online Stores / E-commerce',
  'Tech & Gadgets',
  'Home & Interior',
  'Kids & Family',
  'Auto & Mobility',
] as const;

export const CREATOR_FIELDS = [
  'Food',
  'Travel',
  'Lifestyle',
  'Fashion',
  'Beauty',
  'Fitness',
  'Tech',
  'Gaming',
  'Music',
  'Art',
  'Photography',
  'Parenting',
  'Business',
  'Education',
  'Entertainment',
] as const;

export const INFLUENCER_FIELDS = [
  'Food & Dining',
  'Travel & Lifestyle',
  'Fashion & Style',
  'Beauty & Skincare',
  'Fitness & Health',
  'Tech & Gaming',
  'Entertainment',
  'Family & Parenting',
  'Business & Finance',
  'Art & Photography',
] as const;

export const FOLLOWER_RANGES = [
  { value: 'under5k', label: '<5K', min: 0, max: 5000 },
  { value: '5to10k', label: '5-10K', min: 5000, max: 10000 },
  { value: '10to20k', label: '10-20K', min: 10000, max: 20000 },
  { value: 'over20k', label: '20K+', min: 20000, max: Infinity },
] as const;

export const HUNGARIAN_CITIES = [
  'Budapest',
  'Debrecen',
  'Szeged',
  'Miskolc',
  'Pécs',
  'Győr',
  'Nyíregyháza',
  'Kecskemét',
  'Székesfehérvár',
  'Szombathely',
  'Szolnok',
  'Tatabánya',
  'Kaposvár',
  'Érd',
  'Veszprém',
  'Békéscsaba',
  'Zalaegerszeg',
  'Sopron',
  'Eger',
  'Nagykanizsa',
] as const;

export type VenueCategory = typeof VENUE_CATEGORIES[number];
export type CreatorField = typeof CREATOR_FIELDS[number];
export type HungarianCity = typeof HUNGARIAN_CITIES[number];

