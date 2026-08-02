import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // ❌ 誤り: importしたschemaオブジェクトを直接渡している
  // schema: schema, 

  // ✅ 正解: schemaファイルへの「相対パス」を文字列で指定する
  schema: './src/infrastructure/db/schema.ts', 
  
  out: './drizzle',
  dialect: 'sqlite', // D1の場合は sqlite を指定します
});