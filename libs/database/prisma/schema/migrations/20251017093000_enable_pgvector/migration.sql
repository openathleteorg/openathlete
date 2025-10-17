-- Enable pgvector extension for semantic search and embeddings
-- Required by Mastra Memory for vector storage and semantic recall

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create schema for Mastra if it doesn't exist
-- This schema will contain Mastra's memory tables (threads, messages, embeddings)
CREATE SCHEMA IF NOT EXISTS mastra;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA mastra TO CURRENT_USER;
GRANT CREATE ON SCHEMA mastra TO CURRENT_USER;
