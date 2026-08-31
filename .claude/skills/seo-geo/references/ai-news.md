# AI 뉴스 기사 — 착수 전 필독

> **언제 읽나** — `/news/*` 관련 작업, `generateSitemaps` 도입, 대량 발행 계획이 나올 때.
> **현재 상태**: 백엔드 API 없음(PRD §3.4). 정책 게이트 미통과. **v0.9.0 은 URL 자리와 스키마 계약만 예약한다.**
>
> 이 문서가 존재하는 이유 — AI 뉴스는 **잘못하면 도메인 전체를 죽이는** 유일한 축이다. 이슈·토론 페이지가 아무리 잘 돼 있어도 같이 죽는다. 착수 시점에 급하게 판단하지 않도록 미리 적어둔다.

---

## 1. 가장 큰 리스크 — scaled content abuse

**Google 스팸 정책**(2024-03 도입, developers.google.com/search/docs/essentials/spam-policies)은 **AI 생성 자체를 벌하지 않는다.** 대상은 *"검색 순위를 조작할 목적으로 대량 생성되고 사용자에게 실질적 가치가 없는 페이지"* 다. 판정 기준은 **생성 방식이 아니라 페이지당 가치**다.

**도메인 단위로 작동한다.** 한 도메인이 이 판정을 받으면 이슈·토론 페이지까지 같이 색인에서 빠진다.

### 발행 속도에 대한 주장 — 규칙화하지 말 것 ⚠

아래는 블로그(digitalapplied, 2026-03-08) 주장이며 **Google 공식 문서에는 수치가 없다.** 방향성으로만 쓴다.

- 지속적으로 **일 10건 이상** 발행하면 자동 생성 신호로 취급된다는 주장
- 지속 가능 상한을 "인간 편집 기준선의 2~4배"로 제시(5인 팀 = 주 10~15건)
- **AI 리라이트를 발행하는 뉴스 애그리게이터가 최대 피해 카테고리**로 지목, 트래픽 50~75% 손실 주장 — 토론철 AI 뉴스와 가장 가까운 패턴
- 탐지가 다신호라는 주장: 페이지 간 의미 유사도 · 인게이지먼트 · 발행 속도 · 저자 자격 정보 부재 · **원본 미디어·자체 조사 부재**

> 만약 일 1,000건 발행 계획이 나온다면 위 주장의 **100배**다. 수치의 출처가 약한 것과 별개로, **자릿수가 다르면 논쟁의 여지가 없다.**

### 우리에게 있는 상쇄 카드

탐지 신호 중 "원본 조사 부재"를 **정면으로 상쇄할 수 있는 자산이 있다** — 찬반 수치, 참여 커뮤니티 분포, 발언 수, 시간에 따른 여론 변화. **다른 어디에도 없는 1차 데이터**다.

→ 기사가 이 데이터를 근거로 삼아 **토론철에서만 나올 수 있는 내용**을 담을 때만 발행한다. 외부 기사 리라이트는 정확히 최대 피해 패턴이다.

---

## 2. 발행 게이트 — 전부 충족해야 색인 대상

착수 시점에 하나라도 못 지키면 **`/news/` 를 robots.txt Disallow 로 두고 시작한다.** 색인은 나중에 켤 수 있지만, 판정을 한 번 받으면 회복에 수개월이 걸린다.

- [ ] **발행 전 사람의 편집 검수.** 무검수 자동 발행 금지
- [ ] **AI 생성 사실 명시** — 화면 상단 라벨 + `NewsArticle.creditText`
- [ ] **`publisher` 는 조직(토론철).** 가상의 기자 이름을 만들지 않는다
- [ ] **발행량 제한** — 인간 검수 역량에 연동. 검수 없이 늘리지 않는다
- [ ] **기사가 토론철 1차 데이터를 근거로 삼는다** — 외부 기사 요약본이 아니다
- [ ] **인터넷신문 등록 여부 확인** — 등록 전에는 `/news/` Disallow 를 유지하는 편이 안전하다

