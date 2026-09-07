import { notFound } from "next/navigation";
import { loadEpisode } from "@/server/data/store";
import { ReviewDesk } from "./review-desk";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ episodeId: string }>;
}) {
  const { episodeId } = await params;
  const episode = loadEpisode(episodeId);
  if (!episode) notFound();
  return <ReviewDesk episode={episode} />;
}
