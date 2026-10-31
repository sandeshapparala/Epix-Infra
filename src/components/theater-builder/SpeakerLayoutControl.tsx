"use client";
import type { TheaterDesign } from "./design";
import {
  AUDIO_PRESETS,
  DEFAULT_CUSTOM_AUDIO,
  MAX_SPEAKERS,
  speakerLayout,
  type AudioPreset,
  type CustomAudio,
} from "@/lib/theater/speaker-layout";
import styles from "./builder.module.css";
export default function SpeakerLayoutControl({
  design,
  onChange,
}: {
  design: TheaterDesign;
  onChange: (audio: AudioPreset, custom: CustomAudio) => void;
}) {
  const custom = design.customAudio ?? DEFAULT_CUSTOM_AUDIO,
    layout = speakerLayout(design);
  return (
    <div className={styles.audioControls}>
      <label>
        Speaker layout
        <select
          value={design.audio}
          onChange={(e) => onChange(e.target.value as AudioPreset, custom)}
        >
          {AUDIO_PRESETS.map((audio) => (
            <option key={audio} value={audio}>
              {audio} · {speakerLayout(audio).total} speakers
            </option>
          ))}
          <option value="custom">Custom layout</option>
        </select>
      </label>
      {design.audio === "custom" && (
        <div className={styles.customAudioGrid}>
          {(
            [
              ["bed", "Ear-level speakers", [5, 7, 9]],
              ["subs", "Subwoofers", [1, 2, 3, 4]],
              ["height", "Ceiling / height", [0, 2, 4, 6]],
            ] as const
          ).map(([key, label, values]) => (
            <label key={key}>
              {label}
              <select
                value={custom[key]}
                onChange={(e) =>
                  onChange("custom", {
                    ...custom,
                    [key]: Number(e.target.value),
                  })
                }
              >
                {values.map((value) => (
                  <option
                    key={value}
                    value={value}
                    disabled={
                      custom.bed +
                        custom.subs +
                        custom.height -
                        custom[key] +
                        value >
                      MAX_SPEAKERS
                    }
                  >
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      )}
      <div className={styles.infoNote}>
        <strong>
          {layout.label} · {layout.total} speakers
        </strong>
        <br />
        {layout.bed} ear-level + {layout.subs} subwoofer
        {layout.subs === 1 ? "" : "s"} + {layout.height} overhead. Custom
        layouts support up to {MAX_SPEAKERS} total speakers. Receiver
        processing, amplification and room clearances are checked against your
        selection.
      </div>
    </div>
  );
}
