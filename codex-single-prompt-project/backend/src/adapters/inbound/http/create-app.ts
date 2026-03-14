import cors from "cors";
import { existsSync } from "node:fs";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { ListRoutesUseCase } from "../../../core/application/use-cases/list-routes.js";
import { SetBaselineUseCase } from "../../../core/application/use-cases/set-baseline.js";
import { GetRouteComparisonUseCase } from "../../../core/application/use-cases/get-route-comparison.js";
import { GetComplianceBalanceUseCase } from "../../../core/application/use-cases/get-compliance-balance.js";
import { GetAdjustedComplianceUseCase } from "../../../core/application/use-cases/get-adjusted-compliance.js";
import { ListBankingRecordsUseCase } from "../../../core/application/use-cases/list-banking-records.js";
import { BankSurplusUseCase } from "../../../core/application/use-cases/bank-surplus.js";
import { ApplyBankedUseCase } from "../../../core/application/use-cases/apply-banked.js";
import { CreatePoolUseCase } from "../../../core/application/use-cases/create-pool.js";
import { pgPool } from "../../../infrastructure/db/pool.js";
import { PostgresRouteRepository } from "../../outbound/postgres/postgres-route-repository.js";
import { PostgresComplianceRepository } from "../../outbound/postgres/postgres-compliance-repository.js";
import { PostgresBankRepository } from "../../outbound/postgres/postgres-bank-repository.js";
import { PostgresPoolRepository } from "../../outbound/postgres/postgres-pool-repository.js";
import { applyBankingSchema, bankingSchema, createPoolSchema } from "./schemas.js";

export const createApp = () => {
  const routeRepository = new PostgresRouteRepository(pgPool);
  const complianceRepository = new PostgresComplianceRepository(pgPool);
  const bankRepository = new PostgresBankRepository(pgPool);
  const poolRepository = new PostgresPoolRepository(pgPool);

  const listRoutesUseCase = new ListRoutesUseCase(routeRepository);
  const setBaselineUseCase = new SetBaselineUseCase(routeRepository);
  const getRouteComparisonUseCase = new GetRouteComparisonUseCase(routeRepository);
  const getComplianceBalanceUseCase = new GetComplianceBalanceUseCase(
    routeRepository,
    complianceRepository
  );
  const getAdjustedComplianceUseCase = new GetAdjustedComplianceUseCase(
    getComplianceBalanceUseCase,
    complianceRepository,
    routeRepository
  );
  const listBankingRecordsUseCase = new ListBankingRecordsUseCase(bankRepository);
  const bankSurplusUseCase = new BankSurplusUseCase(
    getComplianceBalanceUseCase,
    bankRepository
  );
  const applyBankedUseCase = new ApplyBankedUseCase(
    getComplianceBalanceUseCase,
    bankRepository
  );
  const createPoolUseCase = new CreatePoolUseCase(poolRepository);

  const app = express();
  app.use(cors());
  app.use(express.json());

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const frontendDistDir = path.resolve(currentDir, "../../../../../frontend/dist");
  const hasFrontendBuild =
    process.env.NODE_ENV === "production" && existsSync(path.join(frontendDistDir, "index.html"));

  app.get("/health", (_request, response) => {
    response.json({ ok: true });
  });

  app.get("/routes", async (request, response, next) => {
    try {
      const year = request.query.year ? Number(request.query.year) : undefined;
      const routes = await listRoutesUseCase.execute({
        vesselType: request.query.vesselType?.toString(),
        fuelType: request.query.fuelType?.toString(),
        year
      });
      response.json(routes);
    } catch (error) {
      next(error);
    }
  });

  app.post("/routes/:routeId/baseline", async (request, response, next) => {
    try {
      const route = await setBaselineUseCase.execute(request.params.routeId);
      response.json(route);
    } catch (error) {
      next(error);
    }
  });

  app.get("/routes/comparison", async (_request, response, next) => {
    try {
      response.json(await getRouteComparisonUseCase.execute());
    } catch (error) {
      next(error);
    }
  });

  app.get("/compliance/cb", async (request, response, next) => {
    try {
      const shipId = z.string().parse(request.query.shipId);
      const year = z.coerce.number().int().parse(request.query.year);
      response.json(await getComplianceBalanceUseCase.execute(shipId, year));
    } catch (error) {
      next(error);
    }
  });

  app.get("/compliance/adjusted-cb", async (request, response, next) => {
    try {
      const year = z.coerce.number().int().parse(request.query.year);
      const shipId = request.query.shipId?.toString();
      response.json(await getAdjustedComplianceUseCase.execute(year, shipId));
    } catch (error) {
      next(error);
    }
  });

  app.get("/banking/records", async (request, response, next) => {
    try {
      const year = request.query.year ? Number(request.query.year) : undefined;
      const shipId = request.query.shipId?.toString();
      response.json(await listBankingRecordsUseCase.execute(shipId, year));
    } catch (error) {
      next(error);
    }
  });

  app.post("/banking/bank", async (request, response, next) => {
    try {
      const payload = bankingSchema.parse(request.body);
      response.status(201).json(await bankSurplusUseCase.execute(payload));
    } catch (error) {
      next(error);
    }
  });

  app.post("/banking/apply", async (request, response, next) => {
    try {
      const payload = applyBankingSchema.parse(request.body);
      response.status(201).json(await applyBankedUseCase.execute(payload));
    } catch (error) {
      next(error);
    }
  });

  app.post("/pools", async (request, response, next) => {
    try {
      const payload = createPoolSchema.parse(request.body);
      response.status(201).json(await createPoolUseCase.execute(payload));
    } catch (error) {
      next(error);
    }
  });

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction
    ) => {
      const message = error instanceof Error ? error.message : "Unexpected error";
      response.status(400).json({ message });
    }
  );

  if (hasFrontendBuild) {
    app.use(express.static(frontendDistDir));

    app.get(/^(?!\/(health|routes|compliance|banking|pools)\b).*/, (_request, response) => {
      response.sendFile(path.join(frontendDistDir, "index.html"));
    });
  }

  return app;
};
