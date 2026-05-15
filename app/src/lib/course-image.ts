/**
 * Subject → Unsplash placeholder image mapping.
 * Used when classroom records don't have a stored image (which is always,
 * in the current backend). Provides visually-rich, topical course covers.
 */
const SUBJECT_IMAGES: Record<string, string> = {
  mathematics: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80&auto=format&fit=crop',
  math: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80&auto=format&fit=crop',
  calculus: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&q=80&auto=format&fit=crop',
  physics: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=600&q=80&auto=format&fit=crop',
  chemistry: 'https://images.unsplash.com/photo-1554475901-4538ddfbccc2?w=600&q=80&auto=format&fit=crop',
  biology: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&q=80&auto=format&fit=crop',
  'computer science': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80&auto=format&fit=crop',
  cs: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80&auto=format&fit=crop',
  programming: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&q=80&auto=format&fit=crop',
  literature: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&q=80&auto=format&fit=crop',
  english: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&q=80&auto=format&fit=crop',
  history: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=600&q=80&auto=format&fit=crop',
  economics: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80&auto=format&fit=crop',
  business: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80&auto=format&fit=crop',
  engineering: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600&q=80&auto=format&fit=crop',
  art: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&q=80&auto=format&fit=crop',
  music: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80&auto=format&fit=crop',
};

const FALLBACK = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80&auto=format&fit=crop';

export function getCourseImage(subject?: string | null, name?: string | null): string {
  const lookup = ((subject ?? '') + ' ' + (name ?? '')).toLowerCase();
  for (const key of Object.keys(SUBJECT_IMAGES)) {
    if (lookup.includes(key)) return SUBJECT_IMAGES[key];
  }
  return FALLBACK;
}
