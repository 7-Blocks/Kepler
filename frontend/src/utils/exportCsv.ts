export function exportCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
) {
  const escapeValue = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "";

    return `"${String(value).replace(/"/g, '""')}"`;
  };

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map(escapeValue).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(link.href);
}