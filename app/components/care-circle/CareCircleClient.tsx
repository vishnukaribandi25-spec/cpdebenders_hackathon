"use client";

import { useCallback, useState } from "react";
import Avatar from "../dashboard/Avatar";
import { currentUser } from "../../lib/mock-data";
import { initialsFrom, type InvitationInput } from "../../lib/care-circle-store";
import { useCareCircle } from "../../lib/use-care-circle";
import InviteDialog from "./InviteDialog";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2D7A6E]";

const CARD_CLASS = "flex items-center gap-4 rounded-2xl border border-[#E3E8E6] bg-white p-4";

const SECONDARY_BUTTON_CLASS = `rounded-xl border border-[#D5DEDA] bg-white px-3 py-2 text-xs font-semibold text-[#1F2A28] hover:bg-[#F4F6F5] ${FOCUS_RING}`;

export default function CareCircleClient() {
  const { members, invitations, ready, inviteMember, removeMember, cancelInvitation } = useCareCircle();
  const [inviteOpen, setInviteOpen] = useState(false);

  const closeInvite = useCallback(() => setInviteOpen(false), []);

  const handleInvite = useCallback(
    (input: InvitationInput) => {
      inviteMember(input);
      setInviteOpen(false);
    },
    [inviteMember],
  );

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="care-circle-members-heading" className="flex flex-col gap-3">
        <h2 id="care-circle-members-heading" className="text-base font-semibold text-[#1F2A28]">
          Family members
        </h2>
        {ready && (
          <ul className="grid gap-3 sm:grid-cols-2">
            {members.map((member) => (
              <li key={member.id} className={CARD_CLASS}>
                <Avatar initials={member.initials} tone={member.tone} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[#1F2A28]">{member.name}</p>
                  <p className="truncate text-xs text-[#6B7673]">{member.role || "Family member"}</p>
                </div>
                {member.id !== currentUser.id && (
                  <button
                    type="button"
                    onClick={() => removeMember(member.id)}
                    aria-label={`Remove ${member.name}`}
                    className={SECONDARY_BUTTON_CLASS}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
            {invitations.map((invitation) => (
              <li key={invitation.id} className={CARD_CLASS}>
                <Avatar initials={initialsFrom(invitation.name)} tone="slate" size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[#1F2A28]">{invitation.name}</p>
                    <span className="rounded-full bg-[#CFE5DE] px-2 py-0.5 text-[11px] font-semibold text-[#2D7A6E]">
                      Pending
                    </span>
                  </div>
                  <p className="truncate text-xs text-[#6B7673]">
                    {invitation.role || "Family member"} · {invitation.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => cancelInvitation(invitation.id)}
                  aria-label={`Cancel invite for ${invitation.name}`}
                  className={SECONDARY_BUTTON_CLASS}
                >
                  Cancel invite
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="care-circle-invite-heading"
        className="flex flex-col gap-3 rounded-2xl border border-[#E3E8E6] bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1">
          <h2 id="care-circle-invite-heading" className="text-base font-semibold text-[#1F2A28]">
            Invite family member
          </h2>
          <p className="text-sm text-[#6B7673]">
            Invitations are saved on this device only and not emailed yet.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className={`rounded-xl bg-[#2D7A6E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#25655B] ${FOCUS_RING}`}
        >
          Add invitation
        </button>
      </section>

      <InviteDialog open={inviteOpen} onClose={closeInvite} onSubmit={handleInvite} />
    </div>
  );
}
