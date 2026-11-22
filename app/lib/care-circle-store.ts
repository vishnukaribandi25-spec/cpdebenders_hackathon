// Pure Care Circle helpers. No React, and no window/localStorage access at
// import time, so this module is safe to import during prerender.

import { careCircleMembers, currentUser, type AvatarTone, type Member } from "./mock-data";

export const CARE_CIRCLE_STORAGE_KEY = "carecircle.care-circle.v1";

const AVATAR_TONES: readonly AvatarTone[] = ["teal", "sky", "rose", "amber", "violet", "slate"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** An invitation saved locally. Nothing is emailed, so every invitation is pending. */
export interface Invitation {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface CareCircleState {
  members: Member[];
  invitations: Invitation[];
}

export interface InvitationInput {
  name: string;
  email: string;
  role: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTone(value: unknown): value is AvatarTone {
  return typeof value === "string" && (AVATAR_TONES as readonly string[]).includes(value);
}

/** Fills optional fields with safe defaults. Returns null if id/name/initials are invalid. */
function normalizeMember(value: unknown): Member | null {
  if (!isRecord(value)) return null;
  const { id, name, initials, tone, role } = value;
  if (typeof id !== "string" || typeof name !== "string" || typeof initials !== "string") {
    return null;
  }
  return {
    id,
    name,
    initials,
    tone: isTone(tone) ? tone : "slate",
    role: typeof role === "string" ? role : "",
  };
}

/** Returns null if id/name/email are invalid. */
function normalizeInvitation(value: unknown): Invitation | null {
  if (!isRecord(value)) return null;
  const { id, name, email, role } = value;
  if (typeof id !== "string" || typeof name !== "string" || typeof email !== "string") {
    return null;
  }
  return { id, name, email, role: typeof role === "string" ? role : "" };
}

/** First visit: the family admin plus the starting members, with no invitations. */
export function defaultCareCircleState(): CareCircleState {
  return { members: [currentUser, ...careCircleMembers], invitations: [] };
}

/**
 * Parses stored Care Circle state. Never throws. Missing or unreadable storage
 * falls back to the seeded defaults. The family admin is always present.
 */
export function parseStoredCareCircle(raw: string | null): CareCircleState {
  if (raw === null) return defaultCareCircleState();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return defaultCareCircleState();
  }

  if (!isRecord(parsed) || !Array.isArray(parsed.members)) return defaultCareCircleState();

  const storedMembers: Member[] = [];
  for (const item of parsed.members) {
    const member = normalizeMember(item);
    if (member !== null) storedMembers.push(member);
  }
  const members = storedMembers.some((member) => member.id === currentUser.id)
    ? storedMembers
    : [currentUser, ...storedMembers];

  const invitations: Invitation[] = [];
  if (Array.isArray(parsed.invitations)) {
    for (const item of parsed.invitations) {
      const invitation = normalizeInvitation(item);
      if (invitation !== null) invitations.push(invitation);
    }
  }

  return { members, invitations };
}

/** Initials for an avatar, from the first letter of up to two words. */
export function initialsFrom(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase());
  return letters.join("") || "?";
}

export function validateInvitationInput(input: InvitationInput): Record<string, string> {
  const errors: Record<string, string> = {};

  const name = input.name.trim();
  if (name.length === 0) {
    errors.name = "Name is required.";
  } else if (name.length > 80) {
    errors.name = "Name must be 80 characters or fewer.";
  }

  const email = input.email.trim();
  if (email.length === 0) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (input.role.trim().length > 40) {
    errors.role = "Role must be 40 characters or fewer.";
  }

  return errors;
}

export function createInvitation(input: InvitationInput, now: Date): Invitation {
  const suffix = Math.random().toString(36).slice(2, 8);
  return {
    id: `inv-${now.getTime().toString(36)}-${suffix}`,
    name: input.name.trim(),
    email: input.email.trim(),
    role: input.role.trim(),
  };
}

export function addInvitationToState(state: CareCircleState, invitation: Invitation): CareCircleState {
  return { ...state, invitations: [...state.invitations, invitation] };
}

export function cancelInvitationInState(state: CareCircleState, id: string): CareCircleState {
  return { ...state, invitations: state.invitations.filter((invitation) => invitation.id !== id) };
}

/** The family admin cannot be removed. */
export function removeMemberFromState(state: CareCircleState, id: string): CareCircleState {
  if (id === currentUser.id) return state;
  return { ...state, members: state.members.filter((member) => member.id !== id) };
}
