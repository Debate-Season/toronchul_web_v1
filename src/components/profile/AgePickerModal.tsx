"use client";

import { useState } from "react";
import DeModalSheet from "@/components/TDS/DeModalSheet";
import DeButtonLarge from "@/components/TDS/DeButtonLarge";
import { AGE_RANGES, PROFILE_TEXT } from "@/lib/profile/constants";

interface AgePickerModalProps {
  current: string;
  onConfirm: (age: string) => void;
  onClose: () => void;
}

/** 연령대 선택 모달. 모바일 ProfileAgeBottomSheet 미러. */
export default function AgePickerModal({
  current,
  onConfirm,
  onClose,
}: AgePickerModalProps) {
  const [temp, setTemp] = useState(current);

  return (
    <DeModalSheet
      title="연령대"
      onClose={onClose}
      footer={
        <DeButtonLarge
          text={PROFILE_TEXT.choice}
          enable={temp !== ""}
          onPressed={() => onConfirm(temp)}
        />
      }
    >
      <div className="grid grid-cols-3 gap-2 pb-2">
        {AGE_RANGES.map((age) => {
          const selected = temp === age;
          return (
            <button
              key={age}
              type="button"
              onClick={() => setTemp(age)}
              className={[
                "rounded-xl py-3 text-body-14 font-medium transition-colors cursor-pointer",
                selected
                  ? "border border-brand bg-tag text-text-primary"
                  : "border border-border bg-surface-elevated text-text-secondary hover:bg-grey-90",
              ].join(" ")}
            >
              {age}
            </button>
          );
        })}
      </div>
    </DeModalSheet>
  );
}
