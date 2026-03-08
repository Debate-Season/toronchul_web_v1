import { Newspaper } from "lucide-react";
import type { MediaItem } from "@/lib/api/home";

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${month}월 ${day}일 ${hours}:${minutes}`;
}

export default function BreakingNewsCard({ data }: { data: MediaItem }) {
  const date = formatDate(data.outdated);

  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <article className="cursor-pointer transition-colors hover:bg-grey-95">
        <div className="flex items-start gap-3">
          {data.thumbnailUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={data.thumbnailUrl}
              alt=""
              width={160}
              height={104}
              className="rounded-lg object-cover flex-shrink-0"
              style={{ width: 160, height: 104 }}
            />
          ) : (
            <div
              className="rounded-lg bg-grey-90 flex-shrink-0 flex items-center justify-center"
              style={{ width: 160, height: 104 }}
            >
              <Newspaper size={28} className="text-text-secondary" />
            </div>
          )}
          <div className="flex flex-col justify-center flex-1 py-3 pr-4 gap-1.5">
            <p className="flex-1 text-body-16 font-medium text-text-primary line-clamp-3">
              {data.title}
            </p>
            {(date || data.source) && (
              <p className="text-body-11 text-text-secondary">
                {[data.source, date].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>
      </article>
    </a>
  );
}
