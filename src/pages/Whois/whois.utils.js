/**
 * whois.utils.js
 *
 * Utilities, RDAP event parsers, domain age/expiry calculators, and diagnostics for WHOIS / RDAP Lookups.
 */

export const WHOIS_PAGE_LIMIT = 10;
export const WHOIS_SCAN_TIMEOUT_MS = 25_000;
export const WHOIS_SOCKET_TIMEOUT_MS = 10_000;

const LABEL_RE = /^(?!-)[a-z0-9_-]{1,63}(?<!-)$/;

export function normalizeDomain(input) {
  if (!input || typeof input !== 'string') return '';
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/[/?#].*$/, '')
    .replace(/\.$/, '');
}

export function isValidDomain(input) {
  const cleaned = normalizeDomain(input);
  if (!cleaned || cleaned.length > 253) return false;
  if (!cleaned.includes('.')) return false;
  const parts = cleaned.split('.');
  return parts.every((label) => LABEL_RE.test(label));
}

export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `whois_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
  } catch {
    return String(iso);
  }
}

export function formatCleanDate(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      const match = String(iso).match(/^\d{4}-\d{2}-\d{2}/);
      return match ? match[0] : String(iso);
    }
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return String(iso);
  }
}

export function cleanStatusString(statusCode) {
  if (!statusCode) return '';
  // Strip URL parts (e.g. "clientDeleteProhibited https://icann.org/epp#clientDeleteProhibited" -> "clientDeleteProhibited")
  let s = String(statusCode).split(/\s+https?:\/\//i)[0].trim();
  s = s.replace(/https?:\/\/\S+/gi, '').trim();
  // Convert camelCase to space-separated words: "clientDeleteProhibited" -> "client delete prohibited"
  s = s.replace(/([a-z])([A-Z])/g, '$1 $2');
  return s.toLowerCase().trim();
}

export function cleanNameserverString(ns) {
  if (!ns) return '';
  const val = typeof ns === 'string' ? ns : ns.ldhName || ns.name || ns.host || String(ns);
  return val.trim().toLowerCase();
}

export function extractNameservers(result) {
  if (!result) return [];
  const raw = result.raw || result.result || result;

  const rawNs =
    result.nameservers ||
    raw.nameservers ||
    raw.nameServers ||
    raw.nameServer ||
    raw.nserver ||
    [];

  let list = [];
  if (Array.isArray(rawNs)) {
    list = rawNs.map(cleanNameserverString);
  } else if (typeof rawNs === 'string') {
    list = rawNs
      .split(/[\r\n,;\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }

  const unique = Array.from(new Set(list)).filter((ns) => ns && !ns.includes(' ') && ns.includes('.'));
  return unique;
}

export function extractStatusList(result) {
  if (!result) return [];
  const raw = result.raw || result.result || result;

  const rawStatus =
    result.statusList ||
    result.status ||
    raw.statusList ||
    raw.status ||
    raw.domainStatus ||
    raw.eppStatus ||
    [];

  let list = [];
  if (Array.isArray(rawStatus)) {
    list = rawStatus.map(cleanStatusString);
  } else if (typeof rawStatus === 'string') {
    list = rawStatus
      .split(/[\r\n,;]+/)
      .map(cleanStatusString)
      .filter(Boolean);
  }

  const unique = Array.from(new Set(list)).filter(Boolean);
  return unique;
}

export function relativeTime(iso) {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) return 'just now';

  const s = Math.floor(diffMs / 1000);
  if (s < 45) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function parseRdapEvents(events = [], rawData = null) {
  let evArray = Array.isArray(events) ? events : [];
  let sourceObj = null;

  if (events && !Array.isArray(events) && typeof events === 'object') {
    sourceObj = events;
    if (Array.isArray(events.events)) {
      evArray = events.events;
    }
  }

  if (rawData && typeof rawData === 'object') {
    sourceObj = { ...(sourceObj || {}), ...rawData };
    if (!evArray.length && Array.isArray(rawData.events)) {
      evArray = rawData.events;
    }
  }

  let registrationDate = null;
  let expirationDate = null;
  let lastChangedDate = null;
  let transferDate = null;

  for (const item of evArray) {
    if (!item) continue;
    const action = String(item.eventAction || item.action || '').toLowerCase();
    const date = item.eventDate || item.date;

    if (action.includes('registration') || action.includes('create')) {
      registrationDate = date;
    } else if (action.includes('expiration') || action.includes('expire')) {
      expirationDate = date;
    } else if (action.includes('last changed') || action.includes('last update') || action.includes('update') || action.includes('changed')) {
      lastChangedDate = date;
    } else if (action.includes('transfer')) {
      transferDate = date;
    }
  }

  // Fallbacks to standard flat WHOIS fields if not already found in events
  if (sourceObj) {
    if (!registrationDate) {
      registrationDate =
        sourceObj.registrationDate ||
        sourceObj.creationDate ||
        sourceObj.created ||
        sourceObj.createdDate ||
        sourceObj.registered ||
        sourceObj.registeredDate ||
        sourceObj.registryCreationDate ||
        null;
    }
    if (!expirationDate) {
      expirationDate =
        sourceObj.expirationDate ||
        sourceObj.registryExpiryDate ||
        sourceObj.expires ||
        sourceObj.expiryDate ||
        sourceObj.expiresDate ||
        sourceObj.expireDate ||
        null;
    }
    if (!lastChangedDate) {
      lastChangedDate =
        sourceObj.lastChangedDate ||
        sourceObj.updatedDate ||
        sourceObj.updated ||
        sourceObj.lastUpdate ||
        sourceObj.lastUpdated ||
        sourceObj.modifiedDate ||
        null;
    }
    if (!transferDate) {
      transferDate = sourceObj.transferDate || sourceObj.transferredDate || null;
    }
  }

  return {
    registrationDate,
    expirationDate,
    lastChangedDate,
    transferDate,
  };
}

export function calculateDaysRemaining(expirationDate) {
  if (!expirationDate) return null;
  const target = new Date(expirationDate).getTime();
  if (Number.isNaN(target)) return null;

  const now = Date.now();
  const diffMs = target - now;
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return days;
}

export function calculateDomainAge(registrationDate) {
  if (!registrationDate) return null;
  const created = new Date(registrationDate).getTime();
  if (Number.isNaN(created)) return null;

  const now = Date.now();
  const diffMs = now - created;
  if (diffMs < 0) return 'Recently registered';

  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const years = Math.floor(totalDays / 365);
  const remainingDays = totalDays % 365;
  const months = Math.floor(remainingDays / 30);

  if (years > 0) {
    return `${years} yr${years === 1 ? '' : 's'}${months > 0 ? ` ${months} mo` : ''}`;
  }
  if (months > 0) {
    return `${months} month${months === 1 ? '' : 's'}`;
  }
  return `${totalDays} day${totalDays === 1 ? '' : 's'}`;
}

export function analyzeWhoisSecurity({ events, nameservers, secureDNS }) {
  const diagnostics = [];
  const { registrationDate, expirationDate } = parseRdapEvents(events);

  // 1. Expiration Risk
  const daysRemaining = calculateDaysRemaining(expirationDate);
  if (daysRemaining != null) {
    if (daysRemaining < 0) {
      diagnostics.push({
        title: 'Domain Expired',
        status: 'fail',
        badge: 'Critical',
        desc: `Domain expired ${Math.abs(daysRemaining)} days ago. Services and routing may stop working at any time.`,
      });
    } else if (daysRemaining <= 30) {
      diagnostics.push({
        title: 'Expiring Soon (Under 30 Days)',
        status: 'fail',
        badge: 'Renew Immediately',
        desc: `Domain registration expires in only ${daysRemaining} days. Immediate renewal required to prevent service disruption.`,
      });
    } else if (daysRemaining <= 90) {
      diagnostics.push({
        title: 'Renewal Recommended (<90 Days)',
        status: 'warn',
        badge: 'Expiring Soon',
        desc: `Domain expires in ${daysRemaining} days. Plan renewal with your registrar to ensure continuous uptime.`,
      });
    } else {
      diagnostics.push({
        title: 'Registration Term Healthy',
        status: 'pass',
        badge: 'Active & Valid',
        desc: `Domain is securely registered for another ${daysRemaining} days (${Math.floor(daysRemaining / 365)} years).`,
      });
    }
  }

  // 2. Domain Age / Reputation
  const age = calculateDomainAge(registrationDate);
  if (registrationDate) {
    const createdTime = new Date(registrationDate).getTime();
    const ageDays = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);

    if (ageDays >= 365 * 2) {
      diagnostics.push({
        title: 'Established Domain Reputation',
        status: 'pass',
        badge: 'Established',
        desc: `Registered over ${age}. Long domain history positively impacts email deliverability and search authority.`,
      });
    } else {
      diagnostics.push({
        title: 'Young Domain (<2 Years)',
        status: 'warn',
        badge: 'Young Domain',
        desc: `Domain was created ${age} ago. Newly registered domains can undergo scrutiny by spam filters and anti-abuse systems.`,
      });
    }
  }

  // 3. Nameserver Redundancy
  const nsList = Array.isArray(nameservers) ? nameservers : [];
  if (nsList.length >= 2) {
    diagnostics.push({
      title: 'Authoritative Nameserver Redundancy',
      status: 'pass',
      badge: 'High Availability',
      desc: `${nsList.length} authoritative nameservers configured across redundant network clusters.`,
    });
  } else if (nsList.length === 1) {
    diagnostics.push({
      title: 'Single Nameserver Risk',
      status: 'warn',
      badge: 'No Redundancy',
      desc: 'Only 1 nameserver found. Lack of secondary nameservers creates a single point of failure.',
    });
  } else {
    diagnostics.push({
      title: 'No Nameservers Reported',
      status: 'warn',
      badge: 'Notice',
      desc: 'No nameservers found in RDAP response. Verify delegation in DNS zone.',
    });
  }

  // 4. DNSSEC Security
  const isSigned = Boolean(secureDNS?.delegationSigned);
  diagnostics.push({
    title: 'DNSSEC Cryptographic Validation',
    status: isSigned ? 'pass' : 'info',
    badge: isSigned ? 'DNSSEC Active' : 'Unsigned',
    desc: isSigned
      ? 'Delegation signed with DNSSEC. Protects against DNS cache poisoning and malicious spoofing.'
      : 'DNSSEC delegation is not signed. Consider enabling DNSSEC at your registrar for authenticated resolution.',
  });

  return diagnostics;
}

export const EPP_STATUS_INFO = Object.freeze({
  clienttransferprohibited: {
    label: 'Transfer Lock (Client)',
    desc: 'Domain cannot be transferred to another registrar without owner authorization.',
    level: 'safe',
  },
  servertransferprohibited: {
    label: 'Transfer Lock (Registry)',
    desc: 'The top-level registry forbids domain transfer requests.',
    level: 'safe',
  },
  clientupdateprohibited: {
    label: 'Update Lock (Client)',
    desc: 'Prevents unauthorized changes to nameservers, contacts, and DNS routing.',
    level: 'safe',
  },
  serverupdateprohibited: {
    label: 'Update Lock (Registry)',
    desc: 'Registry strictly prohibits changes to domain technical and contact records.',
    level: 'safe',
  },
  clientdeleteprohibited: {
    label: 'Deletion Protection (Client)',
    desc: 'Prevents accidental or malicious domain deletion.',
    level: 'safe',
  },
  serverdeleteprohibited: {
    label: 'Deletion Protection (Registry)',
    desc: 'Registry strictly prevents domain deletion from the registry.',
    level: 'safe',
  },
  clienthold: {
    label: 'Client Hold (Suspended)',
    desc: 'Domain is suspended by the registrar and will not resolve in DNS.',
    level: 'danger',
  },
  serverhold: {
    label: 'Server Hold (Suspended)',
    desc: 'Domain is suspended by the registry and removed from DNS root.',
    level: 'danger',
  },
  active: {
    label: 'Active & Operational',
    desc: 'Domain is active and resolving normally.',
    level: 'safe',
  },
  ok: {
    label: 'Normal Active',
    desc: 'Standard active state with no restrictions or pending actions.',
    level: 'safe',
  },
  pendingtransfer: {
    label: 'Pending Transfer',
    desc: 'A domain registrar transfer is currently underway.',
    level: 'warning',
  },
  pendingdelete: {
    label: 'Pending Deletion',
    desc: 'Domain has expired and is scheduled for permanent cancellation.',
    level: 'danger',
  },
  redemptionperiod: {
    label: 'Redemption Period',
    desc: 'Domain expired. Original owner can reclaim it within redemption window.',
    level: 'danger',
  },
  autorenewperiod: {
    label: 'Auto-Renew Grace Period',
    desc: 'Temporary grace period following expiration date.',
    level: 'warning',
  },
  renewperiod: {
    label: 'Renew Grace Period',
    desc: 'Domain was recently renewed by the registrar.',
    level: 'info',
  },
});

export function formatEppStatus(statusCode) {
  if (!statusCode) return { raw: '', label: 'Unknown', desc: 'No details available', level: 'info' };
  const rawStr = String(statusCode);
  const normalized = rawStr.toLowerCase().replace(/[\s_-]+/g, '');
  const found = EPP_STATUS_INFO[normalized];
  if (found) {
    return {
      raw: rawStr,
      label: found.label,
      desc: found.desc,
      level: found.level,
    };
  }

  // Capitalize camelCase or spaced words if not in dictionary
  const readable = rawStr
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return {
    raw: rawStr,
    label: readable,
    desc: 'Standard ICANN Registry status indicator.',
    level: 'info',
  };
}

export function formatAddress(address) {
  if (!address) return null;
  if (typeof address === 'string') {
    const trimmed = address.trim();
    if (!trimmed) return null;
    if (/redacted/i.test(trimmed)) {
      const countryMatch = trimmed.match(/([A-Z]{2})$/);
      const country = countryMatch ? ` (${countryMatch[1]})` : '';
      return `Redacted for Privacy${country}`;
    }
    return trimmed;
  }
  if (typeof address === 'object') {
    const parts = [
      address.street,
      address.locality,
      address.region,
      address.postalCode,
      address.country,
    ].filter(Boolean);
    if (!parts.length) return null;
    const joined = parts.join(', ');
    if (/redacted/i.test(joined)) {
      const country = address.country ? ` (${address.country})` : '';
      return `Redacted for Privacy${country}`;
    }
    return joined;
  }
  return null;
}

export function getRawAddress(address) {
  if (!address) return null;
  if (typeof address === 'string') return address.trim();
  if (typeof address === 'object') {
    const parts = [
      address.street,
      address.locality,
      address.region,
      address.postalCode,
      address.country,
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : JSON.stringify(address);
  }
  return String(address);
}

export function parseAddressString(addressStr) {
  if (!addressStr || typeof addressStr !== 'string') return null;
  const parts = addressStr.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 4) {
    return {
      street: parts.slice(0, parts.length - 4).join(', ') || parts[0],
      city: parts[parts.length - 4] || parts[1] || null,
      state: parts[parts.length - 3] || parts[2] || null,
      postalCode: parts[parts.length - 2] || parts[3] || null,
      country: parts[parts.length - 1] || parts[4] || null,
    };
  }
  return {
    street: addressStr,
    city: null,
    state: null,
    postalCode: null,
    country: null,
  };
}

export function parseVcardAddressComponents(rawValue) {
  if (!rawValue) return null;
  if (!Array.isArray(rawValue)) {
    if (typeof rawValue === 'object') {
      return {
        street: rawValue.street || rawValue.streetAddress || null,
        city: rawValue.city || rawValue.locality || null,
        state: rawValue.state || rawValue.region || null,
        postalCode: rawValue.postalCode || rawValue.postal_code || rawValue.zip || null,
        country: rawValue.country || rawValue.countryCode || null,
      };
    }
    if (typeof rawValue === 'string') {
      return parseAddressString(rawValue);
    }
    return null;
  }
  const [poBox, extended, street, locality, region, postalCode, country] = rawValue;
  return {
    poBox: poBox || null,
    extended: extended || null,
    street: street || null,
    city: locality || null,
    state: region || null,
    postalCode: postalCode || null,
    country: country || null,
  };
}

export function parseVcardAddress(rawValue) {
  if (!Array.isArray(rawValue)) return rawValue;
  const [poBox, extended, street, locality, region, postalCode, country] = rawValue;
  const parts = [poBox, extended, street, locality, region, postalCode, country].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
}

export function readVCardFields(vcardArray) {
  const fields = {
    name: null,
    organization: null,
    address: null,
    addressComponents: null,
    street: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
    phone: null,
    email: null,
  };
  if (!Array.isArray(vcardArray) || !Array.isArray(vcardArray[1])) return fields;
  for (const property of vcardArray[1]) {
    if (!Array.isArray(property) || property.length < 4) continue;
    const [propertyName, , , rawValue] = property;
    const value = Array.isArray(rawValue) ? rawValue.filter(Boolean).join(', ') : rawValue;
    if (typeof value !== 'string' || !value.trim()) continue;
    switch (propertyName) {
      case 'fn':
        fields.name = value;
        break;
      case 'org':
        fields.organization = value;
        break;
      case 'adr': {
        const comps = parseVcardAddressComponents(rawValue);
        fields.addressComponents = comps;
        fields.street = comps?.street || null;
        fields.city = comps?.city || null;
        fields.state = comps?.state || null;
        fields.postalCode = comps?.postalCode || null;
        fields.country = comps?.country || null;
        fields.address = Array.isArray(rawValue) ? parseVcardAddress(rawValue) : value;
        break;
      }
      case 'tel': {
        const cleanPhone = String(value).replace(/^tel:/i, '').trim();
        fields.phone = fields.phone || cleanPhone;
        break;
      }
      case 'email': {
        const cleanEmail = String(value).replace(/^mailto:/i, '').trim();
        fields.email = fields.email || cleanEmail;
        break;
      }
      default:
        break;
    }
  }
  return fields;
}

export const ROLE_INFO_MAP = Object.freeze({
  registrant: {
    key: 'registrant',
    label: 'Registrant (Domain Owner)',
    badge: 'Owner',
    desc: 'The official individual or organization holding registration rights to this domain name.',
    isPrimary: true,
    icon: '👑',
  },
  administrative: {
    key: 'administrative',
    label: 'Administrative Contact',
    badge: 'Admin',
    desc: 'Authorized party managing domain administration, legal notices, and official inquiries.',
    isPrimary: false,
    icon: '👤',
  },
  technical: {
    key: 'technical',
    label: 'Technical Administrator',
    badge: 'Tech',
    desc: 'Responsible for nameserver records, DNS zone routing, and server availability.',
    isPrimary: false,
    icon: '⚙️',
  },
  abuse: {
    key: 'abuse',
    label: 'Abuse & Security Hotline',
    badge: 'Abuse',
    desc: 'Designated point of contact for security reports, phishing, copyright, or malware.',
    isPrimary: false,
    icon: '🚨',
  },
  billing: {
    key: 'billing',
    label: 'Billing Contact',
    badge: 'Billing',
    desc: 'Handles renewal payments, subscription invoices, and accounting notices.',
    isPrimary: false,
    icon: '💳',
  },
  registrar: {
    key: 'registrar',
    label: 'Accredited Registrar',
    badge: 'Registrar',
    desc: 'ICANN-accredited registrar managing the registry delegation.',
    isPrimary: false,
    icon: '🏢',
  },
});

export function getRoleInfo(role) {
  if (!role) return { label: 'Contact Entity', badge: 'Entity', desc: 'Registered RDAP entity', isPrimary: false, icon: '👤' };
  const normalized = String(role).toLowerCase().trim();
  return (
    ROLE_INFO_MAP[normalized] || {
      key: normalized,
      label: normalized.replace(/\b\w/g, (c) => c.toUpperCase()),
      badge: normalized.toUpperCase(),
      desc: 'Authorized domain entity record.',
      isPrimary: false,
      icon: '👤',
    }
  );
}

export function normalizeEntityForUi(entity, index = 0) {
  if (!entity || typeof entity !== 'object') return null;

  const vcardFields = entity.vcardArray ? readVCardFields(entity.vcardArray) : {};

  const roles = Array.isArray(entity.roles) && entity.roles.length > 0
    ? entity.roles
    : entity.role
      ? [entity.role]
      : ['entity'];

  const name = entity.name || vcardFields.name || null;
  const organization = entity.organization || entity.org || vcardFields.organization || null;
  const rawAddr = entity.address || vcardFields.address || null;
  const address = getRawAddress(rawAddr);
  const formattedAddress = formatAddress(rawAddr);

  const comps = entity.addressComponents || vcardFields.addressComponents || parseAddressString(address);
  const street = entity.street || entity.streetAddress || vcardFields.street || comps?.street || null;
  const city = entity.city || entity.locality || vcardFields.city || comps?.city || null;
  const state = entity.state || entity.region || vcardFields.state || comps?.state || null;
  const postalCode = entity.postalCode || entity.postal_code || entity.zip || vcardFields.postalCode || comps?.postalCode || null;
  const country = entity.country || entity.countryCode || vcardFields.country || comps?.country || null;

  const rawPhone = entity.phone || vcardFields.phone || null;
  const phone = rawPhone ? String(rawPhone).replace(/^tel:/i, '').trim() : null;

  const rawEmail = entity.email || vcardFields.email || null;
  const contactUrl = extractEntityContactUrl(entity);
  const email = (rawEmail ? String(rawEmail).replace(/^mailto:/i, '').trim() : null) || contactUrl || null;

  const handle = entity.handle || null;
  const format = entity.format || (entity.vcardArray || entity.rawVcard ? 'jCard' : 'jCard');

  const rawEvents = Array.isArray(entity.events) ? entity.events : [];
  const events = rawEvents.map((ev) => ({
    eventAction: ev.eventAction || 'event',
    eventDate: ev.eventDate || null,
    formattedDate: formatDate(ev.eventDate),
  }));

  const isPrimary = roles.includes('registrant') || index === 0;
  const primaryRole = roles[0] || 'entity';
  const roleInfo = getRoleInfo(primaryRole);
  const redacted = isContactRedacted({ name, organization, email, address });

  return {
    id: handle || `entity_${index + 1}`,
    index: index + 1,
    handle,
    roles,
    primaryRole,
    roleInfo,
    isPrimary,
    name,
    organization,
    address,
    formattedAddress,
    street,
    city,
    state,
    postalCode,
    country,
    phone,
    email,
    contactUrl,
    format,
    events,
    isRedacted: redacted,
    raw: entity,
  };
}

export function extractNormalizedEntities(result) {
  if (!result) return [];
  const raw = result.raw || result.result || result;

  const list = [];
  const seenKeys = new Set();

  const addEntity = (item, defaultRole = null) => {
    if (!item || typeof item !== 'object') return;
    const entityObj = { ...item };
    if (defaultRole && (!entityObj.roles || !entityObj.roles.length)) {
      entityObj.roles = [defaultRole];
    }
    const key = entityObj.handle || `${entityObj.name || ''}_${(entityObj.roles || []).join('_')}_${entityObj.organization || ''}`;
    if (key && seenKeys.has(key)) return;
    if (key) seenKeys.add(key);
    list.push(entityObj);
  };

  // 1. Entities source
  const entitiesSource = Array.isArray(result.entities) && result.entities.length > 0
    ? result.entities
    : Array.isArray(raw.entities)
      ? raw.entities
      : [];

  for (const ent of entitiesSource) {
    addEntity(ent);
  }

  // 2. Contacts source
  const contacts = result.contacts || raw.contacts;
  if (contacts && typeof contacts === 'object') {
    if (contacts.registrant) addEntity(contacts.registrant, 'registrant');
    if (contacts.administrative) addEntity(contacts.administrative, 'administrative');
    if (contacts.technical) addEntity(contacts.technical, 'technical');
    if (contacts.abuse) addEntity(contacts.abuse, 'abuse');
    if (contacts.billing) addEntity(contacts.billing, 'billing');
  }

  return list
    .map((ent, idx) => normalizeEntityForUi(ent, idx))
    .filter(Boolean);
}

export function extractEntityContactUrl(entity) {
  if (!entity) return null;
  if (entity.contactUrl) return entity.contactUrl;
  if (Array.isArray(entity.links)) {
    const contactLink = entity.links.find(
      (l) => l?.href && (l.rel === 'contact' || String(l.href).includes('contact') || String(l.href).includes('whois'))
    );
    if (contactLink?.href) return contactLink.href;
    const webLink = entity.links.find((l) => l?.href && (l.rel === 'related' || l.type === 'text/html'));
    if (webLink?.href) return webLink.href;
    if (entity.links[0]?.href) return entity.links[0].href;
  }
  return null;
}

export function isContactRedacted(contact) {
  if (!contact) return true;
  const str = `${contact.name || ''} ${contact.organization || ''} ${contact.email || ''} ${contact.address || ''}`.toLowerCase();
  return (
    !contact.name ||
    str.includes('redact') ||
    str.includes('privacy') ||
    str.includes('whoisguard') ||
    str.includes('withheld') ||
    str.includes('proxy') ||
    str.includes('gdpr') ||
    str.includes('contact privacy')
  );
}

export function exportWhoisReport(report) {
  if (!report) return;
  const fileName = `whois-${report.domain || 'lookup'}-${new Date().toISOString().slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function extractRegistrarInfo(result) {
  if (!result) return null;
  const raw = result.raw || result.result || result;
  const r = raw.registrar || result.registrar || raw.sponsoringRegistrar || {};
  const isStringR = typeof r === 'string' && r.trim();

  const entities = Array.isArray(raw.entities) ? raw.entities : Array.isArray(result.entities) ? result.entities : [];
  const registrarEntity = entities.find((e) =>
    Array.isArray(e.roles) && e.roles.map((s) => String(s).toLowerCase()).includes('registrar')
  );

  const regVcard = registrarEntity?.vcardArray ? readVCardFields(registrarEntity.vcardArray) : {};

  let ianaId =
    (!isStringR && (r.ianaId || r.publicId)) ||
    raw.registrarIanaId ||
    raw.ianaId ||
    raw.sponsoringRegistrarIanaId ||
    raw.registrarId ||
    null;

  if (!ianaId && (registrarEntity?.publicIds || (!isStringR && r.publicIds))) {
    const pids = registrarEntity?.publicIds || r.publicIds;
    const found = pids?.find((p) => String(p.type || '').toLowerCase().includes('iana') || p.identifier);
    if (found) ianaId = found.identifier;
  }

  // Handle case where handle is an IANA number (e.g. "146")
  if (!ianaId && !isStringR && r.handle && /^\d+$/.test(String(r.handle).trim())) {
    ianaId = String(r.handle).trim();
  }

  const name = isStringR
    ? r.trim()
    : r.name ||
      r.organization ||
      regVcard.name ||
      regVcard.organization ||
      registrarEntity?.handle ||
      raw.registrarName ||
      raw.sponsoringRegistrar ||
      (typeof raw.registrar === 'string' ? raw.registrar : null) ||
      null;

  const email = (!isStringR && r.email) || raw.registrarEmail || regVcard.email || null;
  const phone = (!isStringR && r.phone) || raw.registrarPhone || regVcard.phone || null;

  const whoisServer =
    (!isStringR && r.whoisServer) ||
    raw.registrarWhoisServer ||
    raw.whoisServer ||
    raw.registrarServer ||
    (!isStringR && Array.isArray(r.links) && r.links.find((l) => l.value && String(l.value).includes('rdap'))?.value) ||
    (!isStringR && Array.isArray(r.links) && r.links[0]?.value) ||
    null;

  const url =
    (!isStringR && r.url) ||
    raw.registrarUrl ||
    raw.url ||
    raw.referralUrl ||
    raw.registrarReferralUrl ||
    (!isStringR && r.contactUrl) ||
    (!isStringR && Array.isArray(r.links) && r.links.find((l) => l.href && (l.rel === 'about' || l.rel === 'related'))?.href) ||
    (!isStringR && Array.isArray(r.links) && r.links[0]?.href) ||
    null;

  const handle = (!isStringR && r.handle) || registrarEntity?.handle || null;

  return {
    name,
    ianaId,
    email,
    phone,
    whoisServer,
    url,
    handle,
  };
}

export function extractAbuseInfo(result) {
  if (!result) return null;
  const raw = result.raw || result.result || result;

  const abuseSource =
    result.abuse ||
    raw.abuse ||
    result.contacts?.abuse ||
    raw.contacts?.abuse ||
    null;

  const entities = Array.isArray(raw.entities) ? raw.entities : Array.isArray(result.entities) ? result.entities : [];
  const abuseEntity = entities.find((e) =>
    Array.isArray(e.roles) && e.roles.map((s) => String(s).toLowerCase()).includes('abuse')
  );
  const abuseVcard = abuseEntity?.vcardArray ? readVCardFields(abuseEntity.vcardArray) : {};

  const registrar = typeof raw.registrar === 'object' ? raw.registrar : typeof result.registrar === 'object' ? result.registrar : {};

  let email =
    abuseSource?.email ||
    abuseVcard.email ||
    abuseEntity?.email ||
    raw.abuseEmail ||
    raw.registrarAbuseEmail ||
    raw.registrarAbuseContactEmail ||
    raw.abuseContactEmail ||
    registrar?.abuseEmail ||
    registrar?.abuseContactEmail ||
    null;

  if (email && typeof email === 'string') {
    email = email.replace(/^mailto:/i, '').trim();
  }

  let phone =
    abuseSource?.phone ||
    abuseVcard.phone ||
    abuseEntity?.phone ||
    raw.abusePhone ||
    raw.registrarAbusePhone ||
    raw.registrarAbuseContactPhone ||
    raw.abuseContactPhone ||
    registrar?.abusePhone ||
    registrar?.abuseContactPhone ||
    null;

  if (phone && typeof phone === 'string') {
    phone = phone.replace(/^tel:/i, '').trim();
  }

  const name = abuseSource?.name || abuseVcard.name || abuseEntity?.name || null;
  const organization = abuseSource?.organization || abuseVcard.organization || abuseEntity?.organization || null;
  const handle = abuseSource?.handle || abuseEntity?.handle || null;
  const contactUrl =
    abuseSource?.contactUrl ||
    extractEntityContactUrl(abuseSource) ||
    extractEntityContactUrl(abuseEntity) ||
    null;

  if (!email && !phone && !name && !organization && !contactUrl) {
    return null;
  }

  return {
    email,
    phone,
    name,
    organization,
    handle,
    contactUrl,
  };
}

export function extractNotices(result) {
  if (!result) return [];
  const raw = result.raw || result.result || result;
  const list = Array.isArray(result.notices)
    ? result.notices
    : Array.isArray(raw.notices)
      ? raw.notices
      : [];

  return list
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const title = item.title || 'Notice';
      const descList = Array.isArray(item.description)
        ? item.description.filter(Boolean)
        : typeof item.description === 'string'
          ? [item.description]
          : [];
      const description = descList.join(' ').trim();
      const links = Array.isArray(item.links)
        ? item.links
            .map((link) => {
              if (!link || typeof link !== 'object') return null;
              return {
                href: link.href || link.value || null,
                rel: link.rel || 'help',
                type: link.type || 'text/html',
              };
            })
            .filter((l) => l && l.href)
        : [];

      return {
        title,
        description,
        links,
      };
    })
    .filter(Boolean);
}

