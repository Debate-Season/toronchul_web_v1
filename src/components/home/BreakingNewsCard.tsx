import { ExternalLink } from "lucide-react";

interface BreakingNews {
  title: string;
  url: string;
}

export default function BreakingNewsCard({ data }: { data: BreakingNews }) {
  return (
    <a
      href={data.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <article className="rounded-2xl border border-border bg-surface-elevated p-4 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg hover:border-grey-70">
        <div className="flex items-start gap-3">
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
