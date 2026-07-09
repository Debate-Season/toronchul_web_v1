"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import useAuthStore from "@/store/useAuthStore";
import { getTermsAgree, type TermsMyAgree } from "@/lib/api/terms";
import { TERMS_ITEMS } from "@/lib/profile/constants";
import ProfileRouteDialog from "@/components/profile/ProfileRouteDialog";

export default function ProfileTermsPage() {
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
    <ProfileRouteDialog title="약관 및 개인정보 처리 동의">
      <div className="pb-2">
        <p className="mb-2 text-header-18 font-semibold text-text-primary">
          필수 동의 내용
        </p>
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
              {loading
                ? "..."
                : error
                  ? "오류"
                  : agreedAtOf(item.termsType)}
            </span>
            <ChevronRight size={18} className="text-text-secondary" />
          </a>
        ))}
      </div>
    </ProfileRouteDialog>
  );
}
