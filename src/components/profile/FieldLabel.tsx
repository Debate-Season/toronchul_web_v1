interface FieldLabelProps {
  label: string;
  /** 필수 항목(빨간 별) */
  required?: boolean;
  /** 라벨 하단 안내문 */
  notice?: string;
}

/** 폼 필드 라벨(+필수 별 +안내문). 모바일 입력화면 라벨 미러. */
export default function FieldLabel({
  label,
  required = false,
  notice,
}: FieldLabelProps) {
  return (
    <div>
      <div className="flex items-center">
        <span className="text-body-14 font-semibold text-text-primary">
          {label}
        </span>
        {required && (
          <span className="text-body-14 font-semibold text-brand">*</span>
        )}
      </div>
      {notice && (
        <p className="mt-1 text-caption-12 text-text-secondary">{notice}</p>
      )}
    </div>
  );
}
