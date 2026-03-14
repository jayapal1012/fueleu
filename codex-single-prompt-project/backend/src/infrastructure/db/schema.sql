CREATE TABLE IF NOT EXISTS routes (
  id SERIAL PRIMARY KEY,
  route_id VARCHAR(32) NOT NULL UNIQUE,
  ship_id VARCHAR(32) NOT NULL UNIQUE,
  vessel_type VARCHAR(64) NOT NULL,
  fuel_type VARCHAR(64) NOT NULL,
  year INTEGER NOT NULL,
  ghg_intensity NUMERIC(10, 4) NOT NULL,
  fuel_consumption NUMERIC(12, 2) NOT NULL,
  distance NUMERIC(12, 2) NOT NULL,
  total_emissions NUMERIC(12, 2) NOT NULL,
  is_baseline BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS ship_compliance (
  id SERIAL PRIMARY KEY,
  ship_id VARCHAR(32) NOT NULL,
  route_id VARCHAR(32) NOT NULL,
  year INTEGER NOT NULL,
  cb_gco2eq NUMERIC(18, 2) NOT NULL,
  ghg_intensity NUMERIC(10, 4) NOT NULL,
  energy_in_scope_mj NUMERIC(18, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (ship_id, year)
);

CREATE TABLE IF NOT EXISTS bank_entries (
  id SERIAL PRIMARY KEY,
  ship_id VARCHAR(32) NOT NULL,
  year INTEGER NOT NULL,
  amount_gco2eq NUMERIC(18, 2) NOT NULL,
  entry_type VARCHAR(16) NOT NULL,
  target_ship_id VARCHAR(32),
  target_year INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pools (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pool_members (
  id SERIAL PRIMARY KEY,
  pool_id INTEGER NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  ship_id VARCHAR(32) NOT NULL,
  year INTEGER NOT NULL,
  cb_before NUMERIC(18, 2) NOT NULL,
  cb_after NUMERIC(18, 2) NOT NULL
);

