"use client";

/**
 * Shared types for review queue components.
 * Re-exports from documents-review-api so components don't import from lib/.
 */

export type {
  ReviewQueueItem,
  ReviewQueueSummary,
  ReviewQueueFile,
} from "@/lib/documents-review-api";

export type { ReviewStatus } from "@/lib/documents-review-api";
