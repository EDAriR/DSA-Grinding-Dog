CREATE TABLE urls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE,
    secret_key TEXT UNIQUE,
    target_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    clicks INT DEFAULT 0
);
