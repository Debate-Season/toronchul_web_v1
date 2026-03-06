import Image from "next/image";
import { ExternalLink } from "lucide-react";
import type { MediaItem } from "@/lib/api/home";

export default function BreakingNewsCard({ data }: { data: MediaItem }) {
  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <article className="rounded-2xl border border-border bg-surface-elevated p-4 cursor-pointer transition-colors hover:border-grey-70">
        <div className="flex items-start gap-3">
          {data.thumbnailUrl && (
            <Image
              src={data.thumbnailUrl}
              alt=""
              width={80}
              height={52}
              className="rounded-lg object-cover flex-shrink-0"
              style={{ width: 80, height: 52 }}
            />
          )}
          <p className="flex-1 text-body-14 font-medium text-text-primary line-clamp-2">
            {data.title}
          </p>
          <ExternalLink
            size={16}
            className="text-text-secondary flex-shrink-0 mt-0.5"
          />
        </div>
      </article>
    </a>
  );
}
