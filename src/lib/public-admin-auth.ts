import type { User } from "firebase/auth";

export const PUBLIC_ADMIN_ACCESS_ERROR =
  "This Firebase account is not authorized for the Epix Infra public-site administration panel.";

export async function hasPublicSiteAdminClaim(
  user: User,
  forceRefresh = true,
): Promise<boolean> {
  const token = await user.getIdTokenResult(forceRefresh);
  return token.claims.publicSiteAdmin === true;
}
