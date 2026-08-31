# BigValue SEO / GEO 구현 가이드 · 트러블슈팅 · 현황

> 이 문서는 **실제 코드 구현·파일 경로·트러블슈팅·배포 체크리스트·현재 진행 상태**를 다룬다. SEO/GEO의 개념·원칙·전략은 `docs/SEO-Strategy.md`를 본다.
>
> 기준일: 2026-04-23 · 대상: `https://bigvalue.ai` · 스택: Next.js 16 (App Router)

---

## 1. 현재 상태 스냅샷

| 영역 | 상태 | 비고 |
|:---|:---|:---|
| P0 필수 (robots 세분화, sitemap lastmod, metadataBase, robots 메타, Bing 인증) | **✅ 완료** | 2026-03-30 ~ 2026-03-31 |
| P1 중요 (JSON-LD 9종, 사이트맵 캐싱) | **✅ 완료** | 2026-03-31 |
| Canonical / metadataBase env 단일 출처 | **✅ 완료** | 46개 파일 리팩터 (2026-04-21) |
| SSG `__next_error__` 53개 (pSEO 허브) | **✅ 해결** | `generateStaticParams` 이중 인코딩 제거 |
| Delisted 사업자 sitemap 동기화 | **✅ 해결** | `isDelisted()` 필터 추가 |
| Thin Content 정책 — 경고 배너 전환 | **✅ 완료** | noindex에서 전환 (2026-04-21) |
| Dataset JSON-LD `description` 50자 규격 | **✅ 해결** | GSC 131건 에러 해소 |
| Metadata description 품질 (4건 확장) | **✅ 완료** | newsroom/use-case/policy/about-us |
| AI 봇 3계층 robots.txt | **✅ 완료** | 허용 11종 / 차단 9종 |
| 서버 OOM (sitemap-biz) | **✅ 해결** | ~600MB → ~15MB |
| **AWS WAF 검색/AI 봇 화이트리스트** | **🟡 진행 중** | GA 수집·크롤 저하 원인 의심 |
| staging 도메인 색인 차단 | **🔴 미완료** | robots 전체 Disallow 또는 WAF/Basic Auth |
| 모니터링 상시화 (WAF Logs Dashboard, GSC/Naver/Bing 알람) | **🟡 부분** | 알람 미연결 |
| 배포 SEO 체크리스트 자동화 / CI 가드 | **🔴 미완료** | 수동 체크 중 |
| Naver 전용 사이트맵 분리 | **🔴 미도입** | Naver 색인율 저조 시 검토 |

---

## 2. 파일 참조 인덱스

### 2.1 lib

| 경로 | 역할 |
|:---|:---|
| `src/lib/seo.ts` | `SITE_URL`, `SEO_DATA`, `buildMetadata`, `generateJsonLd`, `buildDatasetSchema`, `buildLocalBusinessSchema`, `buildBreadcrumbSchema`, `buildFAQSchema` |
| `src/lib/constants.ts` | `SITE_URL` re-export (`@/lib/seo`에서 가져와 재노출) |
| `src/lib/cafe-data.ts` | `getCafeDataDate`, `getSubwayDataDate`, `dongCache` (5분 TTL) |
| `src/lib/biz-data.ts` | `getBizProvinces`, `getBizDataDate`, 경량 매니페스트 로더 |
| `src/lib/delisted-biz.ts` | `isDelisted()` — 사업자 색인 제외 판정 |

### 2.2 app (루트 · 라우트 핸들러)

| 경로 | 역할 |
|:---|:---|
| `src/app/layout.tsx` | `metadataBase: new URL(SITE_URL)`, 기본 메타, 검증 태그, Organization JSON-LD, robots 메타 기본값 |
| `src/app/robots.ts` | robots.txt 생성 (봇별 규칙 + AI 3계층) |
| `src/app/sitemap.xml/route.ts` | 메인 사이트맵 (lastmod 데이터 소스 매핑 + 캐시 헤더 + Array.push+join) |
| `src/app/sitemap-index.xml/route.ts` | 사이트맵 인덱스 |
| `src/app/sitemap-biz/[id]/route.ts` | 사업자 페이지네이션 (매니페스트 + lazy + `isDelisted` 필터) |
| `src/app/feed.xml/route.ts` | RSS |
| `src/app/api/indexnow/route.ts` | IndexNow 제출 API (Bearer 인증) |
| `src/app/b4b8547e48c04bc98fb40ecf3ac67b9b.txt/route.ts` | IndexNow 키 검증 |
| `public/b4b8547e48c04bc98fb40ecf3ac67b9b.txt` | IndexNow 키 정적 파일 |
| `public/naver0114366d59d750cabb72ca16983ed642.html` | 네이버 소유 확인 |

### 2.3 components

| 경로 | 역할 |
|:---|:---|
| `src/components/JsonLd.tsx` | JSON-LD `<script>` 렌더러 |
| `src/components/CafeBreadcrumb.tsx` | 브레드크럼 UI + BreadcrumbList 스키마 |
| `src/components/FAQSection.tsx` | FAQ 아코디언 UI (FAQPage 스키마와 동기화) |
| `src/components/Analytics.tsx` | GA4 (`afterInteractive`) |

### 2.4 env

