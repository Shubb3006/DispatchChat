-- Customer detention billing configuration
ALTER TABLE customers ADD COLUMN IF NOT EXISTS detention_free_minutes INT DEFAULT 120;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS detention_rate_per_hour NUMERIC(10, 2) DEFAULT 75.00;
