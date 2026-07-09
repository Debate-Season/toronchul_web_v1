"use client";

import { GENDERS } from "@/lib/profile/constants";

interface GenderCardsProps {
  value: string;
  onChange: (gender: string) => void;
}

/** 성별 선택 카드 3종(남성/여성/무응답). 모바일 _widgetGender 미러. */
export default function GenderCards({ value, onChange }: GenderCardsProps) {
  return (
    <div className="flex gap-2">
      {GENDERS.map((gender) => {
        const selected = value === gender;
        return (
          <button
            key={gender}
            type="button"
            onClick={() => onChange(gender)}
            className={[
              "flex-1 rounded-xl py-3 text-body-16 font-medium transition-colors cursor-pointer",
              selected
                ? "border border-brand bg-tag text-text-primary"
                : "border border-border bg-surface-elevated text-text-secondary hover:bg-grey-90",
            ].join(" ")}
          >
            {gender}
          </button>
        );
      })}
    </div>
  );
}