| 파일 | `NEXT_PUBLIC_SITE_URL` |
|:---|:---|
| `.env.production` | `https://bigvalue.ai` |
| `.env.staging` | `https://staging.bigvalue.ai` |
| `.env.local` | `http://localhost:3000` |

---

## 3. URL 라우트맵

### 3.1 정적
```
/                           Home
/about-us                   회사 소개
/pricing                    요금제
/policy                     정책
/lab                        Lab
```

### 3.2 Products
```
/products                   개요
/products/flow              Flow
/products/data-product      Data Product
/products/data-api          Data API
/products/ai-solution       AI Solution
```

### 3.3 Industry
```
/industry                   개요
/industry/finance           금융
/industry/retail            리테일
/industry/public            공공
/industry/b2b-crm           B2B CRM
/industry/contents          콘텐츠
```

### 3.4 Content
```
/signals, /signals/[slug]
/newsroom, /newsroom/[id]
/notice, /notice/[id]
/use-case, /use-case/[id]
```

### 3.5 Dashboard (pSEO)
```
/dashboard                                             허브
/dashboard/biz                                         사업자 허브
/dashboard/biz/[slug]                                  시도 or 개별 (LocalBusiness)
/dashboard/cafe-market                                 카페 매출 허브
/dashboard/cafe-market/[sido]
/dashboard/cafe-market/[sido]/[sigungu]
/dashboard/cafe-market/[sido]/[sigungu]/[dong]         동 상세 (Dataset + FAQPage)
/dashboard/cafe-subway                                 카페 역세권 허브
/dashboard/cafe-subway/[line]
/dashboard/cafe-subway/[line]/[station]                역 상세 (Dataset + FAQPage)
```

---

## 4. 메타데이터 구현

### 4.1 중앙 레지스트리 — `src/lib/seo.ts`

```typescript
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bigvalue.ai";

interface SEOData {
  title: string;
  description: string;           // 최소 50자, 권장 120~155자
  keywords: string[];
  canonical: string;             // ★ 상대 경로 ("/products/flow")
  ogImage?: string;              // ★ 상대 경로 ("/images/og/og-light.png")
  jsonLdType: "WebPage" | "CollectionPage" | "Product" | "Article";
  h1: string;
  lastmod: string;
  publishedAt?: string;
  author?: string;
  articleSection?: string;
  articleTags?: string[];
}

export const SEO_DATA = {
  home:    { canonical: "/",              /* ... */ },
  flow:    { canonical: "/products/flow", /* ... */ },
  // 21개+ 페이지 등록
};
```

### 4.2 영역별 canonical/URL 형식

| 영역 | 형식 | 이유 |
|:---|:---|:---|
| `Metadata.alternates.canonical` | **상대** `"/products/flow"` | metadataBase가 자동 절대화 |
| `Metadata.openGraph.url` | **상대** | 동일 |
| `Metadata.openGraph.images[].url` | **상대** | 동일 |
| 렌더링 결과 `<link rel="canonical">` | **절대** | Next.js 자동 변환 |
| JSON-LD `@id`, `url`, `mainEntityOfPage`, `BreadcrumbList.item` | **절대** | 스펙 필수 |
| `sitemap.xml` `<loc>`, `feed.xml` `<link>`, `robots.txt` `Sitemap:` | **절대** | 각 스펙 필수 |

### 4.3 정적 페이지 패턴

```typescript
// src/app/products/flow/page.tsx
import { buildMetadata, SEO_DATA } from "@/lib/seo";

export const metadata = buildMetadata(SEO_DATA.flow);
// ❌ 금지: { ...SEO_DATA.flow, canonical: `${SITE_URL}/products/flow` }
```

### 4.4 동적 페이지 패턴

```typescript
export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = await fetchArticle(id);
  return buildMetadata({
    title: data.title,
    description: data.summary,
    canonical: `/newsroom/${id}`,          // 상대
    openGraph: { url: `/newsroom/${id}` }, // 상대
    ogImage: data.thumbnail,                // 상대
  });
}

// JSON-LD 생성부 (절대 URL 필수)
const schemas = [{
  "@type": "Article",
  "@id": `${SITE_URL}/newsroom/${id}`,
  mainEntityOfPage: `${SITE_URL}/newsroom/${id}`,
  datePublished: data.publishedAt,
  dateModified: data.updatedAt,
  author: { "@type": "Organization", name: "BigValue" },
}];
```

### 4.5 루트 레이아웃

```typescript
// src/app/layout.tsx
import { SITE_URL } from "@/lib/seo";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { template: "%s | BigValue", default: "BigValue" },
  robots: {
    index: true,
    follow: true,
    googleBot: { "max-image-preview": "large", "max-snippet": -1 },
  },
  verification: {
    google: "h_rbm3923NH-U_WDuRpyFaY6L2M1yijgF_4m-mbuVaI",
    other: {
      "naver-site-verification": "10ac439b5132501c0f320d18fc4472c74aa7083d",
      "msvalidate.01": process.env.BING_SITE_VERIFICATION,
    },
  },
  openGraph: { locale: "ko_KR", siteName: "BigValue", type: "website" },
  twitter: { card: "summary_large_image" },
};
```

### 4.6 title / description 작성 규칙

