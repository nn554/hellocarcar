import { prisma } from "@hellocarcar/db";
import { runDailyPolicyFetch } from "./policy-fetcher";

runDailyPolicyFetch(prisma)
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
    if (result.status === "FAILED") process.exitCode = 1;
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
