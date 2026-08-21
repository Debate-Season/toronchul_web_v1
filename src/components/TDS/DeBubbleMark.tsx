interface DeBubbleMarkProps {
  /** 말풍선 안에 넣을 짧은 문구. "404", "!" 처럼 한두 글자를 전제로 한다. */
  label: string;
  /** SVG gradient id 는 문서 전역이라 한 화면에 두 개가 뜨면 충돌한다. */
  gradientId: string;
  /**
   * viewBox(200x140) 기준 글자 크기. 기본값은 "404" 같은 세 글자에 맞춰져
   * 있어서 한 글자짜리 라벨은 키워야 말풍선에 비해 허전하지 않다.
   */
  fontSize?: number;
}

/**
 * 로고 모티프인 말풍선에 짧은 문구를 얹은 마크. 404·에러 화면의 헤더로 쓴다.
 *
 * 꼬리까지 한 도형이어야 그라데이션이 끊기지 않으므로 CSS 가 아니라 SVG path
 * 로 그린다. 문구도 같은 viewBox 안에 넣어야 도형과 함께 스케일된다 — 밖에서
 * absolute 로 얹으면 크기를 바꿀 때마다 위치를 다시 맞춰야 한다.
 *
 * 크기는 호출부가 정한다(`<div className="w-40">` 등으로 감싸면 된다).
 */
export default function DeBubbleMark({
  label,
  gradientId,
  fontSize = 52,
}: DeBubbleMarkProps) {
  return (
    <svg viewBox="0 0 200 140" className="w-full" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0.8">
          <stop offset="0%" stopColor="var(--color-image-red)" />
          <stop offset="50%" stopColor="var(--color-brand)" />
          <stop offset="100%" stopColor="var(--color-blue)" />
        </linearGradient>
      </defs>
      <path
        d="M20 0 H180 A20 20 0 0 1 200 20 V90 A20 20 0 0 1 180 110 H58 L0 140 V20 A20 20 0 0 1 20 0 Z"
        fill={`url(#${gradientId})`}
      />
      {/* 꼬리를 뺀 본체(0~110)의 중앙 */}
      <text
        x="100"
        y="55"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight="700"
        letterSpacing="-2"
        fill="var(--color-white)"
      >
        {label}
      </text>
    </svg>
  );
}