**title**:
- 55~60자 이내, 핵심 키워드 앞 배치
- 각 페이지 고유, 브랜드명은 뒤에 `| BigValue`
- pSEO 계층:
  - 시도: `{시도} 카페 매출 분석 | BigValue`
  - 시군구: `{시군구} 카페 매출 분석 | BigValue`
  - 동: `{동} 카페 월평균 {수치}만원 | BigValue` ← **수치 포함 CTR↑**
  - 사업자: `{상호} {동} {업종} 정보 | BigValue`

**description**:
- **최소 50자** (짧으면 스니펫 활용도·CTR·AI 인용률 저하)
- **권장 120~155자** (데스크톱 스니펫 최대 활용)
- title과 중복 지양, 실제 데이터 수치 포함, CTA 포함
- 띄어쓰기 정확 (`금융 IT`, `유통·물류`)
- **줄바꿈 `\n` 금지** (UI 카드 컨텐츠에만 허용)

---

## 5. JSON-LD 구현

### 5.1 빌더 함수 구조

```typescript
// src/lib/seo.ts
export function generateJsonLd(data: SEOData, breadcrumbs?: BreadcrumbItem[]): object[]
export function buildDatasetSchema(params): object
export function buildFAQSchema(questions: FAQ[]): object
export function buildLocalBusinessSchema(biz): object
export function buildBreadcrumbSchema(items: BreadcrumbItem[]): object
```

### 5.2 Dataset 스키마 예시 (카페 매출 동)

```typescript
const isLowSample = data.cafeCount < 5;
const datasetDescription = isLowSample
  ? `${region} 카페 ${N}개의 월 평균 매출, 중간값 매출, 평균 영업기간, 연령·성별·시간대·요일별 이용 분포를 포함한 카드 결제 기반 상권 분석 데이터셋입니다. 표본이 작아 통계 해석에 유의가 필요합니다. 기준월 ${date}.`
  : `${region} 카페 ${N}개의 월 평균 매출, 중간값 매출, 평균 영업기간, 연령·성별·시간대·요일별 이용 분포를 포함한 카드 결제 기반 상권 분석 데이터셋입니다. 기준월 ${date}.`;
// 50자 이상 자동 보장 (Google Dataset 요구사항)

const schema = {
  "@context": "https://schema.org",
  "@type": "Dataset",
  name: `${region} 카페 매출 분석`,
  description: datasetDescription,
  url: `${SITE_URL}/dashboard/cafe-market/${sido}/${sigungu}/${dong}`,
  dateModified: CafeIndex.generatedAt,
  creator: { "@type": "Organization", name: "BigValue", url: SITE_URL },
  license: `${SITE_URL}/policy`,
  variableMeasured: ["카페 수", "평균 월 매출", "중간값 월 매출", "평균 영업기간"],
  measurementTechnique: "실제 카드 매출 데이터 집계",
  spatialCoverage: { "@type": "Place", name: `${sido} ${sigungu} ${dong}` },
};
```

### 5.3 FAQPage — 자동 생성 + UI 동기화

데이터 기반으로 FAQ를 자동 생성하고, **`FAQSection.tsx` 아코디언 UI와 반드시 동시 렌더**. 화면에 FAQ가 없으면 Google은 FAQPage 스키마를 무시한다.

| Q 패턴 | A 패턴 | 소스 |
|:---|:---|:---|
| `{동}에 카페가 몇 개 있나요?` | `총 {cafeCount}개 운영 중입니다.` | `cafeCount` |
| `{동} 카페 평균 매출은?` | `월 평균 {avgRevenue}만원, 중간값 {median}만원입니다.` | `avgRevenue`, `medianRevenue` |
| `{동} 카페 평균 영업기간은?` | `약 {avgOperatingPeriod}년입니다.` | `avgOperatingPeriod` |

### 5.4 LocalBusiness 스키마 (사업자 개별)

```typescript
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",  // 또는 CafeOrCoffeeShop 등 구체 타입
  name: basic.companyName,
  address: {
    "@type": "PostalAddress",
    streetAddress: location.roadNameAddress,
    addressCountry: "KR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: location.latitude,
    longitude: location.longitude,
  },
  foundingDate: basic.openDate,
  isicV4: `${industry.large} > ${industry.middle} > ${industry.small}`,
  numberOfEmployees: basic.nationalPensionWorkerCount,
  // ⚠️ sales.annualExpectedSale은 마스킹 처리되므로 제외
}
```

### 5.5 Organization 보강 (GEO 핵심)

```typescript
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}#organization`,
  name: "BigValue",
  alternateName: "빅밸류",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/images/logo/footerLogo.png`,
  },
  description: "데이터로 판단의 기준을 만듭니다",
  sameAs: [
    "https://blog.naver.com/bigvalue",
    "https://www.linkedin.com/company/bigvalue-co",
    // ...
  ],
}
```

### 5.6 검증

배포 전 반드시:
- **Rich Results Test** — https://search.google.com/test/rich-results
- **Schema.org Validator** — https://validator.schema.org

---

## 6. 사이트맵 구현

### 6.1 lastmod 데이터 소스 매핑

```typescript
// src/lib/cafe-data.ts
export async function getCafeDataDate(): Promise<string> {
  const index = await loadCafeIndex();
  return index.generatedAt; // YYYY-MM-DD
}

export async function getSubwayDataDate(): Promise<string> {
  const index = await loadSubwayIndex();
  return index.data_date;
}

// src/lib/biz-data.ts
export async function getBizDataDate(): Promise<string> {
  const index = await loadBizIndex();
  // bizYm과 cardSaleYm 중 최신을 ISO로 변환
  return toIsoDate(max(index.bizYm, index.cardSaleYm));
}
```

