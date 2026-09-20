import { freemem, totalmem } from "node:os";
import { cpuUsage, hrtime, memoryUsage, pid } from "node:process";

/** Live sample of the Nitro/Elysia process (where enrich / ORT / Gemma run). */
export type ProcessMetricsSample = {
  at: string;
  pid: number;
  /** Resident set size in bytes. */
  rss: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  /**
   * CPU time since the previous sample as a percent of one core
   * (can exceed 100 on multi-core bursts).
   */
  cpuPercent: number;
  systemTotal: number;
  systemFree: number;
};

type CpuSnapshot = ReturnType<typeof cpuUsage>;

let previousCpu: CpuSnapshot = cpuUsage();
let previousHr = hrtime.bigint();

/**
 * Snapshot process + host memory. CPU % is a delta since the last call —
 * call on a steady interval (e.g. 1s SSE ticks).
 */
export function sampleProcessMetrics(): ProcessMetricsSample {
  const mem = memoryUsage();
  const cpuDelta = cpuUsage(previousCpu);
  const nowHr = hrtime.bigint();
  const elapsedUs = Number(nowHr - previousHr) / 1000;

  previousCpu = cpuUsage();
  previousHr = nowHr;

  const cpuPercent =
    elapsedUs > 0
      ? Math.round(((cpuDelta.user + cpuDelta.system) / elapsedUs) * 1000) / 10
      : 0;

  return {
    at: new Date().toISOString(),
    pid,
    rss: mem.rss,
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal,
    external: mem.external,
    cpuPercent,
    systemTotal: totalmem(),
    systemFree: freemem(),
  };
}
