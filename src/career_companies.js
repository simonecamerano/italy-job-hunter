import { getUserConfig } from './config.js';

export async function getCareerDomains() {
  const url = process.env.COMPANIES_LIST_URL?.trim();
  if (!url) {
    console.warn('⚠️  COMPANIES_LIST_URL not set — skipping curated company search.');
    return [];
  }

  let companies;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    companies = await res.json();
  } catch (err) {
    console.error('❌ Failed to fetch curated companies list:', err.message);
    return [];
  }

  const config = getUserConfig();
  if (!config) return extractDomains(companies);

  const userStack = (config.search?.stack ?? []).map((s) => s.toLowerCase());
  const userCompanyTypes = (config.scout?.companyTypes ?? []).map((t) => t.toLowerCase());
  const remoteOnly = config.search?.remoteOnly ?? true;
  const wantsConsulting = userCompanyTypes.some((t) => t.includes('consult'));

  const filtered = companies.filter((company) => {
    if (!wantsConsulting && company.type === 'Consulting') return false;

    if (remoteOnly) {
      if (company.remote_policy !== 'Full') return false;
    }

    if (userStack.length > 0) {
      const tags = (company.tags ?? []).map((t) => t.toLowerCase());
      const hasMatch = userStack.some((tech) =>
        tags.some((tag) => tag.includes(tech) || tech.includes(tag)),
      );
      if (!hasMatch) return false;
    }

    return true;
  });

  console.log(
    `📋 Curated list: ${filtered.length}/${companies.length} companies match your filters.`,
  );
  return extractDomains(filtered);
}

function extractDomains(companies) {
  return companies
    .map((c) => {
      try {
        return new URL(c.career_page_url).hostname;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}
