/**
 * Official Saheb Paper Pvt. Ltd. Verified Company Configuration
 * Source of truth for all screens, exports, PDF generators, printables, headers & footers.
 * Supports dynamic client-side editing via Admin Masters panel.
 */

export interface CompanyConfig {
  name: string;
  legalName: string;
  shortName: string;
  tagline: string;
  industrySubtitle: string;
  address: string;
  shortAddress: string;
  plantLocation: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  websiteUrl: string;
  gstin?: string;
  headerContactLine: string;
  footerLine: string;
}

export const DEFAULT_COMPANY_CONFIG: CompanyConfig = {
  name: 'SAHEB PAPER PVT. LTD.',
  legalName: 'SAHEB PAPER PRIVATE LIMITED',
  shortName: 'Saheb Paper',
  tagline: '',
  industrySubtitle: 'FINISHED STOCK MANAGEMENT • TISSUE PAPER MILL',
  
  // Official physical address
  address: 'Survey No. 241/7, Chandisar, Palanpur, Gujarat, India - 385510',
  shortAddress: 'Chandisar, Palanpur, Gujarat - 385510',
  plantLocation: 'Plant: Survey No. 241/7, Chandisar, Palanpur, Gujarat - 385510',

  // Contact Info
  phone: '+91 80005 63666',
  whatsapp: '+91 80005 63666',
  email: 'sahebpaper@gmail.com',
  website: 'www.sahebpaper.com',
  websiteUrl: 'https://www.sahebpaper.com',
  gstin: '24AABCS1234F1Z5',

  // Formatted one-line headers & footers
  headerContactLine: 'Survey No. 241/7, Chandisar, Palanpur, Gujarat - 385510 | Ph: +91 80005 63666 | sahebpaper@gmail.com | www.sahebpaper.com',
  footerLine: 'SAHEB PAPER PVT. LTD. • Survey No. 241/7, Chandisar, Palanpur, Gujarat - 385510 • Ph: +91 80005 63666 • www.sahebpaper.com',
};

const STORAGE_KEY = 'saheb_company_config';

/**
 * Get current configured company settings with fallback to default
 */
export function getCompanyConfig(): CompanyConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COMPANY_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_COMPANY_CONFIG,
      ...parsed,
      // Re-generate header and footer lines if address or contact changes
      headerContactLine: parsed.headerContactLine || `${parsed.address || DEFAULT_COMPANY_CONFIG.address} | Ph: ${parsed.phone || DEFAULT_COMPANY_CONFIG.phone} | ${parsed.email || DEFAULT_COMPANY_CONFIG.email} | ${parsed.website || DEFAULT_COMPANY_CONFIG.website}`,
      footerLine: parsed.footerLine || `${parsed.name || DEFAULT_COMPANY_CONFIG.name} • ${parsed.shortAddress || DEFAULT_COMPANY_CONFIG.shortAddress} • Ph: ${parsed.phone || DEFAULT_COMPANY_CONFIG.phone} • ${parsed.website || DEFAULT_COMPANY_CONFIG.website}`,
    };
  } catch (err) {
    console.warn('[CompanyConfig] Failed to load custom config, using default:', err);
    return DEFAULT_COMPANY_CONFIG;
  }
}

/**
 * Save updated company configuration
 */
export function saveCompanyConfig(updated: Partial<CompanyConfig>): CompanyConfig {
  try {
    const current = getCompanyConfig();
    const merged: CompanyConfig = {
      ...current,
      ...updated,
    };
    
    // Auto-update header and footer lines
    merged.headerContactLine = `${merged.address} | Ph: ${merged.phone} | ${merged.email} | ${merged.website}`;
    merged.footerLine = `${merged.name} • ${merged.shortAddress || merged.address.split(',')[0]} • Ph: ${merged.phone} • ${merged.website}`;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (err) {
    console.error('[CompanyConfig] Failed to save company config:', err);
    return DEFAULT_COMPANY_CONFIG;
  }
}

/**
 * Reset company config back to official defaults
 */
export function resetCompanyConfig(): CompanyConfig {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_COMPANY_CONFIG;
}

// Export dynamic COMPANY_CONFIG
export const COMPANY_CONFIG: CompanyConfig = typeof window !== 'undefined' ? getCompanyConfig() : DEFAULT_COMPANY_CONFIG;

export default COMPANY_CONFIG;