export function extractStructuredContacts(result) {
  if (!result) return { registrant: null, technical: null, administrative: null, billing: null };
  const raw = result.raw || result.result || result;
  const entities = extractNormalizedEntities(result);

  const findByRole = (roleKeyword) => {
    return entities.find((e) => {
      const roles = Array.isArray(e.roles) ? e.roles.map((r) => String(r).toLowerCase()) : [];
      return roles.some((r) => r.includes(roleKeyword));
    });
  };

  let registrant = findByRole('registrant');
  let technical = findByRole('tech');
  let administrative = findByRole('admin');
  let billing = findByRole('bill');

  const c = result.contacts || raw.contacts;
  if (c && typeof c === 'object') {
    if (!registrant && c.registrant) registrant = normalizeEntityForUi(c.registrant, 0);
    if (!technical && c.technical) technical = normalizeEntityForUi(c.technical, 1);
    if (!administrative && c.administrative) administrative = normalizeEntityForUi(c.administrative, 2);
    if (!billing && c.billing) billing = normalizeEntityForUi(c.billing, 3);
  }

  // Fallbacks to flat properties found in many WHOIS JSON schemas
  if (
    !registrant &&
    (raw.registrantName ||
      raw.registrantOrganization ||
      raw.registrantCountry ||
      raw.registrantEmail ||
      raw.registrant ||
      raw.registrant_name)
  ) {
    registrant = normalizeEntityForUi(
      {
        name: raw.registrantName || raw.registrant_name || (typeof raw.registrant === 'string' ? raw.registrant : null),
        organization: raw.registrantOrganization || raw.registrant_organization || raw.registrantOrg || null,
        street: raw.registrantStreet || raw.registrant_street || raw.registrantAddress || null,
        city: raw.registrantCity || raw.registrant_city || null,
        state: raw.registrantState || raw.registrant_state || raw.registrantProvince || null,
        postalCode: raw.registrantPostalCode || raw.registrant_postal_code || raw.registrantZip || null,
        country: raw.registrantCountry || raw.registrant_country || null,
        phone: raw.registrantPhone || raw.registrant_phone || null,
        email: raw.registrantEmail || raw.registrant_email || null,
        roles: ['registrant'],
      },
      0,
    );
  }

  if (
    !administrative &&
    (raw.adminName ||
      raw.adminOrganization ||
      raw.adminCountry ||
      raw.adminEmail ||
      raw.admin_name)
  ) {
    administrative = normalizeEntityForUi(
      {
        name: raw.adminName || raw.admin_name || null,
        organization: raw.adminOrganization || raw.admin_organization || null,
        street: raw.adminStreet || raw.admin_street || null,
        city: raw.adminCity || raw.admin_city || null,
        state: raw.adminState || raw.admin_state || null,
        postalCode: raw.adminPostalCode || raw.admin_postal_code || null,
        country: raw.adminCountry || raw.admin_country || null,
        phone: raw.adminPhone || raw.admin_phone || null,
        email: raw.adminEmail || raw.admin_email || null,
        roles: ['administrative'],
      },
      1,
    );
  }

  if (
    !technical &&
    (raw.techName ||
      raw.techOrganization ||
      raw.techCountry ||
      raw.techEmail ||
      raw.tech_name)
  ) {
    technical = normalizeEntityForUi(
      {
        name: raw.techName || raw.tech_name || null,
        organization: raw.techOrganization || raw.tech_organization || null,
        street: raw.techStreet || raw.tech_street || null,
        city: raw.techCity || raw.tech_city || null,
        state: raw.techState || raw.tech_state || null,
        postalCode: raw.techPostalCode || raw.tech_postal_code || null,
        country: raw.techCountry || raw.tech_country || null,
        phone: raw.techPhone || raw.tech_phone || null,
        email: raw.techEmail || raw.tech_email || null,
        roles: ['technical'],
      },
      2,
    );
  }

  // Fallbacks:
  if (!registrant && entities.length > 0) {
    registrant = entities[0];
  }
  if (!technical) {
    if (entities.length > 1) {
      technical = entities[1];
    } else if (registrant) {
      technical = registrant;
    }
  }

  return { registrant, technical, administrative, billing };
}

