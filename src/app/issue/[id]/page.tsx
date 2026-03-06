"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchIssueDetail } from "@/lib/api/issue";
import { fromBase36, toSlug } from "@/lib/slug";
import useAuthStore from "@/store/useAuthStore";

/**
 * /issue/{id} 접근 시 → /issue/{id}/{slug} 로 리다이렉트.
 * API에서 제목을 가져와 slug를 생성한 뒤 replace.
 */
export default function IssueRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated || !id) return;

    fetchIssueDetail(fromBase36(id), accessToken)
      .then((data) => {
        router.replace(`/issue/${id}/${toSlug(data.title)}`);
      })
      .catch(() => {
        router.replace(`/issue/${id}/_`);
      });
  }, [_hasHydrated, accessToken, id, router]);

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="h-8 w-3/4 rounded bg-grey-90 animate-pulse" />
      <div className="flex gap-4">
        <div className="h-5 w-20 rounded bg-grey-90 animate-pulse" />
        <div className="h-5 w-20 rounded bg-grey-90 animate-pulse" />
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-grey-90 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