| 페이지 | lastmod 소스 |
|:---|:---|
| 정적 | `STATIC_LAST_MODIFIED` (고정) |
| 카페 매출 | `CafeIndex.generatedAt` |
| 카페 역세권 | `SubwayIndex.data_date` |
| 사업자 시도/시군구/개별 | `max(bizYm, cardSaleYm)` |
| Signals | `publishedAt` |

### 6.2 OOM 방지 — Array.push + join

```typescript
// ❌ 금지 (요청당 ~200MB 누적)
let xml = '<?xml version="1.0"?>\n<urlset>';
for (const url of urls) xml += `<url><loc>${url}</loc>...</url>`;

// ✅ 권장 (요청당 ~5MB)
const parts: string[] = ['<?xml version="1.0"?>', '<urlset xmlns="...">'];
for (const url of urls) parts.push(`<url><loc>${url}</loc>...</url>`);
parts.push('</urlset>');
return parts.join('\n');
```

### 6.3 사업자 사이트맵 lazy 로딩

```typescript
// src/app/sitemap-biz/[id]/route.ts
import { isDelisted } from "@/lib/delisted-biz";
import { SITE_URL } from "@/lib/seo";

const PAGE_SIZE = 40_000;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id } = await params;
  const page = Number(id);

  // 전량 로딩 금지 — 경량 매니페스트(파일경로+건수) + 요청 페이지 파일만
  const manifest = await loadBizManifest();   // ~15KB 캐시
  const slice = await loadBizSlice(manifest, page, PAGE_SIZE); // 1~3 파일만

  const parts: string[] = ['<?xml version="1.0"?>', '<urlset xmlns="...">'];
  for (const biz of slice) {
    if (isDelisted(biz)) continue;  // ★ noindex와 동기화
    parts.push(`<url><loc>${SITE_URL}/dashboard/biz/${encodeURIComponent(biz.bizNo)}</loc><lastmod>${biz.lastmod}</lastmod><priority>0.5</priority></url>`);
  }
  parts.push('</urlset>');

  return new Response(parts.join('\n'), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
```

### 6.4 캐시 헤더 (모든 사이트맵 공통)

```
Content-Type: application/xml; charset=utf-8
Cache-Control: public, max-age=86400, s-maxage=86400
```

### 6.5 배포 시 파일 분리 안전 순서

신규 사이트맵 추가 · 기존 분할 시:
1. 신규 파일 route 생성
2. `sitemap-index.xml/route.ts`에 신규 파일 추가
3. Google 인식 대기 (수일)
4. 기존 파일에서 해당 URL 제거

---

## 7. robots.txt 구현

### 7.1 파일 구조

```typescript
// src/app/robots.ts
import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/_next/", "/*?*", "/admin", "/credentials/"] },
      { userAgent: "Googlebot", allow: "/" },
      { userAgent: "Bingbot", allow: "/", crawlDelay: 1 },
      { userAgent: "Yeti", allow: "/", crawlDelay: 1 },
      { userAgent: "NaverBot", allow: "/", crawlDelay: 1 },
      { userAgent: "Daumoa", allow: "/" },
      { userAgent: "AdsBot-Google", disallow: "/" },
      // AI 검색 봇 허용 11종
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "ChatGPT-User", allow: "/" },
      { userAgent: "Claude-SearchBot", allow: "/" },
      { userAgent: "Claude-User", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
      { userAgent: "Applebot-Extended", allow: "/" },
      { userAgent: "Meta-WebIndexer", allow: "/" },
      { userAgent: "DuckAssistBot", allow: "/" },
      { userAgent: "YouBot", allow: "/" },
      { userAgent: "MistralAI-User", allow: "/" },
      // AI 학습 봇 차단 9종
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "ClaudeBot", disallow: "/" },
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "Bytespider", disallow: "/" },
      { userAgent: "meta-externalagent", disallow: "/" },
      { userAgent: "DeepSeekBot", disallow: "/" },
      { userAgent: "cohere-ai", disallow: "/" },
      { userAgent: "Diffbot", disallow: "/" },
      { userAgent: "AI2Bot", disallow: "/" },
      // 소셜 봇 허용
      { userAgent: "facebot", allow: "/" },
      { userAgent: "Twitterbot", allow: "/" },
      { userAgent: "kakaotalk-scrap", allow: "/" },
    ],
    sitemap: `${SITE_URL}/sitemap-index.xml`,
  };
}
```

### 7.2 주석 전제

`robots.ts` 상단 주석: *"봇 차단/Rate Limit은 AWS WAF Bot Control 담당"*. 이 전제가 깨지면(WAF가 Yeti 등을 차단하면) robots 허용은 무의미 — §10 WAF 섹션 참조.

---

## 8. IndexNow 구현

### 8.1 구성

