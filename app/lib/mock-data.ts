// Static mock data for the CareCircle dashboard.
// Kept as plain module data so it can be prerendered (no Date/random calls).

export type AvatarTone = "teal" | "sky" | "rose" | "amber" | "violet" | "slate";

export type Member = {
  id: string;
  name: string;
  initials: string;
  tone: AvatarTone;
  role: string;
};

export type TaskStatus = "todo" | "in_progress" | "awaiting" | "completed";

export type Task = {
  id: string;
  title: string;
  detail: string;
  assignee: Member;
  due: string;
  status: TaskStatus;
};

export type Appointment = {
  title: string;
  dayLabel: string;
  dayNumber: string;
  timeRange: string;
  location: string;
  handledBy: Member;
  handledNote: string;
};

export type AttentionItem = {
  id: string;
  title: string;
  detail: string;
};

export type ActivityItem = {
  id: string;
  actor: Member;
  action: string;
  detail: string;
  label: string;
  time: string;
};

export type StatCard = {
  id: string;
  label: string;
  value: string;
  note: string;
  iconTone: "green" | "amber" | "red";
  noteTone: "teal" | "amber" | "red";
  icon: "clock" | "people" | "alert" | "check";
};

export type CareRecipient = {
  name: string;
  initials: string;
  tone: AvatarTone;
  relationTag: string;
  tagline: string;
  circleHeadline: string;
  circleNames: string;
};

export type NavIcon = "dashboard" | "tasks" | "appointments" | "timeline" | "circle" | "settings";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIcon;
  badge?: string;
  active?: boolean;
};

export const currentUser: Member = {
  id: "vishnu",
  name: "Vishnu",
  initials: "V",
  tone: "teal",
  role: "Family admin",
};

export const ravi: Member = { id: "ravi", name: "Ravi", initials: "R", tone: "sky", role: "Son" };
export const priya: Member = { id: "priya", name: "Priya", initials: "P", tone: "rose", role: "Daughter-in-law" };
export const arjun: Member = { id: "arjun", name: "Arjun", initials: "A", tone: "amber", role: "Grandson" };

export const todayLabel = "Monday, 24 August";

export const pageHeading = {
  title: "Good morning, Vishnu",
  subtitle: "Here's your family's care overview.",
};

export const careRecipient: CareRecipient = {
  name: "Lakshmi",
  initials: "L",
  tone: "teal",
  relationTag: "MUM",
  tagline: "A little coordination. A lot of peace of mind.",
  circleHeadline: "Your circle is connected",
  circleNames: "Ravi, Priya, Arjun + you",
};

export const careCircleMembers: Member[] = [ravi, priya, arjun];

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Care Tasks", href: "/care-tasks", icon: "tasks", badge: "4" },
  { label: "Appointments", href: "/appointments", icon: "appointments" },
  { label: "Timeline", href: "/timeline", icon: "timeline" },
  { label: "Care Circle", href: "/care-circle", icon: "circle" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

export const statCards: StatCard[] = [
  {
    id: "due-today",
    label: "Due Today",
    value: "4",
    note: "2 still to do",
    iconTone: "green",
    noteTone: "teal",
    icon: "clock",
  },
  {
    id: "awaiting",
    label: "Awaiting Acceptance",
    value: "1",
    note: "Waiting on Arjun",
    iconTone: "amber",
    noteTone: "amber",
    icon: "people",
  },
  {
    id: "overdue",
    label: "Overdue",
    value: "1",
    note: "Needs a little attention",
    iconTone: "red",
    noteTone: "red",
    icon: "alert",
  },
  {
    id: "completed-week",
    label: "Completed This Week",
    value: "12",
    note: "↑ 3 more than last week",
    iconTone: "green",
    noteTone: "teal",
    icon: "check",
  },
];

export const todayTasks: Task[] = [
  {
    id: "doctor-appointment",
    title: "Doctor appointment",
    detail: "Cardiology · bring previous reports",
    assignee: ravi,
    due: "10:00 AM",
    status: "todo",
  },
  {
    id: "pick-up-prescription",
    title: "Pick up prescription",
    detail: "Green Cross Pharmacy",
    assignee: priya,
    due: "11:30 AM",
    status: "in_progress",
  },
  {
    id: "grocery-delivery",
    title: "Grocery delivery",
    detail: "Fruits, vegetables & pantry essentials",
    assignee: arjun,
    due: "5:00 PM",
    status: "awaiting",
  },
  {
    id: "check-blood-pressure",
    title: "Check blood pressure",
    detail: "Reading recorded · 8:15 AM",
    assignee: priya,
    due: "8:00 AM",
    status: "completed",
  },
];

export const upcomingAppointment: Appointment = {
  title: "Cardiology appointment",
  dayLabel: "MON",
  dayNumber: "24",
  timeRange: "Monday, 10:00–10:45 AM",
  location: "Apollo Clinic, Indiranagar",
  handledBy: ravi,
  handledNote: "Ravi is taking Lakshmi",
};

export const attentionItems: AttentionItem[] = [
  {
    id: "evening-check-in",
    title: "Evening check-in is overdue",
    detail: "Due yesterday · not assigned",
  },
  {
    id: "grocery-acceptance",
    title: "Grocery delivery needs acceptance",
    detail: "Waiting on Arjun · sent 35 min ago",
  },
];

export const activityItems: ActivityItem[] = [
  {
    id: "bp-recorded",
    actor: priya,
    action: "recorded Lakshmi's blood pressure",
    detail: "Check blood pressure marked complete. Reading saved to her care log.",
    label: "Completed",
    time: "8:15 AM",
  },
  {
    id: "visit-confirmed",
    actor: ravi,
    action: "confirmed today's cardiology visit",
    detail: "\u201CI'll pick Mum up at 9:15. Reports are ready.\u201D",
    label: "Appointment",
    time: "8:02 AM",
  },
  {
    id: "grocery-added",
    actor: arjun,
    action: "added items to the grocery list",
    detail: "Fresh fruit, oats and vegetables added for this week.",
    label: "Care update",
    time: "Yesterday, 6:42 PM",
  },
];
