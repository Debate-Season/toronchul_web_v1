"use client";

interface DeButtonLargeProps {
  text: string;
  onPressed: () => void;
  enable?: boolean;
}

export default function DeButtonLarge({
  text,
  onPressed,
  enable = true,
}: DeButtonLargeProps) {
  return (
    <button
      type="button"
      onClick={enable ? onPressed : undefined}
      disabled={!enable}
      className={[
        "w-full py-3 rounded-xl text-center",
        "text-body-16 font-medium",
        "cursor-pointer transition-colors",
        "disabled:cursor-not-allowed",
        enable
          ? "bg-brand text-grey-10"
          : "bg-brand-dark text-brand-disable",
      ].join(" ")}
    >
      {text}
    </button>
  );
}
