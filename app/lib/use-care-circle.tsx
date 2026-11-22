"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Member } from "./mock-data";
import {
  CARE_CIRCLE_STORAGE_KEY,
  addInvitationToState,
  cancelInvitationInState,
  createInvitation,
  parseStoredCareCircle,
  removeMemberFromState,
  type CareCircleState,
  type Invitation,
  type InvitationInput,
} from "./care-circle-store";

interface CareCircleContextValue {
  members: Member[];
  invitations: Invitation[];
  /** False until localStorage has been read on the client. */
  ready: boolean;
  inviteMember: (input: InvitationInput) => void;
  removeMember: (id: string) => void;
  cancelInvitation: (id: string) => void;
}

// Stable empty state used before hydration, so the server render and the first
// client render match.
const EMPTY_STATE: CareCircleState = { members: [], invitations: [] };

// Raw localStorage value, exposed as an external store.
// undefined = not read yet (server render and first client render);
// string | null = the loaded value (null means nothing stored yet).
type RawSnapshot = string | null | undefined;

const storeListeners = new Set<() => void>();
let storeRaw: RawSnapshot = undefined;

function readStorage(): string | null {
  try {
    return window.localStorage.getItem(CARE_CIRCLE_STORAGE_KEY);
  } catch {
    // Storage can be blocked (privacy mode, disabled cookies). Fall back to the seeded defaults.
    return null;
  }
}

function getRawSnapshot(): RawSnapshot {
  if (storeRaw === undefined) storeRaw = readStorage();
  return storeRaw;
}

function getServerRawSnapshot(): RawSnapshot {
  return undefined;
}

function subscribeRaw(listener: () => void): () => void {
  storeListeners.add(listener);
  return () => {
    storeListeners.delete(listener);
  };
}

function writeRaw(raw: string): void {
  // Keep the in-memory value even if storage is unavailable, so the app still works.
  storeRaw = raw;
  try {
    window.localStorage.setItem(CARE_CIRCLE_STORAGE_KEY, raw);
  } catch {
    // Quota exceeded or storage unavailable. The in-memory state still works.
  }
  storeListeners.forEach((listener) => listener());
}

function applyState(update: (prev: CareCircleState) => CareCircleState): void {
  const prev = parseStoredCareCircle(getRawSnapshot() ?? null);
  writeRaw(JSON.stringify(update(prev)));
}

const CareCircleContext = createContext<CareCircleContextValue | null>(null);

export function CareCircleProvider({ children }: { children: ReactNode }) {
  // Reads localStorage after mount without calling setState inside an effect.
  // The server snapshot is undefined, so hydration matches the first client render.
  const raw = useSyncExternalStore(subscribeRaw, getRawSnapshot, getServerRawSnapshot);
  const ready = raw !== undefined;

  const state = useMemo<CareCircleState>(
    () => (raw === undefined ? EMPTY_STATE : parseStoredCareCircle(raw)),
    [raw],
  );

  // First visit: persist the seeded members so the stored state exists across reloads.
  useEffect(() => {
    if (raw === null) writeRaw(JSON.stringify(state));
  }, [raw, state]);

  const inviteMember = useCallback((input: InvitationInput) => {
    const invitation = createInvitation(input, new Date());
    applyState((prev) => addInvitationToState(prev, invitation));
  }, []);

  const removeMember = useCallback((id: string) => {
    applyState((prev) => removeMemberFromState(prev, id));
  }, []);

  const cancelInvitation = useCallback((id: string) => {
    applyState((prev) => cancelInvitationInState(prev, id));
  }, []);

  const value = useMemo<CareCircleContextValue>(
    () => ({
      members: state.members,
      invitations: state.invitations,
      ready,
      inviteMember,
      removeMember,
      cancelInvitation,
    }),
    [state, ready, inviteMember, removeMember, cancelInvitation],
  );

  return <CareCircleContext.Provider value={value}>{children}</CareCircleContext.Provider>;
}

export function useCareCircle(): CareCircleContextValue {
  const context = useContext(CareCircleContext);
  if (context === null) {
    throw new Error("useCareCircle must be used inside <CareCircleProvider>.");
  }
  return context;
}
