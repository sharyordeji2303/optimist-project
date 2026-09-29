/**
 * All page copy and content lives here.
 *
 * Keeping it in one module means the studio name, projects and navigation can be
 * rewritten without touching a single component. If the brief changes, this file
 * changes and nothing else does.
 */

export const studio = {
  name: 'Halden',
  full: 'Halden Studio',
  discipline: 'Architecture and Interiors',
  email: 'studio@halden.example',
  phone: '+44 20 7946 0318',
  address: 'Unit 4, Perch Wharf, London E2',
};

/**
 * Photographs.
 *
 * Paths point into `client/public/projects/`, which Vite serves from the site
 * root, so no import is needed and the same URL works in development and in a
 * build. Curated Unsplash photographs illustrate this fictional portfolio.
 * See PHOTO-CREDITS.md for sources and the original-image backup location.
 */
export const images = {
  hero: '/projects/hero-courtyard.jpg',
  statement: '/projects/statement-stair.jpg',
  authFacade: '/projects/auth-facade.jpg',
};

export const nav = [
  { label: 'Work', href: '#work' },
  { label: 'Practice', href: '#practice' },
  { label: 'Studio', href: '#studio' },
];

/** Six projects. Aspect ratios differ on purpose so the masonry grid breathes. */
export const projects = [
  {
    slug: 'perch-wharf',
    title: 'Perch Wharf',
    location: 'London',
    year: '2025',
    program: 'Adaptive reuse',
    aspect: 'aspect-[4/5]',
    image: '/projects/perch-wharf.jpg',
    imageAlt: 'Geometric brick facade with deep-set windows and a white roofline',
    note: 'A grain store returned to the river it was built beside.',
  },
  {
    slug: 'umunna-hall',
    title: 'Umunna Hall',
    location: 'Enugu',
    year: '2024',
    program: 'Civic',
    aspect: 'aspect-[3/2]',
    image: '/projects/umunna-hall.jpg',
    imageAlt: 'Open concrete courtyard with terraces, lawn and broad steps',
    note: 'A community hall that opens along its whole length.',
  },
  {
    slug: 'feddan-house',
    title: 'Feddan House',
    location: 'Cairo',
    year: '2024',
    program: 'Residential',
    aspect: 'aspect-[3/4]',
    image: '/projects/feddan-house.jpg',
    imageAlt: 'White contemporary home with timber details and courtyard planting',
    note: 'Shade, water and courtyard on a tight urban plot.',
  },
  {
    slug: 'kelvedon-archive',
    title: 'Kelvedon Archive',
    location: 'Essex',
    year: '2023',
    program: 'Cultural',
    aspect: 'aspect-[1/1]',
    image: '/projects/kelvedon-archive.jpg',
    imageAlt: 'Concrete columns framing a glazed entrance and gravel courtyard',
    note: 'Daylight-controlled storage folded into a public reading room.',
  },
  {
    slug: 'ten-bell-lane',
    title: 'Ten Bell Lane',
    location: 'Manchester',
    year: '2023',
    program: 'Interiors',
    aspect: 'aspect-[5/4]',
    image: '/projects/ten-bell-lane.jpg',
    imageAlt: 'Warm timber interior beneath a geometric daylight ceiling',
    note: 'A workspace built from what the previous tenant left behind.',
  },
  {
    slug: 'st-augustine-yard',
    title: 'St Augustine Yard',
    location: 'Bristol',
    year: '2022',
    program: 'Masterplan',
    aspect: 'aspect-[2/3]',
    image: '/projects/st-augustine-yard.jpg',
    imageAlt: 'Quiet cobblestone mews lined with brick houses and greenery',
    note: 'Nine buildings arranged around a car-free yard.',
  },
];

/** Capabilities. Five items, so they are set as a grouped list, not a card row. */
export const capabilities = [
  {
    title: 'Architecture',
    body: 'From feasibility to completion on site, with the drawings and responsibility that come with it.',
  },
  {
    title: 'Interiors',
    body: 'Joinery, lighting and material specification developed alongside the building, never after it.',
  },
  {
    title: 'Adaptive reuse',
    body: 'Existing structures measured, understood and kept wherever they can take the load.',
  },
  {
    title: 'Masterplanning',
    body: 'Site-wide strategy for housing, access and public space, tested against real budgets.',
  },
  {
    title: 'Research',
    body: 'Material studies and post-occupancy reviews that feed back into the next project.',
  },
];

/** The one marquee on the page. */
export const disciplines = [
  'Architecture',
  'Interiors',
  'Adaptive reuse',
  'Civic',
  'Masterplanning',
  'Restoration',
  'Material research',
];

export const statement = {
  line: 'A building should still make sense in fifty years, when everything around it has changed.',
  attribution: 'Ines Halden, founding partner',
};
