"use client";

import { Pencil } from "lucide-react";
import { imageColorFromEngName } from "@/lib/profile/constants";

interface ProfileAvatarProps {
  /** 프로필 이미지 색상 engName (예: "RED") */
  engName: string;
  /** 원 지름(px) */
  size?: number;
  /** 우상단 편집 뱃지 표시 */
  editable?: boolean;
  onClick?: () => void;
}

/** 색상 원형 아바타 (+ 편집 뱃지). 모바일 _myProfile 아바타 미러. */
export default function ProfileAvatar({
  engName,
  size = 80,
  editable = false,
  onClick,
}: ProfileAvatarProps) {
  const color = imageColorFromEngName(engName);

  const circle = (
    <div className="relative inline-block">
      <div
        className={`${color.bgClass} rounded-full`}
        style={{ width: size, height: size }}
      />
      {editable && (
        <div className="absolute -top-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-grey-70">
          <Pencil size={14} className="text-grey-10" />
        </div>
      )}
    </div>
  );

  if (!onClick) return circle;

  return (
    <button type="button" onClick={onClick} className="cursor-pointer">
      {circle}
    </button>
  );
}
