-- users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    nickname VARCHAR(100),
    alias VARCHAR(50),
    profile_image_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- books Table
CREATE TABLE IF NOT EXISTS books (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    google_books_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    author VARCHAR(255) NOT NULL,
    publisher VARCHAR(255),
    published_date VARCHAR(50),
    description TEXT,
    total_page INTEGER DEFAULT 0,
    read_page INTEGER DEFAULT 0,
    progress NUMERIC(5, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'reading', 'completed')),
    start_date DATE,
    completed_date DATE,
    total_reading_time INTEGER DEFAULT 0,
    memo TEXT,
    thumbnail TEXT,
    isbn10 VARCHAR(20),
    isbn13 VARCHAR(20),
    language VARCHAR(10),
    categories TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- reading_sessions Table
CREATE TABLE IF NOT EXISTS reading_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    start_page INTEGER,
    end_page INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- postings Table
CREATE TABLE IF NOT EXISTS postings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE SET NULL,
    book_title VARCHAR(255),
    book_author VARCHAR(255),
    book_thumbnail TEXT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_date DATE
);

-- tags Table
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- posting_tags (Junction Table)
CREATE TABLE IF NOT EXISTS posting_tags (
    posting_id INTEGER REFERENCES postings(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (posting_id, tag_id)
);

-- locations Table
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('library', 'bookstore')),
    address TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    tel VARCHAR(50),
    homepage TEXT,
    operating_time TEXT,
    closed_days TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- inventory Table
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    book_title VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 0,
    available_quantity INTEGER DEFAULT 0,
    price NUMERIC(10, 2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- likes Table
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    posting_id INTEGER REFERENCES postings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, posting_id)
);

-- comments Table
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    posting_id INTEGER REFERENCES postings(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- bookmarks Table
CREATE TABLE IF NOT EXISTS bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, book_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_books_user_id ON books (user_id);
CREATE INDEX IF NOT EXISTS idx_books_title ON books (title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books (author);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_user_id ON reading_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_reading_sessions_book_id ON reading_sessions (book_id);
CREATE INDEX IF NOT EXISTS idx_postings_user_id ON postings (user_id);
CREATE INDEX IF NOT EXISTS idx_postings_book_id ON postings (book_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags (name);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations (type);
CREATE INDEX IF NOT EXISTS idx_locations_coords ON locations (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_inventory_location_id ON inventory (location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_book_id ON inventory (book_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes (user_id);
CREATE INDEX IF NOT EXISTS idx_likes_posting_id ON likes (posting_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_posting_id ON comments (posting_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_book_id ON bookmarks (book_id);

-- Function to update updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic updated_at updates
CREATE OR REPLACE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_books_updated_at
BEFORE UPDATE ON books
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_postings_updated_at
BEFORE UPDATE ON postings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_locations_updated_at
BEFORE UPDATE ON locations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_comments_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

