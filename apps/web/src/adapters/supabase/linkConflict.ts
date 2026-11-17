const ERROR_PARAMS = ['error', 'error_code', 'error_description'];

export function linkConflictReturnUrl(href: string): string | null {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const code = url.searchParams.get('error_code') ?? hash.get('error_code');
  if (code !== 'identity_already_exists') return null;
  for (const param of ERROR_PARAMS) {
    url.searchParams.delete(param);
    hash.delete(param);
  }
  const rest = hash.toString();
  url.hash = rest ? `#${rest}` : '';
  return url.toString();
}
