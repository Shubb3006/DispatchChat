CREATE TABLE trip_loads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    load_id UUID REFERENCES loads(id) ON DELETE CASCADE,

    UNIQUE(trip_id, load_id)
);