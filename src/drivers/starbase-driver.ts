import { ColumnType } from "@outerbase/sdk-transform";
import {
  DatabaseHeader,
  DatabaseResultSet,
  DatabaseRow,
} from "./base-driver";
import { SqliteLikeBaseDriver } from "./sqlite-base-driver";

interface StarbaseResult {
  columns: string[];
  rows: unknown[][];
  meta: {
    rows_read: number;
    rows_written: number;
  };
}

interface StarbaseResponse {
  result: StarbaseResult | StarbaseResult[];
}

function transformRawResult(raw: StarbaseResult): DatabaseResultSet {
  const columns = raw.columns ?? [];
  const values = raw.rows;
  const headerSet = new Set();

  const headers: DatabaseHeader[] = columns.map((colName) => {
    let renameColName = colName;

    for (let i = 0; i < 20; i++) {
      if (!headerSet.has(renameColName)) break;
      renameColName = `__${colName}_${i}`;
    }

    return {
      name: renameColName,
      displayName: colName,
      originalType: "text",
      type: ColumnType.TEXT,
    };
  });

  const rows = values
    ? values.map((r) =>
      headers.reduce((a, b, idx) => {
        a[b.name] = r[idx];
        return a;
      }, {} as DatabaseRow)
    )
    : [];

  return {
    rows,
    stat: {
      queryDurationMs: 0,
      rowsAffected: 0,
      rowsRead: raw.meta.rows_read,
      rowsWritten: raw.meta.rows_written,
    },
    headers,
  };
}

export default class StarbaseDriver extends SqliteLikeBaseDriver {
  supportPragmaList: boolean = false;
  protected headers: Record<string, string> = {};
  protected url: string;

  constructor(url: string, headers: Record<string, string>) {
    super();
    this.headers = headers;
    this.url = url;
  }

  async transaction(stmts: string[]): Promise<DatabaseResultSet[]> {
    const r = await fetch(this.url, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction: stmts.map((s) => ({ sql: s })),
      }),
    });

    const json: StarbaseResponse = await r.json();
    return (Array.isArray(json.result) ? json.result : [json.result]).map(
      transformRawResult
    );
  }

  async query(stmt: string): Promise<DatabaseResultSet> {
    const r = await fetch(this.url, {
      method: "POST",
      headers: { ...this.headers, "Content-Type": "application/json" },
      body: JSON.stringify({ sql: stmt }),
    });

    const json: StarbaseResponse = await r.json();

    return transformRawResult(
      Array.isArray(json.result) ? json.result[0] : json.result
    );
  }
}
