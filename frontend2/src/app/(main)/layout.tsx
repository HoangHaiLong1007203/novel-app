export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Giữ lại nếu em cần padding/margin riêng cho khu main
  return <>{children}</>;
}
