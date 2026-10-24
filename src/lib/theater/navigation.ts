export const THEATER_HOME = "/home-theater-builder";

// Only local theatre routes can be a post-login destination.
export function theaterReturnTo(value: string | null): string {
  if (
    !value ||
    /[\\\u0000-\u001f]/.test(value) ||
    !value.startsWith(THEATER_HOME) ||
    value.startsWith(`${THEATER_HOME}/login`)
  )
    return THEATER_HOME;
  try {
    const url = new URL(value, "https://epix.invalid");
    if (
      url.origin !== "https://epix.invalid" ||
      (url.pathname !== THEATER_HOME &&
        !url.pathname.startsWith(`${THEATER_HOME}/`))
    )
      return THEATER_HOME;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return THEATER_HOME;
  }
}
