import type { Dispatch, SetStateAction } from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

type DateRange = "7d" | "30d" | "all";

type AnalyticsPageProps = {
  categoryChartData: { category: string; total: number }[];
  trendData: { date: string; amount: number }[];
  cumulativeTrendData: { date: string; total: number }[];
  categoryPercentages: { category: string; percent: number }[];
  dateRange: DateRange;
  setDateRange: Dispatch<SetStateAction<DateRange>>;
  analyticsInsights: string[];
};

export default function AnalyticsPage({
  categoryChartData,
  trendData,
  cumulativeTrendData,
  categoryPercentages,
  dateRange,
  setDateRange,
  analyticsInsights,
}: AnalyticsPageProps) {
  return (
    <>
      <section className="card">
        <div className="section-header">
          <h3>Analytics Filters</h3>
        </div>

        <div className="filter-row">
          <button
            type="button"
            className={`filter-chip ${dateRange === "7d" ? "active" : ""}`}
            onClick={() => setDateRange("7d")}
          >
            Last 7 Days
          </button>

          <button
            type="button"
            className={`filter-chip ${dateRange === "30d" ? "active" : ""}`}
            onClick={() => setDateRange("30d")}
          >
            Last 30 Days
          </button>

          <button
            type="button"
            className={`filter-chip ${dateRange === "all" ? "active" : ""}`}
            onClick={() => setDateRange("all")}
          >
            All Time
          </button>
        </div>
      </section>

      <section className="card">
        <div className="section-header">
          <h3>Smart Analytics Insights</h3>
        </div>

        <div className="insight-list">
          {analyticsInsights.map((insight, index) => (
            <div key={index} className="insight-item positive">
              <span className="insight-icon">🧠</span>
              <p>{insight}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="summary-grid">
        {categoryPercentages.length === 0 ? (
          <div className="card">
            <p className="empty-state">No category percentage data yet.</p>
          </div>
        ) : (
          categoryPercentages.map((item, index) => (
            <div key={index} className="card summary-card">
              <p className="card-label">{item.category}</p>
              <h2>{item.percent}%</h2>
            </div>
          ))
        )}
      </section>

      <section className="card chart-card">
        <div className="section-header">
          <h3>Daily Spending</h3>
        </div>

        {trendData.length === 0 ? (
          <p className="empty-state">No trend data yet.</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8" }} />
                <YAxis tick={{ fill: "#94a3b8" }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="card chart-card">
        <div className="section-header">
          <h3>Total Spending Over Time</h3>
        </div>

        {cumulativeTrendData.length === 0 ? (
          <p className="empty-state">No cumulative trend data yet.</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cumulativeTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: "#94a3b8" }} />
                <YAxis tick={{ fill: "#94a3b8" }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#22c55e"
                  strokeWidth={3}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="card chart-card">
        <div className="section-header">
          <h3>Spending by Category</h3>
        </div>

        {categoryChartData.length === 0 ? (
          <p className="empty-state">No chart data yet.</p>
        ) : (
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fill: "#94a3b8" }} />
                <YAxis tick={{ fill: "#94a3b8" }} />
                <Tooltip />
                <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </>
  );
}