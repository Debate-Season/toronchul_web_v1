"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { getTermsAgree, type TermsMyAgree } from "@/lib/api/terms";
import { TERMS_ITEMS, POLICY_LINKS } from "@/lib/profile/constants";

/**
 * 정책 콘텐츠. 설정 메뉴 "정책"(/settings/policy).
 * 한 화면에 "약관 동의"(동의 내역 + 동의일)와 "서비스 정책"(정책 링크)을 함께 노출.
 */
export default function SettingsPolicyContent() {
  const router = useRouter();
  const { accessToken, isLogin, _hasHydrated } = useAuthStore();

  const [agreements, setAgreements] = useState<TermsMyAgree[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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
        setError(false);
        const data = await getTermsAgree(accessToken);
        if (!cancelled) setAgreements(data);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [_hasHydrated, isLogin, accessToken, router]);

  const agreedAtOf = (termsType: string): string => {
    const found = agreements?.find((a) => a.termsType === termsType);
    return found?.agreedAt ?? "";
  };

  return (
    <div className="flex flex-col gap-10 py-2">
      {/* 약관 동의 */}
      <section>
        <h2 className="mb-1 text-header-18 font-semibold text-text-primary">
          약관 동의
        </h2>
        {TERMS_ITEMS.map((item) => (
          <a
            key={item.termsType}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 py-3"
          >
            <span className="text-body-16 font-medium text-text-tertiary">
              {item.label}
            </span>
            <span className="ml-auto text-caption-12 text-text-secondary">
              {loading ? "..." : error ? "오류" : agreedAtOf(item.termsType)}
            </span>
            <ChevronRight size={18} className="text-text-secondary" />
          </a>
        ))}
      </section>

      {/* 서비스 정책 */}
      <section>
        <h2 className="mb-1 text-header-18 font-semibold text-text-primary">
          서비스 정책
        </h2>
        {POLICY_LINKS.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center py-3"
          >
            <span className="text-body-16 font-medium text-text-tertiary">
              {link.label}
            </span>
            <ChevronRight size={20} className="ml-auto text-text-secondary" />
          </a>
        ))}
      </section>
    </div>
  );
}
