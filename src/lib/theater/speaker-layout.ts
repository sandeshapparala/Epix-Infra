export type CustomAudio = {
  bed: 5 | 7 | 9;
  subs: number;
  height: 0 | 2 | 4 | 6;
};
export const AUDIO_PRESETS = [
  "5.1",
  "5.1.2",
  "5.1.4",
  "7.1.2",
  "7.1.4",
  "7.2.4",
  "7.1.6",
  "9.1.4",
] as const;
export type AudioPreset = (typeof AUDIO_PRESETS)[number] | "custom";
export const MAX_SPEAKERS = 16;
export const DEFAULT_CUSTOM_AUDIO: CustomAudio = { bed: 7, subs: 2, height: 4 };
export function validCustomAudio(value: unknown): value is CustomAudio {
  if (!value || typeof value !== "object") return false;
  const v = value as CustomAudio;
  return (
    Object.keys(v).every((k) => ["bed", "subs", "height"].includes(k)) &&
    [5, 7, 9].includes(v.bed) &&
    Number.isInteger(v.subs) &&
    v.subs >= 1 &&
    v.subs <= 4 &&
    [0, 2, 4, 6].includes(v.height) &&
    v.bed + v.subs + v.height <= MAX_SPEAKERS
  );
}
export function speakerLayout(
  input: string | { audio: string; customAudio?: CustomAudio },
) {
  const audio = typeof input === "string" ? input : input.audio;
  const custom =
    typeof input === "string"
      ? DEFAULT_CUSTOM_AUDIO
      : (input.customAudio ?? DEFAULT_CUSTOM_AUDIO);
  const [bed, subs, height = 0] =
    audio === "custom"
      ? [custom.bed, custom.subs, custom.height]
      : audio.split(".").map(Number);
  return {
    bed,
    subs,
    height,
    channels: bed + height,
    total: bed + subs + height,
    label: `${bed}.${subs}${height ? `.${height}` : ""}`,
  };
}
export const audioLabel = (d: { audio: string; customAudio?: CustomAudio }) =>
  speakerLayout(d).label;
