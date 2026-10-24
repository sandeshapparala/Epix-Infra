import { auth } from "@/lib/firebase";
export async function authorizedFetch(url: string, init?: RequestInit) {
  await auth.authStateReady();
  const user = auth.currentUser;
  const headers = new Headers(init?.headers);
  if (user) headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  return fetch(url, { ...init, cache: "no-store", headers });
}
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await authorizedFetch(url, {
    cache: "no-store",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const value = await response.json();
  if (!response.ok)
    throw new Error(value.error || "The request could not be completed");
  return value;
}
export async function quotePdfBlob(id: string) {
  const response = await authorizedFetch(`/api/theater/quotes/${id}/pdf`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Quotation download failed.");
  }
  return response.blob();
}
export async function downloadQuote(id: string, name: string) {
  const url = URL.createObjectURL(await quotePdfBlob(id));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
