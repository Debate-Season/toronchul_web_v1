"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import DeButtonLarge from "@/components/TDS/DeButtonLarge";
import FieldLabel from "@/components/profile/FieldLabel";
import GenderCards from "@/components/profile/GenderCards";
import CommunityPickerModal from "@/components/profile/CommunityPickerModal";
import AgePickerModal from "@/components/profile/AgePickerModal";
import LocationPickerModal, {
  type LocationSelection,
} from "@/components/profile/LocationPickerModal";
import {
  checkNickname,
  createProfile,
  getCommunities,
  searchCommunities,
  updateProfile,
  type Community,
  type MyProfile,
  type ProfilePayload,
} from "@/lib/api/profile";
import {
  NICKNAME_DUPLICATE_MSG,
  NICKNAME_HINT,
  NICKNAME_INVALID_MSG,
  PROFILE_TEXT,
  isValidNicknameFormat,
} from "@/lib/profile/constants";
import { districtFromCode, provinceFromCode } from "@/lib/profile/regions";

type Modal = "community" | "age" | "residence" | "hometown" | null;

interface RegionState {
  provinceCode: string;
  districtCode: string;
}

const EMPTY_REGION: RegionState = { provinceCode: "", districtCode: "" };

interface ProfileFormProps {
  mode: "create" | "modify";
  /** 수정 모드의 기존 프로필 (create 시 null) */
  initial: MyProfile | null;
  token: string | null;
  /** 저장 성공 후 호출 (create→이미지, modify→뒤로) */
  onDone: () => void;
}

function regionText(region: RegionState): string {
  if (!region.districtCode) return "";
  const province = provinceFromCode(region.provinceCode);
  const district = districtFromCode(region.districtCode);
  if (!district) return "";
  return `${province.name} ${district.name}`;
}

