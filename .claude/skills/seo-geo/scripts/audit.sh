#!/usr/bin/env bash
# 토론철 SEO/GEO 감사. 판정하지 않고 사실만 출력한다 — 해석은 호출한 쪽이 한다.
#   사용: audit.sh [경로]        예: audit.sh /issue/8-도널드-트럼프-2기-행정부
#   환경: SITE (기본 https://toronchul.app)

set -uo pipefail
SITE="${SITE:-https://toronchul.app}"
PATH_UNDER_TEST="${1:-/}"
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
BOT_UA="Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
WEB_UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36"

hr() { printf '\n── %s\n' "$1"; }

hr "1. 크롤러가 실제로 읽는 것  ${PATH_UNDER_TEST}"
curl -sA "$BOT_UA" --max-time 20 "${SITE}${PATH_UNDER_TEST}" > /tmp/seo-bot.html || echo "  요청 실패"
python3 - /tmp/seo-bot.html <<'PY'
import sys, re
h = open(sys.argv[1], encoding='utf-8', errors='replace').read()
body = re.sub(r'(?s)<script.*?</script>|<style.*?</style>', '', h)
text = re.sub(r'\s+', ' ', re.sub(r'(?s)<[^>]+>', ' ', body)).strip()
def one(pat, default='(없음)'):
    m = re.search(pat, h, re.I | re.S)
    return m.group(1).strip() if m else default
print(f"  HTML         {len(h.encode()):,} bytes")
print(f"  본문 텍스트   {len(text)}자   (합격선 500자 / 위키 게시 시 2,000자)")
print(f"  본문 앞부분   {text[:160]}")
print(f"  title        {one(r'<title[^>]*>(.*?)</title>')}")
print(f"  description  {one(r'<meta[^>]+name=.description.[^>]+content=.(.*?).[/ ]*>')}")
print(f"  canonical    {one(r'<link[^>]+rel=.canonical.[^>]+href=.(.*?).[/ ]*>')}")
print(f"  og:url       {one(r'<meta[^>]+property=.og:url.[^>]+content=.(.*?).[/ ]*>')}")
print(f"  JSON-LD      {len(re.findall(r'application/ld.json', h))}개")
for t in sorted(set(re.findall(r'\"@type\"\s*:\s*\"([A-Za-z]+)\"', h))):
    print(f"               - {t}")
PY

hr "2. 클로킹 점검  (봇 UA ↔ 브라우저 UA)"
curl -sA "$WEB_UA" --max-time 20 "${SITE}${PATH_UNDER_TEST}" > /tmp/seo-web.html || true
b=$(wc -c < /tmp/seo-bot.html | tr -d ' '); w=$(wc -c < /tmp/seo-web.html | tr -d ' ')
echo "  봇 ${b} bytes / 브라우저 ${w} bytes"
if [ "$b" -gt 0 ] && [ "$w" -gt 0 ]; then
  awk -v a="$b" -v c="$w" 'BEGIN{d=(a>c?a-c:c-a); r=d/(a>c?a:c)*100; printf "  차이 %.1f%%  %s\n", r, (r>10 ? "→ 10% 초과. 클로킹 여부 확인 필요" : "→ 정상")}'
fi

hr "3. 인프라 엔드포인트"
for p in /robots.txt /sitemap.xml; do
  printf '  %-14s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${SITE}${p}")"
done
if curl -s --max-time 10 "${SITE}/robots.txt" | grep -qi '^user-agent:[[:space:]]*Yeti'; then
  echo "  Yeti          명시됨"
else
  echo "  Yeti          [P0] robots.txt 에 없음 — Naver 전체 차단 위험"
fi
ls "$ROOT"/public/naver*.html >/dev/null 2>&1 && echo "  Naver 소유확인 파일 있음 (robots Disallow·sitemap 포함 금지)"

hr "4. URL 스킴"
for p in "/issue/8-도널드-트럼프-2기-행정부:200" "/issue/8:301" "/issue/8-틀린슬러그:301" "/issue/abc-x:404"; do
  u="${p%:*}"; want="${p##*:}"
  got=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "${SITE}${u}")
  [ "$got" = "$want" ] && s="OK" || s="기대 ${want}"
  printf '  %-3s %-45s %s\n' "$got" "$u" "$s"
done

hr "5. 코드 위반  (0건이어야 정상)"
cd "$ROOT" || exit 1
chk() { printf '  %-34s ' "$1"; shift; out=$("$@" 2>/dev/null); n=$(printf '%s' "$out" | grep -c . ); [ "$n" -eq 0 ] && echo "0" || { echo "$n 건"; printf '%s\n' "$out" | sed 's/^/      /'; }; }

chk 'page.tsx 의 "use client"' bash -c 'grep -rln "\"use client\"" src/app/issue src/app/news 2>/dev/null | grep "page.tsx$"'
chk 'sitemap 의 new Date()'    bash -c 'grep -n "new Date()" src/app/sitemap.ts src/app/*/sitemap.ts 2>/dev/null'
chk '도메인 하드코딩'           bash -c 'grep -rn --include="*.ts" --include="*.tsx" "toronchul\.app" src/ | grep -v "lib/seo.ts" | grep -v "NEXT_PUBLIC_WS_URL" | grep -v "NEXT_PUBLIC_IMAGE_URL"'
chk 'const SITE_URL 로컬 선언'  bash -c 'grep -rn --include="*.ts" --include="*.tsx" "const SITE_URL" src/ | grep -v "lib/seo.ts"'
chk 'URL 문자열 직접 조립'      bash -c 'grep -rn --include="*.ts" --include="*.tsx" -e "\"/issue/" -e "\`/issue/" -e "\"/news/" src/ | grep -v "lib/slug.ts" | grep -v "^\S*: *\*"'
chk '폐기 스키마 (FAQPage 등)'  bash -c 'grep -rn --include="*.ts" --include="*.tsx" -e "FAQPage" -e "HowTo" -e "SpecialAnnouncement" src/'
chk 'TDS 의 seo import'         bash -c 'grep -rn "@/lib/seo" src/components/TDS/ 2>/dev/null'
chk 'any / @ts-ignore'          bash -c 'grep -rn --include="*.ts" --include="*.tsx" -e ": any" -e "@ts-ignore" src/lib/seo.ts src/app/sitemap.ts src/app/robots.ts 2>/dev/null'

hr "6. 핵심 파일 존재"
for f in src/lib/seo.ts src/lib/slug.ts src/app/robots.ts src/app/sitemap.ts; do
  [ -f "$f" ] && printf '  O %s\n' "$f" || printf '  X %s\n' "$f"
done
echo
