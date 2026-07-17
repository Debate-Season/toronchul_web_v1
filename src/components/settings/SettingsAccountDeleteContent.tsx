"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/useAuthStore";
import { withdraw } from "@/lib/api/profile";
import { WITHDRAW_TEXT } from "@/lib/profile/constants";
import DeConfirmDialog from "@/components/TDS/DeConfirmDialog";

/** 계정 삭제 콘텐츠. 설정 계정 하위(/settings/account/delete). 모달/전체 페이지 공용. */
export default function SettingsAccountDeleteContent() {
  const router = useRouter();
  const { accessToken, isLogin, _hasHydrated, logout } = useAuthStore();

  const [showDialog, setShowDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isLogin) router.replace("/login");
  }, [_hasHydrated, isLogin, router]);

  const handleDelete = async () => {
    setShowDialog(false);
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await withdraw(accessToken);
      logout();
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "계정 삭제에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-2">
      <section>
        <h2 className="mb-2 text-header-18 font-semibold text-text-primary">
          {WITHDRAW_TEXT.policyTitle}
        </h2>
      </section>

      <section>
        <h2 className="mb-2 text-header-18 font-semibold text-text-primary">
          {WITHDRAW_TEXT.procedureTitle}
        </h2>
        <p className="text-body-14 text-text-secondary">
          {WITHDRAW_TEXT.procedureDescription}
        </p>
        <p className="mt-3 text-body-14 text-red">{WITHDRAW_TEXT.warning}</p>
      </section>

      <section>
        <h2 className="mb-2 text-header-18 font-semibold text-text-primary">
          {WITHDRAW_TEXT.deletedInfoTitle}
        </h2>
        <p className="text-body-14 text-text-secondary">
          {WITHDRAW_TEXT.deletedInfoPart1}
          <span className="text-brand">{WITHDRAW_TEXT.deletedInfoPart2}</span>
          {WITHDRAW_TEXT.deletedInfoPart3}
        </p>
      </section>

      {error && <p className="text-caption-12 text-red">{error}</p>}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setShowDialog(true)}
          disabled={submitting}
          className="w-full rounded-xl bg-grey-80 py-3 text-body-16 font-medium text-text-primary transition-colors hover:bg-grey-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {WITHDRAW_TEXT.doneText}
        </button>
        <button
          type="button"
          onClick={() => router.replace("/settings/account")}
          disabled={submitting}
          className="w-full rounded-xl border border-border py-3 text-body-16 font-medium text-text-secondary transition-colors hover:bg-grey-90 disabled:cursor-not-allowed cursor-pointer"
        >
          돌아가기
        </button>
      </div>

      {showDialog && (
        <DeConfirmDialog
          title={WITHDRAW_TEXT.dialogTitle}
          description={WITHDRAW_TEXT.dialogDescription}
          doneText={WITHDRAW_TEXT.doneText}
          cancelText={WITHDRAW_TEXT.cancelText}
          tone="red"
          onDone={handleDelete}
          onCancel={() => setShowDialog(false)}
        />
      )}
    </div>
  );
}