| 항목 | 값 |
|:---|:---|
| 엔드포인트 | `POST /api/indexnow` |
| 인증 | Bearer (`INDEXNOW_SECRET`) |
| 키 | `b4b8547e48c04bc98fb40ecf3ac67b9b` |
| 검증 Route | `src/app/b4b8547e48c04bc98fb40ecf3ac67b9b.txt/route.ts` |
| 검증 정적 파일 | `public/b4b8547e48c04bc98fb40ecf3ac67b9b.txt` |
| 대상 | `https://api.indexnow.org/IndexNow` |
| **배치 크기** | 1회 최대 **10,000 URL** — 초과 시 자동 분할 호출 |

### 8.2 호출 규칙

- ✅ 신규 읍면동 페이지, 월 데이터 갱신 변경분, Signals 신규
- ❌ 사업자 2,000만 전량 재제출 (비효율)
- ❌ UI 변경만 (무의미)
- ❌ 1분 내 수백 회 (스팸 판정)

```bash
curl -X POST https://bigvalue.ai/api/indexnow \
  -H "Authorization: Bearer $INDEXNOW_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"urlList": ["https://bigvalue.ai/signals/new-article"]}'
```

---

## 9. Thin Content 경고 배너 구현

### 9.1 페이지 구현 (카페 매출 동)

```tsx
// src/app/dashboard/cafe-market/[sido]/[sigungu]/[dong]/page.tsx
const isLowSample = data.cafeCount < 5;

{isLowSample && (
  <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-[0.8rem] p-[1.6rem] mb-[2.4rem]">
    <h2 className="text-sizeM font-semibold text-amber-900 mb-[0.4rem]">
      통계 해석 유의 안내
    </h2>
    <p className="text-sizeS text-amber-800 leading-[1.7]">
      이 지역의 카페 수는 <strong>{data.cafeCount}개</strong>로 표본이 작아
      평균·중간값 지표의 <strong>통계적 신뢰도가 제한</strong>됩니다.
      특정 매장 한 곳의 매출이 전체 평균에 큰 영향을 줄 수 있으므로,
      보다 안정적인 상권 분석은 상위 지역인{" "}
      <a href={parentUrl}>{parentName}</a> 단위 데이터를 함께 참고하세요.
    </p>
  </div>
)}
```

### 9.2 Dataset description 동기화

위 `§5.2` 참조 — `description`에 본문 배너와 동일한 "표본이 작아 통계 해석에 유의가 필요합니다" 문구를 일관되게 포함.

### 9.3 sitemap 제외 금지

```typescript
// src/app/sitemap.xml/route.ts
for (const dong of dongs) {
  // ❌ 금지: if (dong.cafeCount < 5) continue;
  // 표본이 작아도 색인 대상 — 경고 배너로 투명성 제공
  parts.push(`<url><loc>...</loc></url>`);
}
```

### 9.4 예외 — delisted 사업자 (개인정보)

```typescript
// src/app/dashboard/biz/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const { slug } = await params;
  if (isDelisted(slug)) {
    return { robots: { index: false, follow: false } };
  }
  // ...
}

// src/app/sitemap-biz/[id]/route.ts — 동기화 필수
if (isDelisted(biz)) continue;
```

---

## 10. AWS WAF 연동 & 트러블슈팅

### 10.1 현재 증상 (2026-04-21 관찰)

- GA4 이벤트/트래픽 수집량 감소
- 검색엔진 인덱싱·크롤링 저하
- 실측: IndexNow 키 파일(`b4b8...b9b.txt`) 403 사례

> 구조적 전제: WAF는 `bigvalue.ai` 인바운드만 검사. GA4 `/collect`는 브라우저 → `google-analytics.com` 직접 송신이라 WAF 중간 차단 불가. GA 저하는 "페이지 미렌더링 → gtag 미초기화" 간접 경로.

### 10.2 SEO 저하 6대 가설

| # | 가설 | 영향 |
|:---|:---|:---|
| 10-2-1 [최유력] | Bot Control이 Yeti/NaverBot/Daumoa/Claude-*/OAI-*/PerplexityBot/kakaotalk-scrap 등을 Verified 목록 외로 차단 | Naver/Daum 색인 중단, AI 인용 제외, OG 미리보기 실패 |
| 10-2-2 [유력] | Reverse-DNS 실패로 정상 Googlebot 차단 (CloudFront→ALB 프록시 교체, X-Forwarded-For 미참조, 신규 IP 전파 지연) | GSC 호스트 상태 불량, 5xx 증가 |
| 10-2-3 [유력] | Rate-based Rule에 sitemap-biz 대량 크롤 걸림 (분당 수백 요청) | 크롤 버짓 자동 감소 |
| 10-2-4 [가능] | Challenge/CAPTCHA로 봇이 챌린지 HTML 인덱싱 → soft-404 평가 | 기존 색인 순위 급락 |
| 10-2-5 [부수] | robots.txt / sitemap 자체 5xx/403 (WAF idle timeout 30s 포함) | 색인 전체 중단 |
| 10-2-6 [부수] | Common Rule Set XSS/LFI 오탐으로 `/api/indexnow` body 차단 | IndexNow 재제출 실패 |

### 10.3 GA4 저하 4대 가설

