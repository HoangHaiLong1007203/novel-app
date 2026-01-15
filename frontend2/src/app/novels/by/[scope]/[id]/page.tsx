import NovelsListPage from "@/components/novel/NovelsListPage";

interface Props {
  params: { scope: string; id: string };
}

export default function ByScopePage({ params }: Props) {
  const { scope, id } = params;
  const cleanId = Array.isArray(id) ? id[0] : id;

  const initialFetchParams: Record<string, string> = {};
  let title = "Các truyện";

  if (scope === "author") {
    initialFetchParams.author = cleanId;
    title = `Các truyện cùng tác giả: ${cleanId}`;
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
