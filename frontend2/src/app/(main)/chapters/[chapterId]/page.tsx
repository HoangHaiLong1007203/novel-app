import ChapterReader from "@/components/novel/ChapterReader";

interface PageProps {
  params: { chapterId: string };
}

export default function ChapterReaderPage({ params }: PageProps) {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10">
      <ChapterReader chapterId={params.chapterId} />
    </div>
  );
}