export function generateRawWhoisText(result) {
  if (!result) return '';
  const raw = result.raw || result.result || result;

  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (raw.rawWhois && typeof raw.rawWhois === 'string') return raw.rawWhois.trim();
  if (raw.rawText && typeof raw.rawText === 'string') return raw.rawText.trim();
  if (raw.whoisRecord && typeof raw.whoisRecord === 'string') return raw.whoisRecord.trim();
  if (raw.rawRecord && typeof raw.rawRecord === 'string') return raw.rawRecord.trim();
  if (result.rawWhois && typeof result.rawWhois === 'string') return result.rawWhois.trim();
  if (result.rawText && typeof result.rawText === 'string') return result.rawText.trim();

  const domain = (result.domain || raw.domain || raw.domainName || raw.ldhName || '').toUpperCase();
  const events = parseRdapEvents(result.events || raw.events, raw);
  const registrar = extractRegistrarInfo(result);
  const abuse = extractAbuseInfo(result);
  const contacts = extractStructuredContacts(result);
  const statuses = extractStatusList(result);
  const nameservers = extractNameservers(result);
  const secureDNS = result.secureDNS || raw.secureDNS;
  const isSigned = Boolean(secureDNS?.delegationSigned);

  const lines = [];
  lines.push(`Domain Name: ${domain}`);
  if (raw.handle || raw.registryDomainId) lines.push(`Registry Domain ID: ${raw.handle || raw.registryDomainId}`);
  if (registrar?.whoisServer) lines.push(`Registrar WHOIS Server: ${registrar.whoisServer}`);
  if (registrar?.url) lines.push(`Registrar URL: ${registrar.url}`);
  if (events.lastChangedDate) lines.push(`Updated Date: ${events.lastChangedDate}`);
  if (events.registrationDate) lines.push(`Creation Date: ${events.registrationDate}`);
  if (events.expirationDate) lines.push(`Registry Expiry Date: ${events.expirationDate}`);
  if (registrar?.name) lines.push(`Registrar: ${registrar.name}`);
  if (registrar?.ianaId) lines.push(`Registrar IANA ID: ${registrar.ianaId}`);
  const abuseEmail = abuse?.email || registrar?.abuseEmail;
  const abusePhone = abuse?.phone || registrar?.abusePhone;
  if (abuseEmail) lines.push(`Registrar Abuse Contact Email: ${abuseEmail}`);
  if (abusePhone) lines.push(`Registrar Abuse Contact Phone: ${abusePhone}`);

  statuses.forEach((st) => {
    const rawSt = String(st).split(/\s+/)[0].replace(/https?:\/\/\S+/g, '');
    lines.push(`Domain Status: ${rawSt} https://icann.org/epp#${rawSt}`);
  });

  if (contacts.registrant && !contacts.registrant.isRedacted) {
    const reg = contacts.registrant;
    if (reg.name) lines.push(`Registrant Name: ${reg.name}`);
    if (reg.organization) lines.push(`Registrant Organization: ${reg.organization}`);
    if (reg.street) lines.push(`Registrant Street: ${reg.street}`);
    if (reg.city) lines.push(`Registrant City: ${reg.city}`);
    if (reg.state) lines.push(`Registrant State/Province: ${reg.state}`);
    if (reg.postalCode) lines.push(`Registrant Postal Code: ${reg.postalCode}`);
    if (reg.country) lines.push(`Registrant Country: ${reg.country}`);
    if (reg.phone) lines.push(`Registrant Phone: ${reg.phone}`);
    if (reg.email) lines.push(`Registrant Email: ${reg.email}`);
  }

  if (contacts.technical && !contacts.technical.isRedacted) {
    const tech = contacts.technical;
    if (tech.name) lines.push(`Tech Name: ${tech.name}`);
    if (tech.organization) lines.push(`Tech Organization: ${tech.organization}`);
    if (tech.street) lines.push(`Tech Street: ${tech.street}`);
    if (tech.city) lines.push(`Tech City: ${tech.city}`);
    if (tech.state) lines.push(`Tech State/Province: ${tech.state}`);
    if (tech.postalCode) lines.push(`Tech Postal Code: ${tech.postalCode}`);
    if (tech.country) lines.push(`Tech Country: ${tech.country}`);
    if (tech.phone) lines.push(`Tech Phone: ${tech.phone}`);
    if (tech.email) lines.push(`Tech Email: ${tech.email}`);
  }

  nameservers.forEach((ns) => {
    const nsName = (typeof ns === 'string' ? ns : ns.ldhName || ns.name || String(ns)).toUpperCase();
    lines.push(`Name Server: ${nsName}`);
  });

  lines.push(`DNSSEC: ${isSigned ? 'signedDelegation' : 'unsigned'}`);
  lines.push(`URL of the ICANN Whois Inaccuracy Complaint Form: https://www.icann.org/wicf/`);
  lines.push(`>>> Last update of whois database: ${new Date(result.lookedUpAt || Date.now()).toISOString()} <<<`);

  return lines.join('\n');
}

