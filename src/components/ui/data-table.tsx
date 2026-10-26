import type { Key, ReactNode } from "react";

export type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => Key;
  empty?: string;
};

/**
 * Tabla genérica (componente de servidor) para listados de todos los módulos.
 * Ejemplo:
 *   <DataTable rows={members} getKey={(m) => m.id}
 *     columns={[{ header: "Nombre", cell: (m) => m.name }]} />
 */
export function DataTable<T>({ columns, rows, getKey, empty = "No hay registros." }: Props<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border text-muted">
          <tr>
            {columns.map((column) => (
              <th key={column.header} className={`px-4 py-3 font-medium ${column.className ?? ""}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getKey(row)} className="border-b border-border last:border-0">
                {columns.map((column) => (
                  <td key={column.header} className={`px-4 py-3 ${column.className ?? ""}`}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
