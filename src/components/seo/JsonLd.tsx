/**
 * JSON-LD `<script>`. `<` 를 이스케이프해 데이터 안의 문자열이 스크립트를 닫지
 * 못하게 한다 (Next.js JSON-LD 가이드와 같은 방식).
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
