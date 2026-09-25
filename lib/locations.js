// ============================================================
// SRM University-AP campus locations.
//
// Campus centre (verified): 16.46321, 80.50640
//
// The individual building coordinates below are PLACED BY EYE around
// that centre and should be corrected once — it takes about 5 minutes:
//
//   1. Open Google Maps, search "SRM University AP".
//   2. Right-click the actual building -> the first item in the menu
//      is "16.4635, 80.5061". Click it to copy.
//   3. Paste it into lat / lng below.
//
// Add, rename or delete entries freely. `id` must stay stable once
// photos are attached to it — it is what the database stores.
// ============================================================

export const CAMPUS_CENTER = [16.46321, 80.50640];
export const CAMPUS_ZOOM = 17;

export const LOCATIONS = [
  { id: 'main-building',  name: 'University Main Building', lat: 16.46330, lng: 80.50640 },
  { id: 'library',        name: 'Central Library',          lat: 16.46375, lng: 80.50585 },
  { id: 'ab1',            name: 'Academic Block 1',         lat: 16.46290, lng: 80.50700 },
  { id: 'ab2',            name: 'Academic Block 2',         lat: 16.46245, lng: 80.50660 },
  { id: 'auditorium',     name: 'Auditorium',               lat: 16.46400, lng: 80.50700 },
  { id: 'amphitheatre',   name: 'Amphitheatre',             lat: 16.46265, lng: 80.50575 },
  { id: 'ground',         name: 'Sports Ground',            lat: 16.46190, lng: 80.50780 },
  { id: 'food-court',     name: 'Food Court',               lat: 16.46350, lng: 80.50740 },
  { id: 'boys-hostel',    name: 'Boys Hostel',              lat: 16.46460, lng: 80.50780 },
  { id: 'girls-hostel',   name: 'Girls Hostel',             lat: 16.46460, lng: 80.50520 },
  { id: 'main-gate',      name: 'Main Gate',                lat: 16.46180, lng: 80.50640 },
];

export const CATEGORIES = ['Event', 'Club', 'Campus life', 'Sports', 'Academics'];

export const locationById = (id) => LOCATIONS.find((l) => l.id === id) || null;
export const locationName = (id) => locationById(id)?.name || 'Unknown place';
