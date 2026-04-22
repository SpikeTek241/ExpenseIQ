import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type AnalyticsPageProps = {
  categoryChartData: { category: string; total: number }[];
};

export default function AnalyticsPage({
  categoryChartData,
}: AnalyticsPageProps) {
  return (
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
  );
}