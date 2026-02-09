"use client";

import { useMemo, useState } from "react";

type Align = "left" | "right" | "center";

type Column<Row> = {
  key: keyof Row | string;
  label: string;
  align?: Align;
  tooltip?: string;
  format?: (value: unknown, row: Row) => React.ReactNode;
  sortValue?: (row: Row) => string | number | null;
};

type FilterableTableProps<Row> = {
  data: Row[];
  columns: Array<Column<Row>>;
  rowKey: (row: Row, index: number) => string;
  dense?: boolean;
  maxHeightClassName?: string;
  showFiltersByDefault?: boolean;
  stickyHeader?: boolean;
  stickyFirstColumn?: boolean;
  defaultSortKey?: string;
  defaultSortDir?: "asc" | "desc";
};

const alignClass = (align?: Align) => {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
};

export default function FilterableTable<Row>({
  data,
  columns,
  rowKey,
  dense,
  maxHeightClassName,
  showFiltersByDefault = false,
  stickyHeader = true,
  stickyFirstColumn = true,
  defaultSortKey,
  defaultSortDir = "desc",
}: FilterableTableProps<Row>) {
  const [sortKey, setSortKey] = useState<string>(defaultSortKey ?? String(columns[0]?.key ?? ""));
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(showFiltersByDefault);

  const optionsByColumn = useMemo(() => {
    const map = new Map<string, string[]>();
    columns.forEach((col) => {
      const key = String(col.key);
      const uniques = new Set<string>();
      data.forEach((row) => {
        const raw = (row as Record<string, unknown>)[key];
        if (raw === null || raw === undefined) return;
        const value = String(raw);
        if (value.trim().length === 0) return;
        if (uniques.size <= 50) {
          uniques.add(value);
        }
      });
      map.set(key, Array.from(uniques).sort());
    });
    return map;
  }, [columns, data]);

  const filtered = useMemo(() => {
    return data.filter((row) => {
      return columns.every((col) => {
        const filter = filters[String(col.key)]?.trim();
        if (!filter) return true;
        const raw = (row as Record<string, unknown>)[String(col.key)];
        return String(raw ?? "").toLowerCase().includes(filter.toLowerCase());
      });
    });
  }, [data, columns, filters]);

  const sorted = useMemo(() => {
    const next = [...filtered];
    const column = columns.find((col) => String(col.key) === sortKey);
    if (!column) return next;

    next.sort((a, b) => {
      const aValue = column.sortValue ? column.sortValue(a) : (a as Record<string, unknown>)[sortKey];
      const bValue = column.sortValue ? column.sortValue(b) : (b as Record<string, unknown>)[sortKey];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDir === "asc" ? aValue - bValue : bValue - aValue;
      }

      return sortDir === "asc"
        ? String(aValue ?? "").localeCompare(String(bValue ?? ""))
        : String(bValue ?? "").localeCompare(String(aValue ?? ""));
    });

    return next;
  }, [filtered, columns, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("desc");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6B7C70] font-serif">{sorted.length} rows</p>
        <button
          type="button"
          onClick={() => setShowFilters((prev) => !prev)}
          className="text-xs font-serif text-[#4A5D4E] underline"
        >
          {showFilters ? "Hide filters" : "Show filters"}
        </button>
      </div>
      <div className={`overflow-x-auto rounded-2xl border border-[#E3E7DF] bg-white ${maxHeightClassName ?? ""}`}>
        <table className={`w-full ${dense ? "text-xs" : "text-sm"} font-serif border-collapse`}>
          <thead className={`bg-[#F6F8F4] text-[#6B7C70] ${stickyHeader ? "sticky top-0 z-10" : ""}`}>
            <tr>
              {columns.map((col, index) => (
                <th
                  key={String(col.key)}
                  className={`px-3 py-2 border border-[#E6EAE1] ${alignClass(col.align)} ${
                    stickyFirstColumn && index === 0 ? "sticky left-0 z-20 bg-[#F6F8F4]" : ""
                  }`}
                >
                  <div className={`flex items-center gap-2 ${col.align === "right" ? "justify-end" : ""}`}>
                    <button type="button" onClick={() => toggleSort(String(col.key))}>
                      {col.label}
                    </button>
                    {col.tooltip && (
                      <details className="relative">
                        <summary className="list-none cursor-pointer inline-flex items-center justify-center w-4 h-4 rounded-full border border-[#C9D2C6] text-[10px] text-[#6B7C70]">
                          i
                        </summary>
                        <div className="absolute left-1/2 top-full z-20 mt-2 w-44 -translate-x-1/2 rounded-lg border border-[#E3E7DF] bg-white px-2 py-1 text-[11px] text-[#4A5D4E] shadow-[0_10px_30px_-18px_rgba(31,41,55,0.4)]">
                          {col.tooltip}
                        </div>
                      </details>
                    )}
                  </div>
                </th>
              ))}
            </tr>
            {showFilters && (
              <tr>
                {columns.map((col, index) => {
                  const key = String(col.key);
                  const options = optionsByColumn.get(key) ?? [];
                  const listId = `filter-${key}`;
                  return (
                    <th
                      key={`filter-${key}`}
                      className={`px-3 py-2 border border-[#E6EAE1] ${
                        stickyFirstColumn && index === 0 ? "sticky left-0 z-10 bg-white" : ""
                      }`}
                    >
                      <input
                        list={listId}
                        value={filters[key] ?? ""}
                        onChange={(event) =>
                          setFilters((prev) => ({ ...prev, [key]: event.target.value }))
                        }
                        placeholder="Filter"
                        className="w-full rounded-lg border border-[#E3E7DF] px-2 py-1 text-xs"
                      />
                      <datalist id={listId}>
                        {options.map((option) => (
                          <option key={option} value={option} />
                        ))}
                      </datalist>
                    </th>
                  );
                })}
              </tr>
            )}
          </thead>
          <tbody className="text-[#1F2937]">
            {sorted.map((row, index) => (
              <tr key={rowKey(row, index)} className="border border-[#E6EAE1]">
                {columns.map((col, colIndex) => {
                  const raw = (row as Record<string, unknown>)[String(col.key)];
                  return (
                    <td
                      key={`${String(col.key)}-${index}`}
                      className={`px-3 py-2 border border-[#E6EAE1] ${alignClass(col.align)} ${
                        stickyFirstColumn && colIndex === 0 ? "sticky left-0 z-[1] bg-white" : ""
                      }`}
                    >
                      {col.format ? col.format(raw, row) : String(raw ?? "-")}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