**이 조건을 못 지킬 것 같으면 AI 기사를 색인 대상에서 빼는 편이 도메인 전체에 이득이다.**

---

## 3. 사이트맵 샤딩 — Next.js 16 시그니처 고정

이슈·토론만이면 URL 50개라 단일 `sitemap.ts` 로 충분하다. **AI 뉴스가 생기는 순간 자릿수가 바뀐다** — 일 1,000건 × 1년 = 36.5만 URL → 뉴스만 8개 샤드.

- `generateSitemaps` 가 한 라우트의 사이트맵을 여러 파일로 분할하고 `/news/sitemap/{id}.xml` 로 서빙한다
- Google 한도는 **사이트맵 파일당 50,000 URL**. 표준 패턴은 `id * 50000` 슬라이싱
- **Next.js 16 파괴적 변경: `id` 가 Promise 로 전달된다.** 이전 버전의 평문 값 시그니처를 쓰면 깨진다 ◐

```ts
// src/app/news/sitemap.ts
export async function generateSitemaps() {
  const total = await fetchNewsCount();
  return Array.from({ length: Math.ceil(total / 50_000) }, (_, i) => ({ id: i }));
}

export default async function sitemap(props: { id: Promise<number> }): Promise<MetadataRoute.Sitemap> {
  const id = await props.id;          // ← Next.js 16. 평문 number 로 받으면 깨진다
  const start = id * 50_000;
  const articles = await fetchNewsSlice(start, 50_000);
  return articles.map((a) => ({
    url: `${SITE_URL}${newsHref(a.id, a.title)}`,
    lastModified: a.updatedAt,        // ← 실제 갱신 시각만. new Date() 금지
  }));
}
```

**샤딩은 뉴스가 실제로 생길 때 도입한다.** 50개 URL 에 미리 넣지 않는다.

## 4. 크롤 위생 — 대량 페이지에서만 실질 이득

- **AI 크롤러 트래픽의 50% 이상이 변경되지 않은 페이지 재수집**이다 ⚠ → 정확한 `lastModified` · ETag · 조건부 요청이 여기서 돈값을 한다
- **`lastModified` 에 `new Date()` 절대 금지.** 36만 URL 이 매 빌드마다 "방금 수정됨"으로 나가면 Google 이 lastmod 신호 자체를 불신하고, 회복에 수 주~수 개월이 걸린다

## 5. Naver — RSS/Atom 이 필요해진다

Naver 색인은 **sitemap 과 RSS/Atom 피드를 둘 다** 요구한다(`crawler-policy.md` §3-2). 뉴스는 RSS 가 특히 자연스러운 형태다. **토론철에는 아직 피드가 없다.**

## 6. 스키마

`NewsArticle` + `BreadcrumbList` + `about` → 관련 이슈. 상세는 `schema-map.md`.

AI 뉴스 고유 필드:

```
NewsArticle
  creditText       AI 생성 사실 명시
  publisher        Organization(토론철) — 가상 기자 금지
  datePublished / dateModified
  about            관련 이슈 Article
  citation         근거로 삼은 토론철 데이터·외부 출처
```

`citation` 은 장식이 아니다 — **Cite Sources 는 GEO 실측 상위 3위 기법**이고(`geo-evidence.md` §1), 동시에 "원본 조사 부재" 스팸 신호를 상쇄한다. 두 목적이 같은 방향을 가리키는 드문 경우다.

## 7. 사업 축 — SEO 가 정하지 않는다

- **인터넷신문 등록** 여부는 법무·사업 결정이다. 등록하면 AI 학습 봇 차단 관행(뉴스 발행사 차단률 56.4%)이 논점이 된다 → `crawler-policy.md` §1
- **채팅 원문·기사의 검색엔진 공개 색인**은 약관·개인정보처리방침 근거가 선결이다 (PRD §7-2). 진행 중인 약관 3종 개정과 직결된다
