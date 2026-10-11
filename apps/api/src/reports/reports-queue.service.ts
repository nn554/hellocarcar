import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";
import IORedis from "ioredis";

@Injectable()
export class ReportsQueueService implements OnModuleDestroy {
  private readonly connection = new IORedis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
    maxRetriesPerRequest: null
  });
  private readonly queue = new Queue("hellocarcar", { connection: this.connection });

  enqueue(reportRequestId: string) {
    if (process.env.NODE_ENV === "test") return Promise.resolve({ id: `test-report-${reportRequestId}` });
    return this.queue.add("generate-report-pdf", { reportRequestId }, {
      jobId: `report-${reportRequestId}`,
      attempts: 3,
      backoff: { type: "exponential", delay: 5_000 },
      removeOnComplete: 100,
      removeOnFail: 100
    });
  }

  async onModuleDestroy() {
    await this.queue.close();
    await this.connection.quit();
  }
}
