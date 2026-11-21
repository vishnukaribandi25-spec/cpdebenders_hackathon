"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import {
  DEFAULT_SETTINGS,
  getServerSettingsSnapshot,
  getSettingsSnapshot,
  parseSettings,
  saveSettings,
  subscribeSettings,
} from "../../lib/settings";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D7A6E]";

const INPUT = `mt-1.5 w-full rounded-xl border border-[#D5DEDA] bg-white px-3.5 py-2.5 text-sm text-[#1F2A28] disabled:opacity-60 ${FOCUS_RING}`;

function fieldValue(value: FormDataEntryValue | null, fallback: string): string {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : fallback;
}

export default function SettingsForm() {
  // Stays undefined until localStorage is read on the client, so the first render matches the server.
  const raw = useSyncExternalStore(subscribeSettings, getSettingsSnapshot, getServerSettingsSnapshot);
  const ready = raw !== undefined;
  const saved = parseSettings(raw);
  const [savedNotice, setSavedNotice] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    saveSettings({
      familyName: fieldValue(data.get("familyName"), DEFAULT_SETTINGS.familyName),
      recipientName: fieldValue(data.get("recipientName"), DEFAULT_SETTINGS.recipientName),
    });
    setSavedNotice(true);
  }

  return (
    <section
      aria-labelledby="settings-form-title"
      className="rounded-2xl border border-[#E3E8E6] bg-white p-5 sm:p-6"
    >
      <h2 id="settings-form-title" className="text-base font-bold text-[#1F2A28]">
        Care circle details
      </h2>

      <form
        // Remount when the stored value changes so the fields show the saved values.
        key={raw ?? "none"}
        onSubmit={handleSubmit}
        onChange={() => setSavedNotice(false)}
        className="mt-5 flex max-w-xl flex-col gap-5"
      >
        <label className="flex flex-col text-sm font-semibold text-[#1F2A28]">
          Family name
          <input
            name="familyName"
            type="text"
            required
            maxLength={80}
            defaultValue={saved.familyName}
            disabled={!ready}
            className={INPUT}
          />
        </label>

        <label className="flex flex-col text-sm font-semibold text-[#1F2A28]">
          Care recipient name
          <input
            name="recipientName"
            type="text"
            required
            maxLength={80}
            defaultValue={saved.recipientName}
            disabled={!ready}
            className={INPUT}
          />
        </label>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={!ready}
            className={`rounded-xl bg-[#2D7A6E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#25655B] disabled:opacity-60 ${FOCUS_RING}`}
          >
            Save
          </button>
          <p role="status" className="text-sm font-semibold text-[#2D7A6E]">
            {savedNotice ? "Saved" : ""}
          </p>
        </div>
      </form>
    </section>
  );
}