/**
 * Standardize MongoDB record, socket response, or raw RDAP result into a unified UI report object.
 * @param {object} entry - Raw document or socket payload
 * @returns {object|null}
 */
export function normalizeWhoisEntry(entry) {
  if (!entry) return null;
  const raw = entry.result || entry;
  const id = entry._id ? String(entry._id) : entry.id || entry.jobId || createId();
  const dbId = entry._id ? String(entry._id) : entry.whoisDbId ? String(entry.whoisDbId) : null;

  const domain = (raw.domain || entry.url || entry.domain || raw.domainName || raw.ldhName || '').toUpperCase();
  const unicodeDomain = raw.unicodeDomain || raw.unicodeName || null;
  const events = Array.isArray(raw.events) ? raw.events : [];
  const parsedEvents = parseRdapEvents(events, raw);
  const nameservers = extractNameservers({ raw, result: raw });
  const secureDNS = raw.secureDNS || null;
  const registrar = raw.registrar || null;
  const abuse = raw.abuse || entry.abuse || raw.contacts?.abuse || null;
  const contacts = raw.contacts || entry.contacts || {};
  const entities = Array.isArray(raw.entities)
    ? raw.entities
    : Array.isArray(entry.entities)
      ? entry.entities
      : [];
  const status = extractStatusList({ raw, result: raw });
  const notices = Array.isArray(raw.notices) ? raw.notices : [];

  const lookedUpAt =
    entry.completedAt || entry.createdAt || raw.lookedUpAt || new Date().toISOString();
  const jobStatus = entry.status || raw.status || 'completed';
  const error = entry.error || raw.error?.message || raw.error || null;

  const rawWhois =
    entry.rawWhois ||
    entry.rawText ||
    raw.rawWhois ||
    raw.rawText ||
    raw.whoisRecord ||
    raw.rawRecord ||
    (typeof raw === 'string' ? raw : null);

  return {
    id,
    dbId,
    domain,
    unicodeDomain,
    url: entry.url || domain,
    events,
    parsedEvents,
    nameservers,
    secureDNS,
    registrar,
    abuse,
    contacts,
    entities,
    status,
    notices,
    lookedUpAt,
    jobStatus,
    statusList: status,
    error,
    success: jobStatus === 'completed' && !error,
    rawWhois,
    raw,
  };
}
