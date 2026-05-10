
CREATE TYPE language_enum AS ENUM ('portuguese', 'english', 'spanish');
CREATE TYPE currency_enum AS ENUM ('real', 'dollar', 'euro');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    language language_enum NOT NULL DEFAULT 'portuguese',
    currency currency_enum NOT NULL DEFAULT 'real',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE verification (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    language language_enum NOT NULL DEFAULT 'portuguese',
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE password_reset (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);



CREATE TABLE expense_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(70) NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'Home',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE income_source (
    id SERIAL PRIMARY KEY,
    name VARCHAR(70) NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'DollarSign',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE expense (
    id SERIAL PRIMARY KEY,
    name VARCHAR(70) NOT NULL,
    value DECIMAL(11,2) NOT NULL CHECK (value > 0),
    recurring BOOLEAN NOT NULL DEFAULT FALSE,
    date DATE NOT NULL,
    due_date DATE DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expense_category_id INT REFERENCES expense_category(id),
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE income (
    id SERIAL PRIMARY KEY,
    name VARCHAR(70) NOT NULL,
    value DECIMAL(11,2) NOT NULL CHECK (value > 0),
    recurring BOOLEAN NOT NULL DEFAULT FALSE,
    date DATE NOT NULL,
    due_date DATE DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    income_source_id INT REFERENCES income_source(id),
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE expense_exclusion (
    id SERIAL PRIMARY KEY,
    expense_id INT NOT NULL REFERENCES expense(id) ON DELETE CASCADE,
    exclusion_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE income_exclusion (
    id SERIAL PRIMARY KEY,
    income_id INT NOT NULL REFERENCES income(id) ON DELETE CASCADE,
    exclusion_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE goal (
    id SERIAL PRIMARY KEY,
    name VARCHAR(70) NOT NULL,
    description TEXT,
    value DECIMAL(11,2) NOT NULL CHECK (value > 0),
    current_value DECIMAL(11,2) NOT NULL DEFAULT 0 CHECK (current_value >= 0),
    monthly_savings DECIMAL(11,2) NOT NULL DEFAULT 0 CHECK (monthly_savings >= 0),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE goal_contribution (
    id SERIAL PRIMARY KEY,
    value DECIMAL(11,2) NOT NULL CHECK (value >= 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    observation TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    goal_id INT NOT NULL REFERENCES goal(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_verification_email ON verification(email);
CREATE INDEX idx_password_reset_email ON password_reset(email);
CREATE INDEX idx_expense_category_user_id ON expense_category(user_id);
CREATE INDEX idx_income_source_user_id ON income_source(user_id);
CREATE INDEX idx_expense_user_id ON expense(user_id);
CREATE INDEX idx_income_user_id ON income(user_id);
CREATE INDEX idx_expense_exclusion_expense_id ON expense_exclusion(expense_id);
CREATE INDEX idx_expense_exclusion_user_id ON expense_exclusion(user_id);
CREATE INDEX idx_income_exclusion_income_id ON income_exclusion(income_id);
CREATE INDEX idx_income_exclusion_user_id ON income_exclusion(user_id);
CREATE INDEX idx_goal_user_id ON goal(user_id);
CREATE INDEX idx_goal_contribution_goal_id ON goal_contribution(goal_id);
CREATE INDEX idx_goal_contribution_user_id ON goal_contribution(user_id);
CREATE INDEX idx_expense_date ON expense(date);
CREATE INDEX idx_income_date ON income(date);
CREATE INDEX idx_expense_category_id ON expense(expense_category_id);
CREATE INDEX idx_goal_contribution_date ON goal_contribution(date);

CREATE OR REPLACE FUNCTION update_goal_current_value()
RETURNS TRIGGER AS $$
DECLARE
    target_goal_id INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_goal_id := OLD.goal_id;
    ELSE
        target_goal_id := NEW.goal_id;
    END IF;

    UPDATE goal
    SET current_value = (
        SELECT COALESCE(SUM(value), 0)
        FROM goal_contribution
        WHERE goal_id = target_goal_id
    )
    WHERE id = target_goal_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_goal ON goal_contribution;
CREATE TRIGGER trigger_update_goal
AFTER INSERT OR UPDATE OR DELETE ON goal_contribution
FOR EACH ROW
EXECUTE FUNCTION update_goal_current_value();