| # | 가설 |
|:---|:---|
| 10-3-1 [최유력] | WAF가 정상 방문자 오탐 차단 → 페이지 미렌더링 → `Analytics.tsx` 미마운트 → gtag 미초기화 |
| 10-3-2 [유력] | Challenge/CAPTCHA 리다이렉트 중 utm/gclid/referrer 손실 → 채널 귀속 오류. Safari ITP/Incognito 영구 차단 가능 |
| 10-3-3 [가능] | `/api/indexnow` 차단 → Signals 색인 지연 → GA에서 Signals 유입 감소 (간접) |
| 10-3-4 [낮음] | CloudFront Response Headers Policy CSP 주입 시 `*.googletagmanager.com`, `*.google-analytics.com` 누락 |

### 10.4 진단 체크

```bash
# 1) 국내/AI 봇 UA 접근
curl -A "Yeti" -I https://bigvalue.ai/                              # 200 기대
curl -A "Yeti" -I https://bigvalue.ai/robots.txt
curl -A "Yeti" -I https://bigvalue.ai/sitemap-index.xml

# 2) Googlebot UA 대용량 sitemap
curl -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" \
     -I https://bigvalue.ai/sitemap-biz/1

# 3) IndexNow 키 파일
curl -I https://bigvalue.ai/b4b8547e48c04bc98fb40ecf3ac67b9b.txt

# 4) 응답 헤더 CSP/Challenge 여부
curl -I https://bigvalue.ai/ | grep -i -E "content-security-policy|x-amzn-waf|set-cookie"
```

200이 아니거나 `x-amzn-waf-*` 헤더가 붙으면 WAF 관여 중.

### 10.5 WAF Logs Athena 쿼리

```sql
SELECT
  httprequest.uri,
  httprequest.headers['user-agent'] AS ua,
  action,
  terminatingRuleId,
  COUNT(*) AS cnt
FROM waf_logs
WHERE action IN ('BLOCK', 'CHALLENGE', 'CAPTCHA')
  AND from_unixtime(timestamp / 1000) > current_timestamp - interval '7' day
GROUP BY 1, 2, 3, 4
ORDER BY 5 DESC
LIMIT 100;
```

User-Agent에 `Googlebot`, `bingbot`, `Yeti`, `NaverBot`, `Daumoa`, `PerplexityBot`, `OAI-SearchBot`, `facebookexternalhit`, `kakaotalk-scrap`가 포함된 Block/Challenge 유무 확인.

### 10.6 P0 조치 — 검색/AI 봇 화이트리스트

1. **IP Set 생성** (WAF ACL priority 0~10에 Allow 배치):
   - Googlebot: https://developers.google.com/search/apis/ipranges/googlebot.json
   - Google-Extended / special-crawlers
   - Bingbot: https://www.bing.com/toolbox/bingbot.json
   - DuckDuckBot: https://duckduckgo.com/duckduckbot.json
   - OpenAI, Perplexity, Anthropic (각 사 공식 IP 범위)
   - Naver Yeti (네이버 서치어드바이저 공지)
   - Applebot: https://search.developer.apple.com/applebot.json
2. **Bot Control 카테고리 오버라이드**:
   - `CategorySearchEngine`, `CategorySocialMedia`, `CategoryMonitoring` → **Count** (로깅만)
   - `CategoryScraper`, `CategoryContentFetcher`, `CategoryHttpLibrary` → Block 유지
   - `SignalNonBrowserUserAgent` → Count 후 오탐 분석
3. **Rate-based Scope Down** — `/robots.txt`, `/sitemap*.xml`, `/sitemap-biz/*`, `/feed.xml`, `/*.txt` 제외. 검증 봇 IP Set은 rate limit 완화.

### 10.7 P1 조치

- Challenge/CAPTCHA는 **계정 탈취 방지 고위험 경로에만**. 일반 페이지는 Block 통일 또는 명시적 제외.
- Challenge 불가피 시 제외: `/`, `/signals/*`, `/products/*`, `/industry/*`, `/use-case/*`, `/newsroom/*`, `/dashboard/*`, `robots`, `sitemap*`
- CSP — `script-src`, `connect-src`, `img-src`에 `https://www.googletagmanager.com`, `https://www.google-analytics.com`, `https://*.analytics.google.com` 허용

### 10.8 복구 후 재색인

1. GSC "사이트맵" → `sitemap-index.xml` 재제출
2. 주요 URL "색인 등록 요청" 재실행
3. `POST /api/indexnow` 재제출
4. Naver Search Advisor, Bing Webmaster 동일 재제출

> **참고**: 사이트맵 재제출 ≠ 크롤 큐 초기화. lastmod 변경분만 재크롤, 기존 ~700만 URL 크롤 스케줄은 보존.

---

## 11. 트러블슈팅 이력

### 11.1 SSG `__next_error__` — pSEO 허브 53개 (2026-04-21, `8a74113`)

**증상**: `/dashboard/cafe-market/[sido]` 17개 + `/dashboard/cafe-subway/[line]` 36개 = 53개가 `<html id="__next_error__">` 상태. `<meta name="robots" content="noindex">` 자동 삽입되어 색인 제외.

**원인**: `generateStaticParams`에서 `encodeURIComponent(name)` 반환 → Next.js가 자동으로 한 번 더 인코딩 → default export가 `provinces.find(p => p.name === sido)`에서 실패 → `notFound()`.

**해결**:
```diff
  export async function generateStaticParams() {
    const provinces = await getProvinces();
-   return provinces.map((p) => ({ sido: encodeURIComponent(p.name) }));
+   return provinces.map((p) => ({ sido: p.name }));
  }
```