export default function ProfileForm({
  mode,
  initial,
  token,
  onDone,
}: ProfileFormProps) {
  const isModify = mode === "modify";
  const initialNickname = initial?.nickname ?? "";

  // 닉네임
  const [nickname, setNickname] = useState(initialNickname);
  const [validatedNickname, setValidatedNickname] = useState(initialNickname);
  const [nicknameError, setNicknameError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 커뮤니티
  const [community, setCommunity] = useState<Community | null>(
    initial?.community && initial.community.id > 0 ? initial.community : null,
  );
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [searchResults, setSearchResults] = useState<Community[]>([]);
  const [communitySearch, setCommunitySearch] = useState("");
  const [communityLoading, setCommunityLoading] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 성별 / 연령
  const [gender, setGender] = useState(initial?.gender ?? "");
  const [ageRange, setAgeRange] = useState(initial?.ageRange ?? "");

  // 지역 (수정 모드만)
  const [residence, setResidence] = useState<RegionState>(
    initial && initial.residenceDistrict
      ? {
          provinceCode: initial.residenceProvince,
          districtCode: initial.residenceDistrict,
        }
      : EMPTY_REGION,
  );
  const [hometown, setHometown] = useState<RegionState>(
    initial && initial.hometownDistrict
      ? {
          provinceCode: initial.hometownProvince,
          districtCode: initial.hometownDistrict,
        }
      : EMPTY_REGION,
  );

  const [modal, setModal] = useState<Modal>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // 커뮤니티 목록 로드
  useEffect(() => {
    let cancelled = false;
    getCommunities(token)
      .then((list) => {
        if (!cancelled) setAllCommunities(list);
      })
      .catch(() => {
        /* 목록 실패 시 검색으로 대체 가능 */
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // ── 닉네임 검증 ──────────────────────────────────
  const handleNicknameChange = useCallback(
    (value: string) => {
      setNickname(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      // 기존 닉네임과 동일 → 검사 없이 통과 (모바일 previousNickname 단축)
      if (value === initialNickname && initialNickname !== "") {
        setNicknameError("");
        setValidatedNickname(initialNickname);
        return;
      }

      if (!isValidNicknameFormat(value)) {
        setNicknameError(value.length === 0 ? "" : NICKNAME_INVALID_MSG);
        setValidatedNickname("");
        return;
      }

      setNicknameError("");
      setValidatedNickname("");
      debounceRef.current = setTimeout(() => {
        checkNickname(value, token).then((result) => {
          if (result === "available") {
            setValidatedNickname(value);
            setNicknameError("");
          } else if (result === "duplicate") {
            setNicknameError(NICKNAME_DUPLICATE_MSG);
          } else {
            setNicknameError(NICKNAME_INVALID_MSG);
          }
        });
      }, 500);
    },
    [initialNickname, token],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  // ── 커뮤니티 검색 ────────────────────────────────
  const handleCommunitySearch = useCallback(
    (value: string) => {
      setCommunitySearch(value);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (value.trim() === "") {
        setSearchResults([]);
        return;
      }
      setCommunityLoading(true);
      searchDebounceRef.current = setTimeout(() => {
        searchCommunities(value, token)
          .then((list) => setSearchResults(list))
          .catch(() => setSearchResults([]))
          .finally(() => setCommunityLoading(false));
      }, 500);
    },
    [token],
  );

  // ── 유효성 ───────────────────────────────────────
  const baseValid =
    nickname.length > 0 &&
    nicknameError === "" &&
    nickname === validatedNickname &&
    gender !== "" &&
    ageRange !== "" &&
    community !== null;

  const isValid = baseValid; // 지역은 선택 항목(모달이 항상 완결값을 세팅)

  // ── 저장 ─────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!community || submitting) return;
    setSubmitting(true);
    setSubmitError("");

    const payload: ProfilePayload = {
      nickname: validatedNickname,
      communityId: community.id,
      gender,
      ageRange,
    };

    try {
      if (isModify) {
        payload.residenceProvince = residence.provinceCode || null;
        payload.residenceDistrict = residence.districtCode || null;
        payload.hometownProvince = hometown.provinceCode || null;
        payload.hometownDistrict = hometown.districtCode || null;
        await updateProfile(payload, token);
      } else {
        await createProfile(payload, token);
      }
      onDone();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "저장에 실패했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    community,
    submitting,
    validatedNickname,
    gender,
    ageRange,
    isModify,
    residence,
    hometown,
    token,
    onDone,
  ]);

  // 거주지와 동일
  const sameToResidence =
    residence.districtCode !== "" &&
    residence.provinceCode === hometown.provinceCode &&
    residence.districtCode === hometown.districtCode;

  const toggleSameToResidence = (checked: boolean) => {
    if (checked) {
      if (residence.districtCode) setHometown(residence);
    } else {
      setHometown(EMPTY_REGION);
    }
  };

  const displayedCommunities =
    communitySearch.trim() === "" ? allCommunities : searchResults;

  return (
    <div className="flex flex-col gap-8 px-5 py-3">
      {/* 닉네임 */}
      <div>
        <FieldLabel label="닉네임" required />
        <input
          type="text"
          value={nickname}
          onChange={(e) => handleNicknameChange(e.target.value)}
          placeholder={NICKNAME_HINT}
          className="mt-2 w-full rounded-xl border border-border bg-surface-elevated px-4 py-3 text-body-16 text-text-primary placeholder:text-text-secondary focus:border-brand focus:outline-none"
        />
        {nicknameError && (
          <p className="mt-1 text-caption-12 text-red">{nicknameError}</p>
        )}
      </div>

      {/* 소속 커뮤니티 */}
      <div>
        <FieldLabel label="소속 커뮤니티" required />
        <SelectField
          value={community?.name ?? ""}
          placeholder={PROFILE_TEXT.communityHint}
          onClick={() => setModal("community")}
        />
      </div>

      {/* 성별 */}
      <div>
        <FieldLabel label="성별" required notice={PROFILE_TEXT.privacyNotice} />
        <div className="mt-2">
          <GenderCards value={gender} onChange={setGender} />
        </div>
      </div>

      {/* 연령대 */}
      <div>
        <FieldLabel label="연령대" required notice={PROFILE_TEXT.privacyNotice} />
        <SelectField
          value={ageRange}
          placeholder={PROFILE_TEXT.ageHint}
          onClick={() => setModal("age")}
        />
      </div>

      {/* 거주지·출신지 (수정 모드만) */}
      {isModify && (
        <>
          <div>
            <FieldLabel label="거주지" notice={PROFILE_TEXT.privacyNotice} />
            <SelectField
              value={regionText(residence)}
              placeholder={PROFILE_TEXT.residenceHint}
              onClick={() => setModal("residence")}
            />
          </div>

          <div>
            <FieldLabel label="출신지" notice={PROFILE_TEXT.privacyNotice} />
            <SelectField
              value={regionText(hometown)}
              placeholder={PROFILE_TEXT.homeTownHint}
              onClick={() => setModal("hometown")}
            />
            <label className="mt-3 flex items-center justify-between">
              <span className="text-body-14 text-text-secondary">
                {PROFILE_TEXT.sameToResidence}
              </span>
              <input
                type="checkbox"
                checked={sameToResidence}
                onChange={(e) => toggleSameToResidence(e.target.checked)}
                className="h-5 w-5 accent-brand cursor-pointer"
              />
            </label>
          </div>
        </>
      )}

      {submitError && (
        <p className="text-caption-12 text-red">{submitError}</p>
      )}

      <div className="pt-2">
        <DeButtonLarge
          text={isModify ? PROFILE_TEXT.modifyBtn : PROFILE_TEXT.nextBtn}
          enable={isValid && !submitting}
          onPressed={handleSubmit}
        />
      </div>

      {/* 모달 */}
      {modal === "community" && (
        <CommunityPickerModal
          communities={displayedCommunities}
          currentId={community?.id ?? -1}
          searchValue={communitySearch}
          onSearchChange={handleCommunitySearch}
          loading={communityLoading}
          onConfirm={(c) => {
            setCommunity(c);
            setCommunitySearch("");
            setSearchResults([]);
            setModal(null);
          }}
          onClose={() => {
            setCommunitySearch("");
            setSearchResults([]);
            setModal(null);
          }}
        />
      )}

      {modal === "age" && (
        <AgePickerModal
          current={ageRange}
          onConfirm={(age) => {
            setAgeRange(age);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "residence" && (
        <LocationPickerModal
          title="거주지"
          initialProvinceCode={residence.provinceCode || undefined}
          initialDistrictCode={residence.districtCode || undefined}
          onConfirm={(s: LocationSelection) => {
            setResidence({
              provinceCode: s.provinceCode,
              districtCode: s.districtCode,
            });
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "hometown" && (
        <LocationPickerModal
          title="출신지"
          initialProvinceCode={hometown.provinceCode || undefined}
          initialDistrictCode={hometown.districtCode || undefined}
          onConfirm={(s: LocationSelection) => {
            setHometown({
              provinceCode: s.provinceCode,
              districtCode: s.districtCode,
            });
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

// ── 읽기전용 선택 필드 (탭 시 모달) ───────────────────
function SelectField({
  value,
  placeholder,
  onClick,
}: {
  value: string;
  placeholder: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 flex w-full items-center rounded-xl border border-border bg-surface-elevated px-4 py-3 text-left cursor-pointer"
    >
      <span
        className={
          value
            ? "text-body-16 text-text-primary"
            : "text-body-16 text-text-secondary"
        }
      >
        {value || placeholder}
      </span>
      <ChevronDown size={20} className="ml-auto text-text-secondary" />
    </button>
  );
}
