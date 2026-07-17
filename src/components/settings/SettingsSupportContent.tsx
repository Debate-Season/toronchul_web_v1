import { ChevronRight } from "lucide-react";
import { KAKAO_CHANNEL_URL } from "@/lib/profile/constants";

/** 문의(고객센터) 콘텐츠. 설정 메뉴 "문의"(/settings/support). */
export default function SettingsSupportContent() {
  return (
    <div className="py-2">
      <h2 className="mb-1 text-header-18 font-semibold text-text-primary">
        고객 센터
      </h2>
      <a
        href={KAKAO_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center py-3"
      >
        <span className="text-body-16 font-medium text-text-tertiary">
          카카오 채널 문의하기
        </span>
        <ChevronRight size={20} className="ml-auto text-text-secondary" />
      </a>
    </div>
  );
}