**재발 방지 원칙**:
- MUST: raw 값(한글 그대로) 반환
- MUST NOT: `encodeURIComponent()` 수동 인코딩

### 11.2 Delisted 사업자 sitemap 누락 (2026-04-21, `8a74113`)

**증상**: `/dashboard/biz/[slug]` 에서 `isDelisted(slug)` 시 `noindex`가 걸려 있으나 `sitemap-biz/[id]/route.ts`가 해당 URL을 계속 포함 → "크롤하라 + 색인하지 마라" 모순 신호.

**해결**: sitemap-biz 생성 루프에 `isDelisted` 필터 추가 (§6.3 코드 참조).

**재발 방지**: noindex ↔ sitemap 동기화 원칙을 PR 단위 강제.

### 11.3 Dataset JSON-LD description 길이 미달 (2026-04-21, `bcde108`)

**증상**: GSC 데이터세트 리포트에서 cafe-market 131개 페이지 "유효하지 않음". 에러 메시지: `"지원되는 문자열 길이: [50, 5000]"`.

**원인**: 기존 description 약 35자. 예: `"경기도 수원시 영통구 매탄1동 카페 18개의 매출·영업기간 데이터"`

**해결**: 측정 지표·기준을 substantive하게 기술하여 50자 이상 보장 (§5.2 코드). 저표본/정상 분기 모두 [50, 5000] 범위 내.

**재발 방지**: 신규 JSON-LD 스키마 도입 시 Google 공식 required/recommended 속성 사전 확인. padding 금지.

### 11.4 Metadata description 품질 개선 (2026-04-21, `bcde108`)

4건 확장:

| 페이지 | Before | After |
|:---|:---:|:---:|
| `newsroom` | 25자 | 102자 |
| `use-case` | 34자 | 101자 |
| `policy` | 13자 | 107자 |
| `about-us` | 63자 | 115자 (`금융IT→금융 IT`, `유통물류→유통·물류` 정정 포함) |

**재발 방지**: 최소 50자 규칙, 권장 120~155자.

### 11.5 서버 OOM — sitemap-biz 740만건 전량 로딩

**증상**: V8 `NewFromUtf8`, `StringDecoder::DecodeData` 크래시로 503 주기 발생.

**원인별 조치**:

| 원인 | 조치 | 효과 |
|:---|:---|:---|
| `getAllBizNumbers()` 740만 전량 적재 (~100MB 상주) | 매니페스트(~15KB) + 페이지별 lazy 로딩 | 상주 100MB → 15KB |
| XML 빌드 `string +=` (요청당 ~200MB) | `Array.push()` + `.join('\n')` | 요청당 200MB → 수 MB |
| `dong.json` 6.3MB 영구 캐시 | 5분 TTL | 유휴 시 해제 |
| 크롤러 동시 요청 캐시 미스 동시 파싱 | TTL + lazy 조합 | 피크 완화 |
| `biz-index.totalBiz` vs district 실제 합산 불일치 | `totalPages` 산정 기준을 district 실제 합산(7,254,109)으로 | 빈 페이지 4개 제거 |

**결과**: 피크 ~600MB+ → ~15MB (97%+ 감소)

### 11.6 Thin Content 정책 전환 (2026-04-21, `bcde108`)

**Before** (2026-04-02): 카페 < 5 동 페이지 `robots: { index: false, follow: true }` + sitemap 제외 → 5,197개(51.4%) noindex

**After** (2026-04-21): 색인 허용 + 본문 경고 배너 + Dataset description 동기화

**전환 이유**: 월 단위 데이터 갱신에서 임계값 경계 동의 색인 플래핑, 롱테일 검색 포착 실패, GSC "Discovered - currently not indexed" 증가 리스크.

### 11.7 Canonical/metadataBase 리팩터 (2026-04-21, `590225a`)

46개 파일 — `NEXT_PUBLIC_SITE_URL` env 도입, 정적 20개 + 동적 8개 페이지의 `{ ...SEO_DATA, canonical: ... }` 덮어쓰기 패턴 제거, sitemap/feed/robots route의 로컬 `const SITE_URL` 제거, `buildMetadata`의 `resolvedOgImage` 조립 로직 제거.

---

## 12. 배포 체크리스트

### 12.1 배포 전

- [ ] JSON 데이터(`CafeIndex`, `SubwayIndex`, `BizIndex`) 갱신일 확인 → lastmod 반영 확인
- [ ] 신규/삭제 URL과 sitemap 생성 로직 동기화 (특히 noindex ↔ sitemap)
- [ ] 신규 JSON-LD 스키마가 있다면 Rich Results Test 통과
- [ ] OG 이미지 미리보기 (Facebook/Kakao/Slack debugger)
- [ ] `npx tsc --noEmit` 통과
- [ ] 빌드 산출물에 `__next_error__` 0건 (`grep -r __next_error__ .next/server/app/`)
- [ ] canonical 하드코딩 회귀 0건 (`grep -rE 'canonical.*https://[a-z]' .next/server/app/`)

### 12.2 배포 직후

- [ ] `curl -I` 로 주요 URL 200 확인 (UA별: 일반 / Googlebot / Yeti)
- [ ] robots.txt, sitemap-index.xml 응답 확인
- [ ] GSC URL 검사 (샘플 5~10개)
- [ ] IndexNow로 변경/신규 URL 제출
- [ ] Naver Search Advisor, Bing Webmaster 사이트맵 재제출

