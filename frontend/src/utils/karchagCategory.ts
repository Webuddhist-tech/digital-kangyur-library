/**
 * Returns true when a Karchag main category should use content-only
 * subcategory behavior (no text list), matching Tantra and Scholarly Work.
 */
export function isContentOnlyCategory(nameEnglish?: string | null): boolean {
  const name = nameEnglish?.trim().toLowerCase();
  return name === 'tantra' || name === 'scholarly work';
}
