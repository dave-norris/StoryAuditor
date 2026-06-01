/**
 * Database Connection Types
 * 
 * This module defines all TypeScript interfaces and types used throughout
 * the database connection feature, including configuration, status tracking,
 * error handling, and schema validation.
 */

/**
 * Configuration for database connection
 * 
 * Defines the parameters needed to establish and manage a database connection,
 * including connection pool settings and timeout configurations.
 */
export interface DatabaseConfig {
  /** PostgreSQL connection URL in format: postgresql://user:password@host:port/database */
  url: string;
  
  /** Minimum number of connections in the pool (default: 2) */
  poolSize?: number;
  
  /** Connection timeout in milliseconds (default: 5000) */
  timeout?: number;
  
  /** Maximum number of reconnection attempts (default: 3) */
  maxRetries?: number;
}

/**
 * Current status of the database connection
 * 
 * Tracks the health and state of the database connection pool,
 * including error information for debugging.
 */
export interface ConnectionStatus {
  /** Whether the connection is currently active */
  connected: boolean;
  
  /** Total size of the connection pool */
  poolSize: number;
  
  /** Number of currently active connections */
  activeConnections: number;
  
  /** Last error message encountered, if any */
  lastError?: string;
  
  /** Timestamp of the last error, if any */
  lastErrorTime?: Date;
}

/**
 * Parsed components of a PostgreSQL connection URL
 * 
 * Represents the individual components extracted from a connection string,
 * allowing for validation and manipulation of connection parameters.
 */
export interface ParsedDatabaseUrl {
  /** Protocol (e.g., 'postgresql') */
  protocol: string;
  
  /** Username for authentication */
  username: string;
  
  /** Password for authentication */
  password: string;
  
  /** Host address (e.g., 'localhost') */
  host: string;
  
  /** Port number (default: 5432) */
  port: number;
  
  /** Database name */
  database: string;
  
  /** Optional parameters (e.g., sslmode, connection_limit) */
  params: Record<string, string>;
}

/**
 * Database error with context and suggestions
 * 
 * Represents a database error with full context for logging and debugging,
 * including error type, message, and actionable suggestions.
 */
export interface DatabaseError {
  /** Type of error that occurred */
  type: 'connection_failed' | 'timeout' | 'query_failed' | 'schema_mismatch' | 'invalid_config';
  
  /** Human-readable error message */
  message: string;
  
  /** Original error object, if available */
  originalError?: Error;
  
  /** Context information about the error */
  context: {
    /** Name of the operation that failed */
    operation: string;
    
    /** Timestamp when the error occurred */
    timestamp: Date;
    
    /** Duration of the operation in milliseconds, if applicable */
    duration?: number;
  };
  
  /** Suggestion for resolving the error */
  suggestion?: string;
}

/**
 * Result of a health check operation
 * 
 * Indicates the current health status of the database connection
 * with timing information for performance monitoring.
 */
export interface HealthCheckResult {
  /** Health status: 'healthy', 'unhealthy', or 'timeout' */
  status: 'healthy' | 'unhealthy' | 'timeout';
  
  /** Descriptive message about the health status */
  message: string;
  
  /** Response time in milliseconds */
  responseTime: number;
  
  /** Timestamp of the health check */
  timestamp: Date;
}

/**
 * Result of schema validation
 * 
 * Indicates whether the database schema matches the Prisma schema definition,
 * with details about any mismatches found.
 */
export interface SchemaValidationResult {
  /** Whether the schema is valid and in sync */
  valid: boolean;
  
  /** Array of schema mismatches found */
  mismatches: SchemaMismatch[];
  
  /** Descriptive message about the validation result */
  message: string;
  
  /** Response time in milliseconds */
  responseTime: number;
  
  /** Timestamp of the validation */
  timestamp: Date;
}

/**
 * A single schema mismatch between database and Prisma schema
 * 
 * Describes a specific difference found during schema validation,
 * with guidance on how to resolve it.
 */
export interface SchemaMismatch {
  /** Type of mismatch detected */
  type: 'missing_table' | 'missing_column' | 'type_mismatch' | 'constraint_mismatch';
  
  /** Name of the affected table */
  table: string;
  
  /** Name of the affected column (if applicable) */
  column?: string;
  
  /** Expected value according to Prisma schema */
  expected: string;
  
  /** Actual value in the database */
  actual?: string;
  
  /** Guidance on how to resolve this mismatch */
  resolution: string;
}

/**
 * Database schema information
 * 
 * Represents the complete schema of a PostgreSQL database,
 * including tables, columns, and constraints.
 */
export interface DatabaseSchema {
  /** List of tables in the database */
  tables: TableSchema[];
  
  /** List of constraints in the database */
  constraints: ConstraintSchema[];
}

/**
 * Schema information for a single table
 * 
 * Describes the structure of a table including its columns and their types.
 */
export interface TableSchema {
  /** Name of the table */
  name: string;
  
  /** List of columns in the table */
  columns: ColumnSchema[];
}

/**
 * Schema information for a single column
 * 
 * Describes the properties of a column including its type and constraints.
 */
export interface ColumnSchema {
  /** Name of the column */
  name: string;
  
  /** Data type of the column */
  type: string;
  
  /** Whether the column is nullable */
  nullable: boolean;
  
  /** Default value for the column, if any */
  defaultValue?: string;
}

/**
 * Schema information for a constraint
 * 
 * Describes a database constraint such as primary key, foreign key, or unique constraint.
 */
export interface ConstraintSchema {
  /** Name of the constraint */
  name: string;
  
  /** Type of constraint */
  type: 'primary_key' | 'foreign_key' | 'unique' | 'check';
  
  /** Table affected by the constraint */
  table: string;
  
  /** Columns affected by the constraint */
  columns: string[];
}

/**
 * Prisma schema information
 * 
 * Represents the schema definition from the Prisma schema file.
 */
export interface PrismaSchema {
  /** List of models defined in Prisma schema */
  models: PrismaModel[];
}

/**
 * Prisma model definition
 * 
 * Represents a single model (table) defined in the Prisma schema.
 */
export interface PrismaModel {
  /** Name of the model */
  name: string;
  
  /** List of fields in the model */
  fields: PrismaField[];
}

/**
 * Prisma field definition
 * 
 * Represents a single field (column) in a Prisma model.
 */
export interface PrismaField {
  /** Name of the field */
  name: string;
  
  /** Type of the field */
  type: string;
  
  /** Whether the field is required (not nullable) */
  isRequired: boolean;
  
  /** Whether the field is a primary key */
  isPrimaryKey: boolean;
}

/**
 * CLI test result
 * 
 * Represents the complete result of running the database connection test utility.
 */
export interface CliTestResult {
  /** Result of the connection test */
  connectionTest: {
    success: boolean;
    message: string;
    duration: number;
  };
  
  /** Result of the schema validation */
  schemaValidation: {
    success: boolean;
    message: string;
    duration: number;
    mismatches?: SchemaMismatch[];
  };
  
  /** Information about the database */
  databaseInfo: {
    version?: string;
    name?: string;
    user?: string;
  };
  
  /** Overall status of all tests */
  overallStatus: 'success' | 'warning' | 'failure';
  
  /** Array of suggestions for resolving issues */
  suggestions: string[];
}

/**
 * Database information
 * 
 * Represents metadata about the connected database.
 */
export interface DatabaseInfo {
  /** PostgreSQL version */
  version?: string;
  
  /** Database name */
  name?: string;
  
  /** Current database user */
  user?: string;
}