### 12.3 배포 후 1주

- [ ] GSC Coverage 급변 여부 (급증/급감 둘 다 이상 신호)
- [ ] GSC Crawl Stats 응답 시간 / 호스트 상태
- [ ] WAF Logs에서 검색 봇 Block 건수
- [ ] 홈 canonical trailing slash 등 특이 패턴 모니터링

### 12.4 월 1회

- [ ] 색인율 계산 (색인 / 사이트맵 제출)
- [ ] Thin Content / Quality Gate 재평가
- [ ] 구조화 데이터 리치 결과 에러 0 유지
- [ ] WAF Managed Rule 업데이트에 따른 검색 봇 차단 회귀 테스트

### 12.5 CI 가드 (권장 추가)

```bash
# canonical 하드코딩 회귀 방지
npm run build:prod \
  && ! grep -rE 'canonical.*https://[a-z]' .next/server/app/

# SEO_DATA 상대 경로 유지
! grep -E 'canonical:\s*`?\$\{SITE_URL' src/lib/seo.ts

# SSG 에러 페이지 0건
! grep -r __next_error__ .next/server/app/
```

---

## 13. 코딩 원칙 (MUST / MUST NOT)

### 13.1 Canonical / metadataBase — MUST

1. 도메인은 `NEXT_PUBLIC_SITE_URL` env만 단일 출처 (코드 리터럴 금지)
2. 페이지 Metadata의 `alternates.canonical`, `openGraph.url`은 **상대 경로**
3. OG 이미지 경로도 상대 경로 권장
4. JSON-LD 내부 URL은 **절대 URL 필수** (`${SITE_URL}${path}`)

### 13.2 Canonical / metadataBase — MUST NOT

1. 새 페이지에 `` canonical: `${SITE_URL}/path` `` 작성 금지
2. `SEO_DATA[x]`의 canonical을 페이지에서 동일 값으로 덮어쓰기 금지
3. 다른 lib/route 파일에 `const SITE_URL = "..."` 로컬 선언 금지
4. `layout.tsx`의 `metadataBase`를 하드코딩으로 되돌리지 말 것

### 13.3 SSG — MUST / MUST NOT

- MUST: `generateStaticParams`에서 raw 값 반환
- MUST NOT: `encodeURIComponent()` 수동 반환 (이중 인코딩 → `__next_error__`)

### 13.4 noindex ↔ sitemap 동기화

- `robots: { index: false }` 적용 시 해당 sitemap 생성 로직에 동일 필터 **동시 추가**
- 데이터 대시보드 Quality Gate 기본은 **색인 허용 + 경고 배너** (플래핑/롱테일 리스크)

### 13.5 JSON-LD 규격

- `Dataset.description`: 데이터 기반 50자 이상 (padding 금지)
- FAQPage는 화면 FAQ UI와 반드시 동시 렌더
- 신규 스키마 추가 시 Google 공식 요구사항 사전 확인

### 13.6 description / 메타 품질

- 최소 50자, 권장 120~155자
- title과 중복 지양, 구체 수치/기능/차별점 포함
- 띄어쓰기 정확, 줄바꿈 `\n` 금지

### 13.7 IndexNow

- 신규/변경분만 제출, 전량 재제출 금지, 1분 내 수백 회 금지, 10,000 URL 단위로 분할

### 13.8 사이트맵

- `new Date()` 금지 — 데이터 소스 실제 갱신일 매핑
- 문자열 누적 금지 — `Array.push()` + `.join('\n')`
- 사업자 전량 메모리 로딩 금지 — 매니페스트 + lazy
- 파일명(URL) 변경 금지 — Google이 파일 URL을 기억함

---

## 14. 변경 이력

| 일자 | 커밋 | 영역 |
|:---|:---|:---|
| 2026-03-30 | 초기 P0 패치 | robots.txt 세분화 / metadataBase / Bing 인증 / robots 메타 |
| 2026-03-31 | sitemap lastmod + JSON-LD 확장 + 캐싱 헤더 | `sitemap.ts` → `sitemap.xml/route.ts` 전환, Dataset/FAQPage/LocalBusiness/BreadcrumbList 추가 |
| 2026-04-02 | Thin Content Quality Gate 초판 | 5,197개(51.4%) noindex |
| 2026-04-21 | `590225a` | Canonical/metadataBase env 단일 출처 리팩터 (46개 파일) |
| 2026-04-21 | `7525efc` | canonical 리팩터 로그 + seo-geo skill 고도화 |
| 2026-04-21 | `8a74113` | SSG 이중 인코딩(53개 pSEO 허브) + delisted sitemap 필터 |
| 2026-04-21 | `bcde108` | Thin Content 정책 전환(경고 배너) + Dataset/Metadata description 품질 |

---

## 15. 관련 에이전트 / 스킬

- `/seo-geo` — SEO/GEO 전문 에이전트 (`.claude/skills/seo-geo/SKILL.md`)
  - 8가지 작업: audit, implement, add-schema, validate, improve-sitemap, optimize-geo, waf-diagnose, update-doc
  - 이 문서와 `docs/SEO-Strategy.md`를 단일 소스로 사용
