"use client";

import { useEffect } from "react";

interface DeConfirmDialogProps {
  title: string;
  description?: string;
  doneText: string;
  cancelText: string;
  onDone: () => void;
  onCancel: () => void;
  /** done 버튼 강조색 (기본 brand). 파괴적 액션은 "red". */
  tone?: "brand" | "red";
}

/**
 * 공용 확인 다이얼로그 (모바일 DeDialog 미러). TDS leaf.
 */
export default function DeConfirmDialog({
  title,
  description,
  doneText,
  cancelText,
  onDone,
  onCancel,
  tone = "brand",
}: DeConfirmDialogProps) {
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onCancel();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-6"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-xs rounded-2xl bg-surface p-6">
        <p className="text-header-18 font-semibold text-text-primary text-center">
          {title}
        </p>
        {description && (
          <p className="mt-3 text-body-14 text-text-secondary text-center whitespace-pre-line">
            {description}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-grey-90 py-3 text-body-16 font-medium text-text-primary transition-colors hover:bg-grey-80 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onDone}
            className={[
              "flex-1 rounded-xl py-3 text-body-16 font-medium text-white transition-opacity hover:opacity-90 cursor-pointer",
              tone === "red" ? "bg-red" : "bg-brand",
            ].join(" ")}
          >
            {doneText}
          </button>
        </div>
      </div>
    </div>
  );
}
