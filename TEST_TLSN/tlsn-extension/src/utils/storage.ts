import { LOGGING_LEVEL_INFO } from './constants';

export const NOTARY_API_LS_KEY = 'notary-api';
export const PROXY_API_LS_KEY = 'proxy-api';
export const MAX_SENT_LS_KEY = 'max-sent';
export const MAX_RECEIVED_LS_KEY = 'max-received';
export const LOGGING_FILTER_KEY = 'logging-filter';
export const URL_PATTERNS_LS_KEY = 'url-patterns';
export const TOGGLE_STATE_LS_KEY = 'toggle-state';

export async function set(key: string, value: string) {
  return chrome.storage.sync.set({ [key]: value });
}

export async function get(key: string, defaultValue?: string) {
  return chrome.storage.sync
    .get(key)
    .then((json: any) => json[key] || defaultValue)
    .catch(() => '');
}

export async function setList(key: string, list: any[]) {
  return set(key, JSON.stringify(list));
}

export async function getList(key: string, defaultValue: any[] = []) {
  return get(key).then((value) => {
    try {
      return value ? JSON.parse(value) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  });
}

export async function getMaxSent() {
  return parseInt(await get(MAX_SENT_LS_KEY, '4096'));
}

export async function getMaxRecv() {
  return parseInt(await get(MAX_RECEIVED_LS_KEY, '16384'));
}

export async function getNotaryApi() {
  return await get(NOTARY_API_LS_KEY, 'http://0.0.0.0:7047');
}

export async function getProxyApi() {
  return await get(PROXY_API_LS_KEY, 'wss://notary.pse.dev/proxy');
}

export async function getLoggingFilter() {
  return await get(LOGGING_FILTER_KEY, LOGGING_LEVEL_INFO);
}
