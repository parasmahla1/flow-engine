const storageKey = "flowengine.authToken";

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(storageKey);
};

export const setAuthToken = (token: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(storageKey, token);
};

export const clearAuthToken = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(storageKey);
};
