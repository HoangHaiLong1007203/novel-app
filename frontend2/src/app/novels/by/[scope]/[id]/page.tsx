import NovelsListPage from "@/components/novel/NovelsListPage";

interface Props {
  params:
    | { scope: string | string[]; id: string | string[] }
    | Promise<{ scope: string | string[]; id: string | string[] }>;
}

export default async function ByScopePage({ params }: Props) {
  const { scope, id } = (await params) as { scope: string | string[]; id: string | string[] };
  const cleanId = Array.isArray(id) ? id[0] : id;

  const initialFetchParams: Record<string, string> = {};
  let title = "Các truyện";

  if (scope === "author") {
    // `id` in the URL may be percent-encoded (path segment). Ensure we
    // decode it before appending to query params to avoid double-encoding
    // when `URLSearchParams` encodes values.
    const decoded = decodeURIComponent(cleanId);
    initialFetchParams.author = decoded;
    title = `Các truyện cùng tác giả: ${decoded}`;
  } else if (scope === "poster") {
    initialFetchParams.poster = cleanId;
    title = `Các truyện cùng người đăng`;
  } else {
    // fallback: allow query by id param name
    initialFetchParams.poster = cleanId;
  }

  return (
    <NovelsListPage initialFetchParams={initialFetchParams} editable={false} title={title} showFilter={false} />
  );
}
