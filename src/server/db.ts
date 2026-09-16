import { prisma } from "@/lib/prisma";

// サーバーサイド処理用の Prisma クライアントおよび DB 操作関数群のエクスポート
export { prisma as db };
export default prisma;

export * from "./db/index";
