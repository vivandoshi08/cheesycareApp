CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    next_match_time VARCHAR(30),
    description TEXT,
    website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE team_red_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    flag TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100),
    status_type VARCHAR(20) CHECK (status_type IN ('team', 'free', 'assistance')),
    status_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    years_of_experience INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE
);
CREATE TABLE people_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    UNIQUE(person_id, skill_id)
);
CREATE TABLE tool_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE
);
CREATE TABLE tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category_id UUID REFERENCES tool_categories(id) ON DELETE SET NULL,
    total_quantity INTEGER NOT NULL DEFAULT 1,
    available_quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (available_quantity >= 0),
    CHECK (available_quantity <= total_quantity)
);
CREATE TABLE tool_checkouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
    person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    checkout_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expected_return_time TIMESTAMP WITH TIME ZONE,
    actual_return_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    CHECK (quantity > 0)
);
CREATE TABLE tool_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
    action VARCHAR(20) CHECK (action IN ('checkout', 'return', 'maintenance')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    person_id UUID REFERENCES people(id) ON DELETE SET NULL,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    notes TEXT
);
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(100) NOT NULL,
    category VARCHAR(10) CHECK (category IN ('SW', 'AnW')),
    summary TEXT,
    link VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE document_keywords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    keyword VARCHAR(50) NOT NULL
);
CREATE TABLE team_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID REFERENCES people(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE person_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    person_id UUID REFERENCES people(id) ON DELETE CASCADE,
    activity_type VARCHAR(30) CHECK (activity_type IN ('team_assignment', 'tool_checkout', 'doc_contribution', 'note_added', 'match_participation')),
    details TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    target_id UUID,
    target_type VARCHAR(20),
    link VARCHAR(255)
);
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_number VARCHAR(20) NOT NULL,
    match_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE team_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    alliance VARCHAR(10) CHECK (alliance IN ('red', 'blue')),
    position INTEGER CHECK (position BETWEEN 1 AND 3),
    UNIQUE(match_id, alliance, position)
);
CREATE OR REPLACE FUNCTION update_tool_availability()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_active = TRUE THEN
        UPDATE tools SET available_quantity = available_quantity - NEW.quantity
        WHERE id = NEW.tool_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
            UPDATE tools SET available_quantity = available_quantity + OLD.quantity
            WHERE id = NEW.tool_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER tool_checkout_trigger
AFTER INSERT OR UPDATE ON tool_checkouts
FOR EACH ROW
EXECUTE FUNCTION update_tool_availability();
CREATE OR REPLACE FUNCTION log_tool_history()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO tool_history (tool_id, action, person_id, team_id, notes)
        VALUES (NEW.tool_id, 'checkout', NEW.person_id, NEW.team_id, NEW.notes);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
            INSERT INTO tool_history (tool_id, action, person_id, team_id, notes)
            VALUES (NEW.tool_id, 'return', NEW.person_id, NEW.team_id, NEW.notes);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER tool_history_trigger
AFTER INSERT OR UPDATE ON tool_checkouts
FOR EACH ROW
EXECUTE FUNCTION log_tool_history();
CREATE OR REPLACE FUNCTION log_person_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'tool_checkouts' AND TG_OP = 'INSERT' THEN
        INSERT INTO person_activities (person_id, activity_type, details, target_id, target_type, link)
        VALUES (
            NEW.person_id, 
            'tool_checkout', 
            (SELECT 'Checked out ' || name FROM tools WHERE id = NEW.tool_id),
            NEW.tool_id,
            'tool',
            '/tools/' || NEW.tool_id
        );
    ELSIF TG_TABLE_NAME = 'team_notes' AND TG_OP = 'INSERT' THEN
        INSERT INTO person_activities (person_id, activity_type, details, target_id, target_type, link)
        VALUES (
            NEW.created_by, 
            'note_added', 
            'Added note to team ' || (SELECT number FROM teams WHERE id = NEW.team_id),
            NEW.team_id,
            'team',
            '/teams/' || NEW.team_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER tool_checkout_activity_trigger
AFTER INSERT ON tool_checkouts
FOR EACH ROW
EXECUTE FUNCTION log_person_activity();
CREATE TRIGGER team_note_activity_trigger
AFTER INSERT ON team_notes
FOR EACH ROW
EXECUTE FUNCTION log_person_activity();
CREATE OR REPLACE FUNCTION update_person_team_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status_type = 'team' OR NEW.status_type = 'assistance' THEN
        INSERT INTO person_activities (person_id, activity_type, details, target_id, target_type, link)
        VALUES (
            NEW.id,
            'team_assignment',
            CASE 
                WHEN NEW.status_type = 'team' THEN 'Assigned to Team ' 
                ELSE 'Needs assistance with Team ' 
            END || (SELECT number FROM teams WHERE id = NEW.status_team_id),
            NEW.status_team_id,
            'team',
            '/teams/' || NEW.status_team_id
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER person_status_trigger
AFTER INSERT OR UPDATE OF status_type, status_team_id ON people
FOR EACH ROW
WHEN (NEW.status_type IN ('team', 'assistance') AND NEW.status_team_id IS NOT NULL)
EXECUTE FUNCTION update_person_team_status();
CREATE OR REPLACE FUNCTION log_document_contribution()
RETURNS TRIGGER AS $$
BEGIN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER document_contribution_trigger
AFTER INSERT ON documents
FOR EACH ROW
EXECUTE FUNCTION log_document_contribution();
INSERT INTO skills (name) VALUES 
('Software'),
('Hardware'),
('Assembly'),
('Wiring'),
('Design'),
('Fabrication'),
('Strategy'),
('Scouting'),
('PR'),
('Business');
INSERT INTO tool_categories (name) VALUES 
('Fabrication'),
('Cutting'),
('Drilling'),
('Electronics'),
('Measurement'),
('Hand Tools'),
('Power Tools'),
('Other');
CREATE OR REPLACE FUNCTION apply_auth_policies() 
RETURNS void AS $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE format('CREATE POLICY "Allow authenticated users to read %I" ON %I FOR SELECT USING (auth.role() = ''authenticated'')', 
                      table_name, table_name);
        EXECUTE format('CREATE POLICY "Allow authenticated users to insert %I" ON %I FOR INSERT WITH CHECK (auth.role() = ''authenticated'')', 
                      table_name, table_name);
        EXECUTE format('CREATE POLICY "Allow authenticated users to update %I" ON %I FOR UPDATE USING (auth.role() = ''authenticated'')', 
                      table_name, table_name);
        EXECUTE format('CREATE POLICY "Allow authenticated users to delete %I" ON %I FOR DELETE USING (auth.role() = ''authenticated'')', 
                      table_name, table_name);
    END LOOP;
END;
$$ LANGUAGE plpgsql;
SELECT apply_auth_policies();