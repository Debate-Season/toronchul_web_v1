"use client";

import { useState } from "react";
import DeModalSheet from "@/components/TDS/DeModalSheet";
import DeButtonLarge from "@/components/TDS/DeButtonLarge";
import { imageUrl } from "@/lib/imageUrl";
import { PROFILE_TEXT } from "@/lib/profile/constants";
import type { Community } from "@/lib/api/profile";

interface CommunityPickerModalProps {
  /** 표시할 커뮤니티 목록 (검색 반영된 결과) */
  communities: Community[];
  /** 현재 확정된 커뮤니티 id (없으면 -1) */
  currentId: number;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onConfirm: (community: Community) => void;
  onClose: () => void;
  loading?: boolean;
}

/** 소속 커뮤니티 선택 모달. 모바일 ProfileCommunityBottomSheet 미러. */
export default function CommunityPickerModal({
  communities,
  currentId,
  searchValue,
  onSearchChange,
  onConfirm,
  onClose,
  loading = false,
}: CommunityPickerModalProps) {
  const [tempId, setTempId] = useState(currentId);
  const selected = communities.find((c) => c.id === tempId);

  return (
    <DeModalSheet
      title="소속 커뮤니티"
      onClose={onClose}
      footer={
        <DeButtonLarge
          text={PROFILE_TEXT.register}
          enable={tempId > 0}
          onPressed={() => {
            if (selected) onConfirm(selected);
          }}
        />
      }
    >
      <div className="pb-2">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="커뮤니티 검색"
          className="mb-4 w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-body-16 text-text-primary placeholder:text-text-secondary focus:border-brand focus:outline-none"
        />

        {loading ? (
          <p className="py-8 text-center text-body-14 text-text-secondary">
            불러오는 중...
          </p>
        ) : communities.length === 0 ? (
          <p className="py-8 text-center text-body-14 text-text-secondary">
            검색 결과가 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {communities.map((community) => {
              const isSelected = tempId === community.id;
              return (
                <button
                  key={community.id}
                  type="button"
                  onClick={() => setTempId(community.id)}
                  className="flex flex-col items-center gap-2 cursor-pointer"
                >
                  <div
                    className={[
                      "overflow-hidden rounded-xl transition-all",
                      isSelected
                        ? "ring-2 ring-brand"
                        : "ring-1 ring-border",
                    ].join(" ")}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl(community.iconUrl)}
                      alt={community.name}
                      width={56}
                      height={56}
                      className="object-cover"
                      style={{ width: 56, height: 56 }}
                    />
                  </div>
                  <span
                    className={[
                      "text-caption-12 text-center",
                      isSelected ? "text-text-primary" : "text-text-secondary",
                    ].join(" ")}
                  >
                    {community.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </DeModalSheet>
  );
}
