"use client";

/**
 * ReviewNoteDialog — modal for entering a review note when marking
 * a document as NEEDS_REVISION.
 *
 * Replaces window.prompt("Nhập lý do yêu cầu sửa:", ...).
 *
 * Props:
 *   open            — controls visibility
 *   documentTitle   — shown in the dialog header
 *   defaultNote     — pre-filled into the textarea
 *   onConfirm(note) — called when user submits (note is non-empty string)
 *   onCancel        — called when user closes/cancels
 *   isSubmitting    — disables buttons while the API call is in flight
 */

import { useEffect, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ReviewNoteDialogProps {
  open: boolean;
  documentTitle: string;
  templateCode: string;
  defaultNote: string;
  isSubmitting?: boolean;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}

export function ReviewNoteDialog({
  open,
  documentTitle,
  templateCode,
  defaultNote,
  isSubmitting = false,
  onConfirm,
  onCancel,
}: ReviewNoteDialogProps) {
  const [note, setNote] = useState(defaultNote);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset textarea when dialog opens with a new defaultNote
  useEffect(() => {
    if (open) {
      setNote(defaultNote);
      // Focus textarea after mount
      requestAnimationFrame(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      });
    }
  }, [open, defaultNote]);

  const handleConfirm = () => {
    const trimmed = note.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (note.trim()) void handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yêu cầu sửa biểu mẫu</DialogTitle>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">{templateCode}</span>
            {" — "}
            {documentTitle || "Không có tiêu đề"}
          </p>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="review-note">Ghi chú phản hồi</Label>
          <Textarea
            id="review-note"
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Mô tả chi tiết những gì cần sửa đổi..."
            rows={4}
            disabled={isSubmitting}
            aria-required="true"
          />
          <p className="text-xs text-muted-foreground">
            Nhấn Ctrl+Enter để gửi nhanh.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="warning"
            onClick={() => void handleConfirm()}
            disabled={!note.trim() || isSubmitting}
          >
            {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu sửa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
