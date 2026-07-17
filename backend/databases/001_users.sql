CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    username VARCHAR(50) UNIQUE NOT NULL,

    full_name VARCHAR(150) NOT NULL,

    password VARCHAR(255) NOT NULL,

    role VARCHAR(30) NOT NULL CHECK (
        role IN (
            'ADMIN',
            'DISPATCHER',
            'DRIVER',
            'ACCOUNTING',
            'CUSTOMER',
            'admin'
        )
    ),

    allowed_modules TEXT[] DEFAULT '{}',

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);