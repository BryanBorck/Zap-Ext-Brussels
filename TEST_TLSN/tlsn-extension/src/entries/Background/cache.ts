import NodeCache from 'node-cache';

let RequestsLogs: {
  [tabId: string]: NodeCache;
} = {};

// Single global cache instance
let globalRequestLogCache: NodeCache | null = null;

// Function to get the global cache instance
export const getGlobalCache = (): NodeCache => {
  if (!globalRequestLogCache) {
    globalRequestLogCache = new NodeCache({
      stdTTL: 60 * 5, // default 5m TTL
      maxKeys: 1000000,
    });
  }
  return globalRequestLogCache;
};

export const deleteCacheByTabId = (tabId: number) => {
  delete RequestsLogs[tabId];
};

export const getCacheByTabId = (tabId: number): NodeCache => {
  RequestsLogs[tabId] =
    RequestsLogs[tabId] ||
    new NodeCache({
      stdTTL: 60 * 5, // default 5m TTL
      maxKeys: 1000000,
    });

  return RequestsLogs[tabId];
};

export const clearRequestCache = () => {
  RequestsLogs = {};
};

export const clearCache = () => {
  clearRequestCache();
};

export const clearRequestGlobalCache = () => {
  globalRequestLogCache = null;
};

export const clearGlobalCache = () => {
  clearRequestGlobalCache();
};
