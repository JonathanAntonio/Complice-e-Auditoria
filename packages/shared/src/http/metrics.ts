import type { RequestHandler } from "express";

const DURATION_BUCKETS_SECONDS = [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5];

type HistogramValues = {
  bucketCounts: number[];
  sum: number;
  count: number;
};

function keyOf(method: string, route: string, statusCode: number): string {
  return `${method}|${route}|${statusCode}`;
}

function nowNs(): bigint {
  return process.hrtime.bigint();
}

function observe(
  store: Map<string, HistogramValues>,
  method: string,
  route: string,
  statusCode: number,
  seconds: number
): void {
  const key = keyOf(method, route, statusCode);
  const current = store.get(key) ?? {
    bucketCounts: DURATION_BUCKETS_SECONDS.map(() => 0),
    sum: 0,
    count: 0,
  };

  for (let i = 0; i < DURATION_BUCKETS_SECONDS.length; i += 1) {
    if (seconds <= DURATION_BUCKETS_SECONDS[i]) {
      current.bucketCounts[i] += 1;
    }
  }

  current.sum += seconds;
  current.count += 1;
  store.set(key, current);
}

function statusClass(statusCode: number): string {
  return `${Math.floor(statusCode / 100)}xx`;
}

function resolveRoute(req: { route?: { path?: unknown }; path?: string }): string {
  const routePath = req.route?.path;
  if (typeof routePath === "string" && routePath.length > 0) {
    return routePath;
  }
  return req.path ?? "unknown";
}

function escapeLabel(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

export interface ServiceMetrics {
  middleware: RequestHandler;
  handler: RequestHandler;
  recordGauge(name: string, value: number): void;
}

export function createServiceMetrics(serviceName: string): ServiceMetrics {
  const startedAt = new Date();
  let startedAtEpochSeconds = Math.floor(startedAt.getTime() / 1000);
  const requestsByStatusClass = new Map<string, number>();
  const durations = new Map<string, HistogramValues>();
  const customGauges = new Map<string, number>();

  const middleware: RequestHandler = (req, res, next) => {
    const start = nowNs();
    res.on("finish", () => {
      const durationNs = nowNs() - start;
      const durationSeconds = Number(durationNs) / 1_000_000_000;
      const method = req.method.toUpperCase();
      const route = resolveRoute(req);
      const statusCode = res.statusCode;

      const classKey = `${method}|${route}|${statusClass(statusCode)}`;
      requestsByStatusClass.set(classKey, (requestsByStatusClass.get(classKey) ?? 0) + 1);
      observe(durations, method, route, statusCode, durationSeconds);
    });
    next();
  };

  const handler: RequestHandler = (_req, res) => {
    const lines: string[] = [];
    lines.push("# HELP service_info Static information about the running service.");
    lines.push("# TYPE service_info gauge");
    lines.push(`service_info{service="${escapeLabel(serviceName)}"} 1`);
    lines.push("# HELP service_start_time_seconds Unix epoch when the service process started.");
    lines.push("# TYPE service_start_time_seconds gauge");
    lines.push(`service_start_time_seconds{service="${escapeLabel(serviceName)}"} ${startedAtEpochSeconds}`);
    lines.push("# HELP process_uptime_seconds Process uptime in seconds.");
    lines.push("# TYPE process_uptime_seconds gauge");
    lines.push(`process_uptime_seconds{service="${escapeLabel(serviceName)}"} ${Math.floor(process.uptime())}`);
    lines.push("# HELP process_resident_memory_bytes Resident memory in bytes.");
    lines.push("# TYPE process_resident_memory_bytes gauge");
    lines.push(`process_resident_memory_bytes{service="${escapeLabel(serviceName)}"} ${process.memoryUsage().rss}`);
    lines.push("# HELP http_requests_total Total HTTP requests grouped by method, route and status class.");
    lines.push("# TYPE http_requests_total counter");
    for (const [key, value] of requestsByStatusClass.entries()) {
      const [method, route, cls] = key.split("|");
      lines.push(
        `http_requests_total{service="${escapeLabel(serviceName)}",method="${escapeLabel(method)}",route="${escapeLabel(route)}",status_class="${escapeLabel(cls)}"} ${value}`
      );
    }
    lines.push("# HELP http_request_duration_seconds HTTP request duration histogram.");
    lines.push("# TYPE http_request_duration_seconds histogram");
    for (const [key, values] of durations.entries()) {
      const [method, route, statusCode] = key.split("|");
      let cumulative = 0;
      for (let i = 0; i < DURATION_BUCKETS_SECONDS.length; i += 1) {
        cumulative += values.bucketCounts[i];
        lines.push(
          `http_request_duration_seconds_bucket{service="${escapeLabel(serviceName)}",method="${escapeLabel(method)}",route="${escapeLabel(route)}",status_code="${escapeLabel(statusCode)}",le="${DURATION_BUCKETS_SECONDS[i]}"} ${cumulative}`
        );
      }
      lines.push(
        `http_request_duration_seconds_bucket{service="${escapeLabel(serviceName)}",method="${escapeLabel(method)}",route="${escapeLabel(route)}",status_code="${escapeLabel(statusCode)}",le="+Inf"} ${values.count}`
      );
      lines.push(
        `http_request_duration_seconds_sum{service="${escapeLabel(serviceName)}",method="${escapeLabel(method)}",route="${escapeLabel(route)}",status_code="${escapeLabel(statusCode)}"} ${values.sum}`
      );
      lines.push(
        `http_request_duration_seconds_count{service="${escapeLabel(serviceName)}",method="${escapeLabel(method)}",route="${escapeLabel(route)}",status_code="${escapeLabel(statusCode)}"} ${values.count}`
      );
    }

    if (customGauges.size > 0) {
      for (const [name, value] of customGauges.entries()) {
        lines.push(`# HELP ${name} Custom service metric.`);
        lines.push(`# TYPE ${name} gauge`);
        lines.push(`${name}{service="${escapeLabel(serviceName)}"} ${value}`);
      }
    }

    lines.push("");
    res.setHeader("content-type", "text/plain; version=0.0.4; charset=utf-8");
    res.status(200).send(lines.join("\n"));
  };

  return {
    middleware,
    handler,
    recordGauge(name: string, value: number): void {
      customGauges.set(name, value);
      if (name === "service_start_time_seconds") {
        startedAtEpochSeconds = value;
      }
    },
  };
}
