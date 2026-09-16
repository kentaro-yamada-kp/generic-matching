import { prisma } from "@/lib/prisma";

export { prisma as db };
export default prisma;

export * from "./users";
export * from "./threads";
export * from "./participants";
export * from "./evaluations";
export * from "./matches";
export * from "./chat";
