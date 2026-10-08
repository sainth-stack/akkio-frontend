/**
 * Two generic prompt formats — any domain (ops, ecommerce, monitoring, CRM, etc.).
 * User edits bracketed placeholders, then sends.
 */
export const SAMPLE_PROMPT_TEMPLATES = [
    {
        id: 'operations_records_v1',
        title: 'Operations & records',
        subtitle: 'Dashboard, lists, workflows, two report layouts',
        prompt: `Build an operations app for a [industry / company type].

Core entities (tables with list + detail pages):
- [Entity 1, e.g. customers or materials]
- [Entity 2, e.g. orders or purchase orders]
- [Entity 3, e.g. suppliers or locations]

Dashboard KPIs (must show realistic non-zero demo numbers):
- [KPI 1]
- [KPI 2]
- [KPI 3]
- [KPI 4]

Pages:
- Dashboard with KPI cards and at least one chart
- Searchable tables for each main entity
- Alerts or tasks for exceptions (low stock, delays, etc.)
- Reports page with two sample templates: (1) Summary report — KPIs plus a breakdown table (2) Detail table — one row per record

Workflows: [e.g. create → review → approve → complete].

Ship realistic synthetic demo data on every screen by default. No login required.`,
    },
    {
        id: 'monitoring_insights_v1',
        title: 'Monitoring & insights',
        subtitle: 'Metrics, alerts, trends, summary + detail reports',
        prompt: `Build a monitoring and insights app for [domain / use case, e.g. equipment, sales, or quality].

Metrics to track (with thresholds):
- [Metric 1 + unit]
- [Metric 2 + unit]
- [Metric 3 + unit]

Dashboard:
- KPI tiles (counts, rates, scores — non-zero demo values)
- Trend or time-series chart
- Highlight recent anomalies, alerts, or outliers

Pages:
- Main dashboard
- Event / anomaly / alert feed with severity and status
- Simple rules or threshold configuration
- Reports page with two sample templates: (1) Summary report — KPIs plus breakdown table (2) Detail table — one row per event or record

Use realistic synthetic demo data everywhere. No login required.`,
    },
];
