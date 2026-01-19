export const normalizeGenreName = (value = "") => {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (!trimmed) return "";

  return trimmed
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLocaleLowerCase("vi-VN");
      return lower.charAt(0).toLocaleUpperCase("vi-VN") + lower.slice(1);
    })
    .join(" ");
};

export default normalizeGenreName;
