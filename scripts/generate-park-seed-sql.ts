import * as fs from "fs";
import { parse } from "csv-parse/sync";
import { randomUUID } from "crypto";

interface ParkCsvRow {
  "名称": string;
  "緯度": string;
  "経度": string;
  "所在地_連結表記": string;
}

const csvContent = fs.readFileSync("docs/新宿区公園一覧.csv", "utf8")
  .replace(/^\uFEFF/, '')     // BOMを削除
  .replace(/\r\n?/g, '\n');   // 改行コードをLFに統一

const records: ParkCsvRow[] = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  bom: false, // 手動でBOM除去済のため不要
  relaxColumnCount: true,
  trim: true,
  relax_quotes: true,
}) as ParkCsvRow[];
console.log(`📄 CSVパース結果: ${records.length} 行`);

const inserts: string[] = [];

for (const row of records) {
  const name = row["名称"];
  const latitude = parseFloat(row["緯度"]);
  const longitude = parseFloat(row["経度"]);
  const address = row["所在地_連結表記"];

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    continue;
  }

  const escapedName = (name ?? "").replace(/'/g, "''");
  const escapedAddress = (address ?? "").replace(/'/g, "''");
  const uuid = randomUUID();

  inserts.push(
    `('${uuid}', '${escapedName}', ${latitude}, ${longitude}, '${escapedAddress}')`,
  );
}

const sql = `-- 新宿区公園一覧シードデータ
INSERT OR IGNORE INTO places (id, name, latitude, longitude, address) VALUES
${inserts.join(",\n")};
`;

fs.writeFileSync("drizzle/seed_parks.sql", sql, "utf8");
console.log(`✅ ${inserts.length} 件の公園をシードSQLに出力しました。`);
