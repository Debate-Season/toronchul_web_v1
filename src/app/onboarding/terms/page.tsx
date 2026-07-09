"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { agreeTerms, getTerms, type Terms } from "@/lib/api/terms";
import { TERMS_ITEMS } from "@/lib/profile/constants";
import { nextAfterLogin } from "@/lib/auth/postLoginRedirect";
import DeButtonLarge from "@/components/TDS/DeButtonLarge";

const LABEL_BY_TYPE: Record<string, string> = Object.fromEntries(
  TERMS_ITEMS.map((t) => [t.termsType, t.label]),
);

/** 신규 가입 온보딩 — 필수 약관 동의(POST /terms/agree). */
export default function OnboardingTermsPage() {
  const router = useRouter();
  const { accessToken, isLogin, _hasHydrated, profileStatus, setTermsStatus } =
    useAuthStore();

  const [terms, setTerms] = useState<Terms[] | null>(null);
  const [agreed, setAgreed] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isLogin) {
      router.replace("/login");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = await getTerms(accessToken);
        if (!cancelled) setTerms(data);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "약관을 불러오지 못했습니다.",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [_hasHydrated, isLogin, accessToken, router]);

  const allChecked =
    terms !== null && terms.length > 0 && terms.every((t) => agreed[t.termsId]);

  const toggleAll = (checked: boolean) => {
    if (!terms) return;
    const next: Record<number, boolean> = {};
    for (const t of terms) next[t.termsId] = checked;
    setAgreed(next);
  };

  const toggleOne = (termsId: number, checked: boolean) => {
    setAgreed((prev) => ({ ...prev, [termsId]: checked }));
  };

  const handleSubmit = async () => {
    if (!terms || !allChecked || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await agreeTerms(
        terms.map((t) => ({ termsId: t.termsId, agreed: true })),
        accessToken,
      );
      setTermsStatus(true);
      router.replace(nextAfterLogin(true, profileStatus ?? false));
    } catch (err) {
      setError(err instanceof Error ? err.message : "동의 처리에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <div className="py-4">
      <header className="px-5 pb-2">
        <h1 className="text-header-20 font-bold text-text-primary">약관 동의</h1>
      </header>

      <div className="flex flex-col gap-4 px-5 py-4">
        {!_hasHydrated || loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-12 w-full rounded-xl bg-grey-90 animate-pulse"
              />
            ))}
          </div>
        ) : error && !terms ? (
          <p className="py-10 text-center text-body-14 text-red">{error}</p>
        ) : (
          <>
            <label className="flex items-center gap-3 rounded-xl bg-surface-elevated px-4 py-3.5">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={(e) => toggleAll(e.target.checked)}
                className="h-5 w-5 accent-brand cursor-pointer"
              />
              <span className="text-body-16 font-semibold text-text-primary">
                약관 전체 동의
              </span>
            </label>

            <div className="flex flex-col">
              {terms?.map((t) => (
                <div key={t.termsId} className="flex items-center gap-3 py-3">
                  <input
                    type="checkbox"
                    checked={agreed[t.termsId] ?? false}
                    onChange={(e) => toggleOne(t.termsId, e.target.checked)}
                    className="h-5 w-5 accent-brand cursor-pointer"
                  />
                  <span className="text-body-14 text-text-secondary">
                    (필수) {LABEL_BY_TYPE[t.termsType] ?? t.termsType}
                  </span>
                  <a
                    href={t.notionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              ))}
            </div>

            {error && <p className="text-caption-12 text-red">{error}</p>}

            <div className="pt-4">
              <DeButtonLarge
                text="동의하고 계속하기"
                enable={allChecked && !submitting}
                onPressed={handleSubmit}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
