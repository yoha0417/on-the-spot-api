import { parse } from "csv-parse/sync";
import * as fs from "fs";

interface ParkCsvRow {
	名称: string;

	緯度: string;

	経度: string;

	所在地_連結表記: string;
}

const csvContent = fs.readFileSync("docs/新宿区公園一覧.csv", "utf8");

const records: ParkCsvRow[] = parse(csvContent, {
	columns: true,

	skip_empty_lines: true,

	bom: true,

	relaxColumnCount: true,
}) as ParkCsvRow[];

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

	inserts.push(
		`('${escapedName}', ${latitude}, ${longitude}, '${escapedAddress}')`,
	);
}

const sql = `-- 新宿区公園一覧シードデータ                                                                                                                                                      
                                                                                                                                                                                                
INSERT OR IGNORE INTO places (name, latitude, longitude, address) VALUES                                                                                                                        
                                                                                                                                                                                                
${inserts.join(",\n")};                                                                                                                                                                         
                                                                                                                                                                                                
`;

fs.writeFileSync("drizzle/seed_parks.sql", sql, "utf8");

console.log(`✅ ${inserts.length} 件の公園をシードSQLに出力しました。`);
