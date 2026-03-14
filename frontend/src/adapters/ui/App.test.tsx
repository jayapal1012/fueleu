import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

const routes = [
  {
    id: 1,
    routeId: "R001",
    shipId: "R001",
    vesselType: "Container",
    fuelType: "HFO",
    year: 2024,
    ghgIntensity: 91,
    fuelConsumption: 5000,
    distance: 12000,
    totalEmissions: 4500,
    isBaseline: true
  },
  {
    id: 2,
    routeId: "R002",
    shipId: "R002",
    vesselType: "BulkCarrier",
    fuelType: "LNG",
    year: 2024,
    ghgIntensity: 88,
    fuelConsumption: 4800,
    distance: 11500,
    totalEmissions: 4200,
    isBaseline: false
  },
  {
    id: 3,
    routeId: "R003",
    shipId: "R003",
    vesselType: "Tanker",
    fuelType: "MGO",
    year: 2024,
    ghgIntensity: 93.5,
    fuelConsumption: 5100,
    distance: 12500,
    totalEmissions: 4700,
    isBaseline: false
  }
];

const comparisons = [
  {
    routeId: "R002",
    baselineRouteId: "R001",
    ghgIntensity: 88,
    baselineIntensity: 91,
    percentDiff: -3.3,
    compliant: true
  }
];

const adjusted = [
  {
    shipId: "R002",
    routeId: "R002",
    year: 2024,
    cbGco2eq: 1,
    ghgIntensity: 88,
    energyInScopeMj: 1,
    bankedAvailable: 1,
    applied: 0,
    adjustedCb: 100
  },
  {
    shipId: "R003",
    routeId: "R003",
    year: 2024,
    cbGco2eq: -1,
    ghgIntensity: 93.5,
    energyInScopeMj: 1,
    bankedAvailable: 0,
    applied: 0,
    adjustedCb: -20
  }
];

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string, init?: RequestInit) => {
        if (input.includes("/routes/comparison")) {
          return new Response(JSON.stringify(comparisons));
        }

        if (input.includes("/routes") && !input.includes("/comparison")) {
          if (init?.method === "POST") {
            return new Response(JSON.stringify(routes[1]));
          }

          return new Response(JSON.stringify(routes));
        }

        if (input.includes("/compliance/cb")) {
          return new Response(
            JSON.stringify({
              shipId: "R002",
              routeId: "R002",
              year: 2024,
              cbGco2eq: 100,
              ghgIntensity: 88,
              energyInScopeMj: 10
            })
          );
        }

        if (input.includes("/compliance/adjusted-cb")) {
          return new Response(JSON.stringify(adjusted));
        }

        if (input.includes("/banking/records")) {
          return new Response(JSON.stringify([]));
        }

        if (input.includes("/banking/bank") || input.includes("/banking/apply")) {
          return new Response(
            JSON.stringify({
              cbBefore: 100,
              applied: 50,
              cbAfter: 50
            })
          );
        }

        if (input.includes("/pools")) {
          return new Response(
            JSON.stringify({
              poolId: 1,
              year: 2024,
              sumBefore: 80,
              sumAfter: 80,
              members: [
                { shipId: "R002", year: 2024, cbBefore: 100, cbAfter: 80 },
                { shipId: "R003", year: 2024, cbBefore: -20, cbAfter: 0 }
              ]
            })
          );
        }

        return new Response(JSON.stringify({}), { status: 404 });
      })
    );
  });

  it("renders routes and compare data", async () => {
    render(<App />);

    expect((await screen.findAllByRole("button", { name: "Set Baseline" })).length).toBe(2);

    await userEvent.click(screen.getByRole("button", { name: "Compare" }));

    expect(await screen.findByText("Baseline vs comparison")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  it("disables pool creation when the selected sum is negative", async () => {
    render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: "Pooling" }));

    await waitFor(() => {
      expect(screen.getByText(/Pool sum/i)).toBeInTheDocument();
    });

    const createPoolButton = screen.getByRole("button", { name: "Create Pool" });
    expect(createPoolButton).toBeEnabled();

    const firstCheckbox = screen.getAllByRole("checkbox")[0];
    await userEvent.click(firstCheckbox);

    expect(createPoolButton).toBeDisabled();
  });
});
