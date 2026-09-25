// ============================================================
// SRM University-AP campus locations.
// Real locations and coordinates, confirmed by the club.
// ============================================================

export const CAMPUS_CENTER = [16.46321, 80.50640];
export const CAMPUS_ZOOM = 17;

export const LOCATIONS = [
  { id: 'ganga-block',      name: 'Ganga Block',              lat: 16.463551448563845, lng: 80.50667532615668 },
  { id: 'gate-3',           name: 'SRM AP Gate 3',             lat: 16.464338774063535, lng: 80.50866915266484 },
  { id: 'vikram-sarabhai',  name: 'Vikram Sarabhai Block',     lat: 16.46492550042218,  lng: 80.50776648314978 },
  { id: 'basketball-court', name: 'Basketball Court',          lat: 16.465445513270712, lng: 80.50751130699693 },
  { id: 'food-court',       name: 'SRM AP Food Court Area',    lat: 16.462973489990322, lng: 80.50830301570319 },
  { id: 'ground',           name: 'Ground',                    lat: 16.46221773824293,  lng: 80.50783285860535 },
  { id: 'sr-block',         name: 'SR Block',                  lat: 16.46278022651131,  lng: 80.50690379758143 },
  { id: 'cv-block',         name: 'C.V. Block',                lat: 16.46181601724676,  lng: 80.50577744355878 },
  { id: 'central-library',  name: 'SRM AP Central Library',    lat: 16.461726892895154, lng: 80.50606193477425 },
  { id: 'auditorium-xlab',  name: 'Auditorium & X-Lab',        lat: 16.463684877550794, lng: 80.5073176579699 },
  { id: 'jc-bose-block',    name: 'J.C. Bose Block',           lat: 16.46418534926884,  lng: 80.50788226369505 },
];

export const CATEGORIES = ['Event', 'Club', 'Campus life', 'Sports', 'Academics'];

export const locationById = (id) => LOCATIONS.find((l) => l.id === id) || null;
export const locationName = (id) => locationById(id)?.name || 'Unknown place';