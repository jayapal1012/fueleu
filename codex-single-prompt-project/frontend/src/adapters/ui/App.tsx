import { useEffect, useState } from "react";
import { DashboardService } from "../../core/application/use-dashboard";
import type {
  AdjustedComplianceSnapshot,
  BankEntry,
  BankingResult,
  ComparisonRecord,
  ComplianceSnapshot,
  PoolResult,
  RouteRecord
} from "../../core/domain/models";
import { HttpDashboardGateway } from "../infrastructure/http-dashboard-gateway";
import { BarChart } from "./components/BarChart";
import { Tabs } from "./components/Tabs";
import { formatNumber } from "../../shared/format";

const service = new DashboardService(new HttpDashboardGateway());
const tabNames = ["Routes", "Compare", "Banking", "Pooling"];

export default function App() {
  const [activeTab, setActiveTab] = useState(tabNames[0]);
  const [routes, setRoutes] = useState<RouteRecord[]>([]);
  const [routeFilters, setRouteFilters] = useState({
    vesselType: "",
    fuelType: "",
    year: ""
  });
  const [comparisons, setComparisons] = useState<ComparisonRecord[]>([]);
  const [comparisonError, setComparisonError] = useState<string | null>(null);
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [bankingResult, setBankingResult] = useState<BankingResult | null>(null);
  const [bankRecords, setBankRecords] = useState<BankEntry[]>([]);
  const [currentCompliance, setCurrentCompliance] = useState<ComplianceSnapshot | null>(null);
  const [adjustedCompliance, setAdjustedCompliance] = useState<AdjustedComplianceSnapshot[]>([]);
  const [poolResult, setPoolResult] = useState<PoolResult | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selectedBankShip, setSelectedBankShip] = useState("R002");
  const [selectedBankYear, setSelectedBankYear] = useState(2024);
  const [bankAmount, setBankAmount] = useState("100000");
  const [applyForm, setApplyForm] = useState({
    sourceShipId: "R002",
    sourceYear: 2024,
    targetShipId: "R003",
    targetYear: 2024,
    amountGco2eq: "50000"
  });
  const [poolYear, setPoolYear] = useState(2024);
  const [selectedPoolShips, setSelectedPoolShips] = useState<string[]>(["R002", "R003"]);

  useEffect(() => {
    void loadRoutes();
  }, [routeFilters.vesselType, routeFilters.fuelType, routeFilters.year]);

  useEffect(() => {
    void loadComparisons();
  }, []);

  useEffect(() => {
    void refreshBanking();
  }, [selectedBankShip, selectedBankYear]);

  useEffect(() => {
    void refreshPooling();
  }, [poolYear]);

  async function loadRoutes() {
    try {
      setRoutesError(null);
      const data = await service.getRoutes({
        vesselType: routeFilters.vesselType || undefined,
        fuelType: routeFilters.fuelType || undefined,
        year: routeFilters.year ? Number(routeFilters.year) : undefined
      });
      setRoutes(data);
    } catch (error) {
      setRoutesError((error as Error).message);
    }
  }

  async function loadComparisons() {
    try {
      setComparisonError(null);
      setComparisons(await service.getComparisons());
    } catch (error) {
      setComparisonError((error as Error).message);
    }
  }

  async function refreshBanking() {
    try {
      setFeedback(null);
      const [compliance, records] = await Promise.all([
        service.getComplianceBalance(selectedBankShip, selectedBankYear),
        service.getBankRecords(selectedBankShip, selectedBankYear)
      ]);
      setCurrentCompliance(compliance);
      setBankRecords(records);
    } catch (error) {
      setFeedback((error as Error).message);
    }
  }

  async function refreshPooling() {
    try {
      const data = await service.getAdjustedCompliance(poolYear);
      setAdjustedCompliance(Array.isArray(data) ? data : [data]);
    } catch (error) {
      setFeedback((error as Error).message);
    }
  }

  async function handleBaseline(routeId: string) {
    try {
      await service.setBaseline(routeId);
      setFeedback(`Baseline set to ${routeId}`);
      await Promise.all([loadRoutes(), loadComparisons()]);
    } catch (error) {
      setFeedback((error as Error).message);
    }
  }

  async function handleBank() {
    try {
      const result = await service.bankSurplus({
        shipId: selectedBankShip,
        year: selectedBankYear,
        amountGco2eq: Number(bankAmount)
      });
      setBankingResult(result);
      setFeedback("Surplus banked successfully.");
      await Promise.all([refreshBanking(), refreshPooling()]);
    } catch (error) {
      setFeedback((error as Error).message);
    }
  }

  async function handleApply() {
    try {
      const result = await service.applyBanked({
        sourceShipId: applyForm.sourceShipId,
        sourceYear: applyForm.sourceYear,
        targetShipId: applyForm.targetShipId,
        targetYear: applyForm.targetYear,
        amountGco2eq: Number(applyForm.amountGco2eq)
      });
      setBankingResult(result);
      setFeedback("Banked surplus applied.");
      await Promise.all([refreshBanking(), refreshPooling()]);
    } catch (error) {
      setFeedback((error as Error).message);
    }
  }

  async function handleCreatePool() {
    try {
      const members = adjustedCompliance
        .filter((item) => selectedPoolShips.includes(item.shipId))
        .map((item) => ({
          shipId: item.shipId,
          year: item.year,
          adjustedCb: item.adjustedCb
        }));

      const result = await service.createPool({
        year: poolYear,
        members
      });
      setPoolResult(result);
      setFeedback("Pool created successfully.");
    } catch (error) {
      setFeedback((error as Error).message);
    }
  }

  const baseline = routes.find((route) => route.isBaseline);
  const filteredPoolMembers = adjustedCompliance.filter((item) =>
    selectedPoolShips.includes(item.shipId)
  );
  const poolSum = filteredPoolMembers.reduce((sum, member) => sum + member.adjustedCb, 0);
  const uniqueVessels = [...new Set(routes.map((route) => route.vesselType))];
  const uniqueFuels = [...new Set(routes.map((route) => route.fuelType))];
  const uniqueYears = [...new Set(routes.map((route) => route.year))].sort();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.15),_transparent_35%),linear-gradient(135deg,_#f8fafc,_#ecfeff_45%,_#fff7ed)] px-4 py-10 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="grid gap-6 rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-xl shadow-cyan-950/5 backdrop-blur">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-teal-700">
              FuelEU Maritime
            </p>
            <h1 className="max-w-3xl font-serif text-4xl leading-tight md:text-6xl">
              Compliance operations for routes, banking, and pooling.
            </h1>
            <p className="max-w-2xl text-base text-slate-600 md:text-lg">
              A minimal full-stack dashboard with a clean ports-and-adapters core and
              live PostgreSQL-backed compliance logic.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Tabs activeTab={activeTab} onChange={setActiveTab} tabs={tabNames} />
            {feedback ? (
              <p className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
                {feedback}
              </p>
            ) : null}
          </div>
        </header>

        {activeTab === "Routes" ? (
          <section className="grid gap-6">
            <div className="grid gap-4 rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm md:grid-cols-4">
              <label className="grid gap-2 text-sm">
                Vessel Type
                <select
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  value={routeFilters.vesselType}
                  onChange={(event) =>
                    setRouteFilters((current) => ({
                      ...current,
                      vesselType: event.target.value
                    }))
                  }
                >
                  <option value="">All</option>
                  {uniqueVessels.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                Fuel Type
                <select
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  value={routeFilters.fuelType}
                  onChange={(event) =>
                    setRouteFilters((current) => ({
                      ...current,
                      fuelType: event.target.value
                    }))
                  }
                >
                  <option value="">All</option>
                  {uniqueFuels.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm">
                Year
                <select
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  value={routeFilters.year}
                  onChange={(event) =>
                    setRouteFilters((current) => ({
                      ...current,
                      year: event.target.value
                    }))
                  }
                >
                  <option value="">All</option>
                  {uniqueYears.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Baseline</p>
                <p className="mt-2 font-serif text-3xl">{baseline?.routeId ?? "Unset"}</p>
              </div>
            </div>

            {routesError ? <p className="text-sm text-rose-600">{routesError}</p> : null}

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      {[
                        "routeId",
                        "vesselType",
                        "fuelType",
                        "year",
                        "ghgIntensity",
                        "fuelConsumption",
                        "distance",
                        "totalEmissions",
                        "action"
                      ].map((heading) => (
                        <th key={heading} className="px-4 py-3 font-semibold">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map((route) => (
                      <tr key={route.routeId} className="border-t border-slate-100">
                        <td className="px-4 py-3">{route.routeId}</td>
                        <td className="px-4 py-3">{route.vesselType}</td>
                        <td className="px-4 py-3">{route.fuelType}</td>
                        <td className="px-4 py-3">{route.year}</td>
                        <td className="px-4 py-3">{formatNumber(route.ghgIntensity, 4)}</td>
                        <td className="px-4 py-3">{formatNumber(route.fuelConsumption, 0)}</td>
                        <td className="px-4 py-3">{formatNumber(route.distance, 0)}</td>
                        <td className="px-4 py-3">{formatNumber(route.totalEmissions, 0)}</td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className={`rounded-full px-4 py-2 ${
                              route.isBaseline
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-900 text-white"
                            }`}
                            onClick={() => void handleBaseline(route.routeId)}
                          >
                            {route.isBaseline ? "Baseline" : "Set Baseline"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === "Compare" ? (
          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
              {comparisonError ? (
                <p className="p-6 text-sm text-rose-600">{comparisonError}</p>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Route</th>
                      <th className="px-4 py-3 font-semibold">Baseline</th>
                      <th className="px-4 py-3 font-semibold">GHG Intensity</th>
                      <th className="px-4 py-3 font-semibold">% Difference</th>
                      <th className="px-4 py-3 font-semibold">Compliant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisons.map((row) => (
                      <tr key={row.routeId} className="border-t border-slate-100">
                        <td className="px-4 py-3">{row.routeId}</td>
                        <td className="px-4 py-3">{row.baselineRouteId}</td>
                        <td className="px-4 py-3">{formatNumber(row.ghgIntensity, 4)}</td>
                        <td className="px-4 py-3">{formatNumber(row.percentDiff, 2)}%</td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              row.compliant
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {row.compliant ? "Yes" : "No"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <BarChart
              baseline={baseline?.ghgIntensity ?? 0}
              values={comparisons.map((item) => ({
                label: item.routeId,
                value: item.ghgIntensity
              }))}
            />
          </section>
        ) : null}

        {activeTab === "Banking" ? (
          <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  Ship
                  <select
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    value={selectedBankShip}
                    onChange={(event) => setSelectedBankShip(event.target.value)}
                  >
                    {routes.map((route) => (
                      <option key={route.shipId} value={route.shipId}>
                        {route.shipId}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2 text-sm">
                  Year
                  <select
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    value={selectedBankYear}
                    onChange={(event) => setSelectedBankYear(Number(event.target.value))}
                  >
                    {uniqueYears.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard
                  label="CB Before"
                  value={currentCompliance ? formatNumber(currentCompliance.cbGco2eq, 2) : "--"}
                />
                <MetricCard
                  label="Applied"
                  value={bankingResult ? formatNumber(bankingResult.applied, 2) : "0.00"}
                />
                <MetricCard
                  label="CB After"
                  value={bankingResult ? formatNumber(bankingResult.cbAfter, 2) : "--"}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  Bank amount
                  <input
                    className="rounded-2xl border border-slate-200 px-4 py-3"
                    value={bankAmount}
                    onChange={(event) => setBankAmount(event.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="self-end rounded-2xl bg-slate-900 px-5 py-3 text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  onClick={() => void handleBank()}
                  disabled={!currentCompliance || currentCompliance.cbGco2eq <= 0}
                >
                  Bank positive CB
                </button>
              </div>

              <div className="grid gap-4">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Apply banked surplus
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <select
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    value={applyForm.sourceShipId}
                    onChange={(event) =>
                      setApplyForm((current) => ({
                        ...current,
                        sourceShipId: event.target.value
                      }))
                    }
                  >
                    {routes.map((route) => (
                      <option key={`source-${route.shipId}`} value={route.shipId}>
                        Source {route.shipId}
                      </option>
                    ))}
                  </select>
                  <select
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                    value={applyForm.targetShipId}
                    onChange={(event) =>
                      setApplyForm((current) => ({
                        ...current,
                        targetShipId: event.target.value
                      }))
                    }
                  >
                    {routes.map((route) => (
                      <option key={`target-${route.shipId}`} value={route.shipId}>
                        Target {route.shipId}
                      </option>
                    ))}
                  </select>
                  <input
                    className="rounded-2xl border border-slate-200 px-4 py-3"
                    value={applyForm.amountGco2eq}
                    onChange={(event) =>
                      setApplyForm((current) => ({
                        ...current,
                        amountGco2eq: event.target.value
                      }))
                    }
                  />
                  <button
                    type="button"
                    className="rounded-2xl bg-emerald-500 px-5 py-3 font-medium text-slate-950"
                    onClick={() => void handleApply()}
                  >
                    Apply banked surplus
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Target</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {bankRecords.map((record) => (
                    <tr key={record.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">{record.entryType}</td>
                      <td className="px-4 py-3">{formatNumber(record.amountGco2eq, 2)}</td>
                      <td className="px-4 py-3">
                        {record.targetShipId ? `${record.targetShipId} (${record.targetYear})` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {activeTab === "Pooling" ? (
          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-sm">
              <label className="grid gap-2 text-sm">
                Pool year
                <select
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  value={poolYear}
                  onChange={(event) => setPoolYear(Number(event.target.value))}
                >
                  {uniqueYears.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-3">
                {adjustedCompliance.map((member) => {
                  const checked = selectedPoolShips.includes(member.shipId);

                  return (
                    <label
                      key={member.shipId}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{member.shipId}</p>
                        <p className="text-sm text-slate-500">
                          Before {formatNumber(member.adjustedCb, 2)}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedPoolShips((current) =>
                            checked
                              ? current.filter((shipId) => shipId !== member.shipId)
                              : [...current, member.shipId]
                          )
                        }
                      />
                    </label>
                  );
                })}
              </div>

              <div
                className={`rounded-2xl px-5 py-4 text-sm font-semibold ${
                  poolSum >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                }`}
              >
                Pool sum {formatNumber(poolSum, 2)}
              </div>

              <button
                type="button"
                className="rounded-2xl bg-slate-900 px-5 py-3 text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={selectedPoolShips.length === 0 || poolSum < 0}
                onClick={() => void handleCreatePool()}
              >
                Create Pool
              </button>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white/90 shadow-sm">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Ship</th>
                    <th className="px-4 py-3 font-semibold">Adjusted CB Before</th>
                    <th className="px-4 py-3 font-semibold">CB After</th>
                  </tr>
                </thead>
                <tbody>
                  {(poolResult?.members ?? filteredPoolMembers).map((member) => (
                    <tr key={member.shipId} className="border-t border-slate-100">
                      <td className="px-4 py-3">{member.shipId}</td>
                      <td className="px-4 py-3">
                        {formatNumber("cbBefore" in member ? member.cbBefore : member.adjustedCb, 2)}
                      </td>
                      <td className="px-4 py-3">
                        {formatNumber("cbAfter" in member ? member.cbAfter : member.adjustedCb, 2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-slate-950 px-5 py-4 text-white">
      <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">{label}</p>
      <p className="mt-2 font-serif text-3xl">{value}</p>
    </div>
  );
}

