CREATE TABLE hos_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    current_status VARCHAR(20) NOT NULL DEFAULT 'OFF', -- 'ON', 'D', 'SB', 'OFF'
    driving_seconds_remaining INT DEFAULT 39600, -- 11 Hours max driving limit
    duty_seconds_remaining INT DEFAULT 50400,    -- 14 Hours max duty shift limit
    cycle_seconds_remaining INT DEFAULT 252000,  -- 70 Hours / 8-day cycle limit
    break_seconds_remaining INT DEFAULT 28800,   -- 8 Hours until 30-min break
    shift_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_status_change_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hos_logs_driver ON hos_logs(driver_id);



CREATE TABLE IF NOT EXISTS hos_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hos_log_id UUID REFERENCES hos_logs(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    location TEXT,
    odometer INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);