export function buildSearchQuery(search) {
  const roles = search.roles.map((r) => `"${r}"`).join(' OR ');
  const stack = search.stack
    .map((t) => (t.includes(' ') || t.includes('#') || t.startsWith('.') ? `"${t}"` : t))
    .join(' OR ');
  const keywords = search.keywords.map((k) => `"${k}"`).join(' OR ');
  const location = search.remoteOnly ? 'remoto' : 'Italia';
  return `(${roles}) (${stack}) ${location} (${keywords})`;
}

export function buildScoutQuery(scout) {
  const types = scout.companyTypes.map((t) => `"${t}"`).join(' OR ');
  const modes = scout.workMode.map((m) => `"${m}"`).join(' OR ');
  const contracts = scout.contract.map((c) => `"${c}"`).join(' OR ');
  return `(${types}) ${scout.location} (${modes}) (${contracts})`;
}
