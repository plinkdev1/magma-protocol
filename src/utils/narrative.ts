// src/utils/narrative.ts

export function getDaysRemaining(deadline_at: string | null | undefined): number {
  if (!deadline_at) return 0;
  const now = new Date();
  const deadline = new Date(deadline_at);
  const diffMs = deadline.getTime() - now.getTime();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getDeadlineLabel(deadline_at: string | null | undefined, tag?: string): string {
  const days = getDaysRemaining(deadline_at);
  if (days === 0) return 'Ended';
  return tag ? `${days}d · ${tag}` : `${days} days`;
}
