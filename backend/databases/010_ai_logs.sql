CREATE TABLE ai_logs (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID REFERENCES users(id),

    feature VARCHAR(100),

    prompt TEXT,

    response TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);