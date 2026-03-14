import type {
  AdjustedComplianceSnapshot,
  ComplianceSnapshot
} from "../domain/compliance.js";

export interface ComplianceRepository {
  upsert(snapshot: ComplianceSnapshot): Promise<ComplianceSnapshot>;
  getSnapshot(shipId: string, year: number): Promise<ComplianceSnapshot | null>;
  listSnapshotsByYear(year: number): Promise<ComplianceSnapshot[]>;
  getAdjustedSnapshot(
    shipId: string,
    year: number
  ): Promise<AdjustedComplianceSnapshot | null>;
  listAdjustedByYear(year: number): Promise<AdjustedComplianceSnapshot[]>;
}

