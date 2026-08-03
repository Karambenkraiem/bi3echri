import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface MarginByCategoryRow {
  categoryId: string;
  categoryName: string;
  salesCount: number;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
}

export interface RevenueOverTimeRow {
  month: string;
  salesCount: number;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
}

export interface StockRotationRow {
  categoryId: string;
  categoryName: string;
  avgDaysToSell: number | null;
  salesCount: number;
}

export interface ChannelPerformanceRow {
  channel: string;
  salesCount: number;
  totalRevenue: number;
  totalMargin: number;
}

export interface VisitsRow {
  period: string;
  visits: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async marginByCategory() {
    return this.prisma.$queryRaw<MarginByCategoryRow[]>`
      SELECT
        c.id as "categoryId",
        c.name as "categoryName",
        COUNT(s.id)::int as "salesCount",
        COALESCE(SUM(s."salePrice"), 0)::float as "totalRevenue",
        COALESCE(SUM(a."purchasePrice"), 0)::float as "totalCost",
        COALESCE(SUM(s."salePrice" - a."purchasePrice"), 0)::float as "totalMargin"
      FROM categories c
      LEFT JOIN articles a ON a."categoryId" = c.id
      LEFT JOIN sales s ON s."articleId" = a.id
      GROUP BY c.id, c.name
      ORDER BY "totalMargin" DESC
    `;
  }

  async revenueOverTime() {
    return this.prisma.$queryRaw<RevenueOverTimeRow[]>`
      SELECT
        to_char(date_trunc('month', s."saleDate"), 'YYYY-MM') as month,
        COUNT(s.id)::int as "salesCount",
        COALESCE(SUM(s."salePrice"), 0)::float as "totalRevenue",
        COALESCE(SUM(a."purchasePrice"), 0)::float as "totalCost",
        COALESCE(SUM(s."salePrice" - a."purchasePrice"), 0)::float as "totalMargin"
      FROM sales s
      JOIN articles a ON a.id = s."articleId"
      GROUP BY month
      ORDER BY month ASC
    `;
  }

  async stockRotation() {
    return this.prisma.$queryRaw<StockRotationRow[]>`
      SELECT
        c.id as "categoryId",
        c.name as "categoryName",
        ROUND(AVG(EXTRACT(EPOCH FROM (s."saleDate" - a."purchaseDate")) / 86400)::numeric, 1)::float as "avgDaysToSell",
        COUNT(s.id)::int as "salesCount"
      FROM categories c
      JOIN articles a ON a."categoryId" = c.id
      JOIN sales s ON s."articleId" = a.id
      GROUP BY c.id, c.name
      ORDER BY "avgDaysToSell" ASC
    `;
  }

  async channelPerformance() {
    return this.prisma.$queryRaw<ChannelPerformanceRow[]>`
      SELECT
        s."adChannel" as channel,
        COUNT(s.id)::int as "salesCount",
        COALESCE(SUM(s."salePrice"), 0)::float as "totalRevenue",
        COALESCE(SUM(s."salePrice" - a."purchasePrice"), 0)::float as "totalMargin"
      FROM sales s
      JOIN articles a ON a.id = s."articleId"
      GROUP BY s."adChannel"
      ORDER BY "totalMargin" DESC
    `;
  }

  async summary() {
    const [stock, sales] = await Promise.all([
      this.prisma.article.aggregate({
        where: { status: 'EN_STOCK' },
        _count: { id: true },
        _sum: { purchasePrice: true },
      }),
      this.prisma.$queryRaw<{ totalRevenue: number; totalCost: number; totalMargin: number; salesCount: number }[]>`
        SELECT
          COUNT(s.id)::int as "salesCount",
          COALESCE(SUM(s."salePrice"), 0)::float as "totalRevenue",
          COALESCE(SUM(a."purchasePrice"), 0)::float as "totalCost",
          COALESCE(SUM(s."salePrice" - a."purchasePrice"), 0)::float as "totalMargin"
        FROM sales s
        JOIN articles a ON a.id = s."articleId"
      `,
    ]);

    return {
      stockCount: stock._count.id,
      stockValue: Number(stock._sum.purchasePrice ?? 0),
      ...sales[0],
    };
  }

  async visitsDaily() {
    return this.prisma.$queryRaw<VisitsRow[]>`
      SELECT
        to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') as period,
        COUNT(DISTINCT "sessionId")::int as visits
      FROM visits
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY period
      ORDER BY period ASC
    `;
  }

  async visitsWeekly() {
    return this.prisma.$queryRaw<VisitsRow[]>`
      SELECT
        to_char(date_trunc('week', "createdAt"), 'YYYY-MM-DD') as period,
        COUNT(DISTINCT "sessionId")::int as visits
      FROM visits
      WHERE "createdAt" >= NOW() - INTERVAL '12 weeks'
      GROUP BY period
      ORDER BY period ASC
    `;
  }

  async visitsMonthly() {
    return this.prisma.$queryRaw<VisitsRow[]>`
      SELECT
        to_char(date_trunc('month', "createdAt"), 'YYYY-MM') as period,
        COUNT(DISTINCT "sessionId")::int as visits
      FROM visits
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY period
      ORDER BY period ASC
    `;
  }
}
