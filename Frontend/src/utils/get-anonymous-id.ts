import { ulid } from 'ulid';

export interface AnonymousIdResult {
  anonId: string;
  isNewUser: boolean;
}

// Usage in your ID generation:
const getSystemFingerprint = (): string => {
  const nav = navigator;
  const components = [
    nav.userAgent.substring(0, 20), // First 20 chars of UA
    nav.language,
    nav.hardwareConcurrency || '0',
    screen.width,
    screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone.substring(0, 3)
  ].join('');
  
  return simpleHash(components).substring(0, 9);
}

const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

const generateRandomHex = (bytes: number): string => {
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
}


const generateId = (prefix: string): string => {
  const random = generateRandomHex(6);
  const systemId = getSystemFingerprint();
  const ulId = ulid();
  const timeStamp = Date.now().toString(36);
  

  const components = [
    prefix,
    random,
    systemId,
    ulId,
    timeStamp,
    Math.random().toString(36).substring(0, 6)
  ];
  return components.join('_');
}

export const getAnonymousId = (): AnonymousIdResult => {
  let isNewUser = false;
  let anonId = localStorage.getItem('anonId');
  if (!anonId) {
    anonId = generateId('anonId'); // Collision Risk - Extremely Low + Time-ordered, usefull for Production apps
    localStorage.setItem('anonId', anonId);
    isNewUser = true;
    console.log('✅ Created NEW anonymous ID:', anonId);
  } else {
    console.log('✅ Found EXISTING anonymous ID:', anonId);
  }
  return { anonId, isNewUser};
}
