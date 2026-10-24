import { createHash } from "node:crypto";
import { readPrivateFile, writePrivateFile } from "./private-files";
import { AccessError } from "./access";

export async function storePreview(
  ownerUid: string,
  projectId: string,
  preview?: string,
): Promise<string | undefined> {
  if (!preview) return undefined;
  const match = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(
    preview,
  );
  if (!match) throw new AccessError("Invalid room preview.", 400);
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > 1_800_000)
    throw new AccessError("The room preview is too large.", 400);
  const png = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (match[1] === "png" ? !png : !jpeg)
    throw new AccessError(
      "The preview must contain a valid PNG or JPEG image.",
      400,
    );
  const hash = createHash("sha256").update(bytes).digest("hex");
  const path = `theater-private/previews/${ownerUid}/${projectId}/${hash}.${match[1] === "png" ? "png" : "jpg"}`;
  return writePrivateFile(path, bytes, `image/${match[1]}`);
}
export async function loadPreview(path: string): Promise<string> {
  const file = await readPrivateFile(path);
  if (!file || !file.mime.startsWith("image/"))
    throw new AccessError("Room preview unavailable.", 404);
  return `data:${file.mime};base64,${file.bytes.toString("base64")}`;
}
