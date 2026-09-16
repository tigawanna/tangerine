import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  useConsoleMetricsSse,
  type ConsoleMetricsPoint,
} from "@/hooks/use-console-metrics-sse";
import { formatBytes } from "@/utils/format-bytes";
import { Activity, Cpu, MemoryStick } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

const chartConfig = {
  cpuPercent: {
    label: "CPU %",
    color: "var(--chart-1)",
  },
  rssMb: {
    label: "RSS (MB)",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type ChartRow = {
  t: string;
  cpuPercent: number;
  rssMb: number;
};

function toChartRows(history: ConsoleMetricsPoint[]): ChartRow[] {
  return history.map((point) => ({
    t: point.t,
    cpuPercent: point.cpuPercent,
    rssMb: Math.round((point.rss / (1024 * 1024)) * 10) / 10,
  }));
}

function MetricCard({
  title,
  description,
  value,
  hint,
  icon: Icon,
  testId,
}: {
  title: string;
  description: string;
  value: string;
  hint?: string;
  icon: typeof Cpu;
  testId: string;
}) {
  return (
    <Card data-test={testId} className="gap-4 py-4">
      <CardHeader className="px-4 [.border-b]:pb-0">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className="size-4" aria-hidden />
          <CardDescription>{description}</CardDescription>
        </div>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4">
        <p className="font-mono text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function MetricsChart({ history }: { history: ConsoleMetricsPoint[] }) {
  const rows = toChartRows(history);

  if (rows.length < 2) {
    return (
      <div
        className="flex h-48 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground"
        data-test="console-metrics-chart-empty"
      >
        Collecting samples…
      </div>
    );
  }

  return (
    <Card className="gap-4 py-4" data-test="console-metrics-chart">
      <CardHeader className="px-4">
        <CardTitle className="text-sm font-medium">CPU & RSS</CardTitle>
        <CardDescription>Last ~{rows.length}s — spikes show up here during enrich / model load</CardDescription>
      </CardHeader>
      <CardContent className="px-2 pb-2 sm:px-4">
        <ChartContainer config={chartConfig} className="aspect-auto h-48 w-full">
          <AreaChart data={rows} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="t"
              tickLine={false}
              axisLine={false}
              minTickGap={28}
              tickMargin={8}
            />
            <YAxis
              yAxisId="cpu"
              tickLine={false}
              axisLine={false}
              width={36}
              tickFormatter={(value: number) => `${value}`}
            />
            <YAxis
              yAxisId="rss"
              orientation="right"
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(value: number) => `${value}`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(label) => String(label)}
                />
              }
            />
            <Area
              yAxisId="cpu"
              dataKey="cpuPercent"
              type="monotone"
              fill="var(--color-cpuPercent)"
              fillOpacity={0.15}
              stroke="var(--color-cpuPercent)"
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Area
              yAxisId="rss"
              dataKey="rssMb"
              type="monotone"
              fill="var(--color-rssMb)"
              fillOpacity={0.1}
              stroke="var(--color-rssMb)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function EnrichedConsole() {
  const { latest, history, error } = useConsoleMetricsSse(true);

  const heapHint = latest
    ? `heap ${formatBytes(latest.heapUsed)} / ${formatBytes(latest.heapTotal)}`
    : undefined;
  const systemHint = latest
    ? `host free ${formatBytes(latest.systemFree)} / ${formatBytes(latest.systemTotal)}`
    : undefined;

  return (
    <div className="flex w-full flex-col gap-4 p-4 md:p-6" data-test="enriched-console">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">Console</h2>
        <p className="text-sm text-muted-foreground">
          Live load for this app process — useful for spotting enrich / embedding spikes.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" data-test="console-metrics-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          testId="console-metric-cpu"
          icon={Cpu}
          title="CPU"
          description="Process"
          value={latest ? `${latest.cpuPercent.toFixed(1)}%` : "—"}
          hint={latest ? `pid ${latest.pid}` : undefined}
        />
        <MetricCard
          testId="console-metric-rss"
          icon={MemoryStick}
          title="RSS"
          description="Resident memory"
          value={latest ? formatBytes(latest.rss) : "—"}
          hint={heapHint}
        />
        <MetricCard
          testId="console-metric-host"
          icon={Activity}
          title="Host free"
          description="System memory"
          value={latest ? formatBytes(latest.systemFree) : "—"}
          hint={systemHint}
        />
      </div>

      <MetricsChart history={history} />
    </div>
  );
}
