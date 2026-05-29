export type KeyraSessionUser = {
  phoneE164: string;
  displayName?: string;
  email?: string;
  country?: string;
};

export const KEYRA_SESSION_COOKIE = "keyra_session";

/** 30 days */
export const KEYRA_SESSION_MAX_AGE = 60 * 60 * 24 * 30;
