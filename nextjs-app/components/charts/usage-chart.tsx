"use client";

import { Area, AreaChart, CartesianGrid, YAxis } from "recharts";

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
} from "@/components/ui/chart";

export interface UsageHistory {
  date: number;
  usage: number;
}

export function UsageChart({
  title,
  description,
  label,
  data,
}: {
  title: string;
  description?: string;
  label: string;
  data: UsageHistory[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            usage: {
              label,
              color: "hsl(var(--chart-1))",
            },
          }}
        >
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  className="min-w-auto"
                  indicator="dot"
                  hideLabel
                  formatter={(value, name, item, index, payload) => (
                    <div className="flex gap-1">
                      <div className="bg-[hsl(var(--chart-1))] size-4 rounded-sm" />
                      <span>{label}:</span>
                      <span>{value.toString().substring(0, 5)}%</span>
                    </div>
                  )}
                />
              }
            />
            <YAxis domain={[0, 100]} />
            <Area
              dataKey="usage"
              type="linear"
              fill="var(--color-usage)"
              fillOpacity={0.4}
              stroke="var(--color-usage)"
              animationDuration={0}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
