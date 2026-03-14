import type { DashboardGateway } from "../ports/dashboard-gateway";

export class DashboardService {
  constructor(private readonly gateway: DashboardGateway) {}

  getRoutes = (...args: Parameters<DashboardGateway["getRoutes"]>) =>
    this.gateway.getRoutes(...args);

  setBaseline = (...args: Parameters<DashboardGateway["setBaseline"]>) =>
    this.gateway.setBaseline(...args);

  getComparisons = (...args: Parameters<DashboardGateway["getComparisons"]>) =>
    this.gateway.getComparisons(...args);

  getComplianceBalance = (
    ...args: Parameters<DashboardGateway["getComplianceBalance"]>
  ) => this.gateway.getComplianceBalance(...args);

  getAdjustedCompliance = (
    ...args: Parameters<DashboardGateway["getAdjustedCompliance"]>
  ) => this.gateway.getAdjustedCompliance(...args);

  getBankRecords = (...args: Parameters<DashboardGateway["getBankRecords"]>) =>
    this.gateway.getBankRecords(...args);

  bankSurplus = (...args: Parameters<DashboardGateway["bankSurplus"]>) =>
    this.gateway.bankSurplus(...args);

  applyBanked = (...args: Parameters<DashboardGateway["applyBanked"]>) =>
    this.gateway.applyBanked(...args);

  createPool = (...args: Parameters<DashboardGateway["createPool"]>) =>
    this.gateway.createPool(...args);
}
