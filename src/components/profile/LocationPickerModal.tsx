"use client";

import { useState } from "react";
import DeModalSheet from "@/components/TDS/DeModalSheet";
import DeButtonLarge from "@/components/TDS/DeButtonLarge";
import { PROFILE_TEXT } from "@/lib/profile/constants";
import {
  PROVINCES,
  getDistricts,
  provinceFromCode,
} from "@/lib/profile/regions";

export interface LocationSelection {
  provinceCode: string;
  districtCode: string;
  provinceName: string;
  districtName: string;
}

interface LocationPickerModalProps {
  title: string;
  initialProvinceCode?: string;
  initialDistrictCode?: string;
  onConfirm: (selection: LocationSelection) => void;
  onClose: () => void;
}

/** 거주지/출신지(도·시군구) 선택 모달. 모바일 ProfileLocationBottomSheet 미러. */
export default function LocationPickerModal({
  title,
  initialProvinceCode,
  initialDistrictCode,
  onConfirm,
  onClose,
}: LocationPickerModalProps) {
  const [provinceCode, setProvinceCode] = useState(
    initialProvinceCode || PROVINCES[0].code,
  );
  const [districtCode, setDistrictCode] = useState<string | null>(
    initialDistrictCode || null,
  );

  const districts = getDistricts(provinceCode);
  const province = provinceFromCode(provinceCode);
  const district = districts.find((d) => d.code === districtCode) ?? null;

  return (
    <DeModalSheet
      title={title}
      onClose={onClose}
      footer={
        <DeButtonLarge
          text={PROFILE_TEXT.choice}
          enable={district !== null}
          onPressed={() => {
            if (!district) return;
            onConfirm({
              provinceCode: province.code,
              districtCode: district.code,
              provinceName: province.name,
              districtName: district.name,
            });
          }}
        />
      }
    >
      <div className="flex h-[50vh] gap-2 pb-2 sm:h-80">
        {/* 도/광역시 */}
        <div className="w-2/5 overflow-y-auto border-r border-border pr-1">
          {PROVINCES.map((p) => {
            const active = p.code === provinceCode;
            return (
              <button
                key={p.code}
                type="button"
                onClick={() => {
                  setProvinceCode(p.code);
                  setDistrictCode(null);
                }}
                className={[
                  "w-full rounded-lg px-3 py-2.5 text-left text-body-14 transition-colors cursor-pointer",
                  active
                    ? "bg-tag font-medium text-text-primary"
                    : "text-text-secondary hover:bg-grey-90",
                ].join(" ")}
              >
                {p.name}
              </button>
            );
          })}
        </div>

        {/* 시/군/구 */}
        <div className="flex-1 overflow-y-auto pl-1">
          {districts.map((d) => {
            const active = d.code === districtCode;
            return (
              <button
                key={d.code}
                type="button"
                onClick={() => setDistrictCode(d.code)}
                className={[
                  "w-full rounded-lg px-3 py-2.5 text-left text-body-14 transition-colors cursor-pointer",
                  active
                    ? "bg-tag font-medium text-brand"
                    : "text-text-secondary hover:bg-grey-90",
                ].join(" ")}
              >
                {d.name}
              </button>
            );
          })}
        </div>
      </div>
    </DeModalSheet>
  );
}
