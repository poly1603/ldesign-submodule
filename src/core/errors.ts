/**
 * Git Submodule Manager - Error Definitions
 */

export class SubmoduleError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SubmoduleError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class SubmoduleNotFoundError extends SubmoduleError {
  constructor(path: string) {
    super(`Submodule not found at path: ${path}`, 'SUBMODULE_NOT_FOUND', { path });
  }
}

export class SubmoduleAlreadyExistsError extends SubmoduleError {
  constructor(path: string) {
    super(`Submodule already exists at path: ${path}`, 'SUBMODULE_EXISTS', { path });
  }
}

export class GitCommandError extends SubmoduleError {
  constructor(command: string, stderr: string) {
    super(`Git command failed: ${command}`, 'GIT_COMMAND_ERROR', { command, stderr });
  }
}

export class UncommittedChangesError extends SubmoduleError {
  constructor(path: string) {
    super(
      `Submodule has uncommitted changes: ${path}`,
      'UNCOMMITTED_CHANGES',
      { path }
    );
  }
}

export class InvalidUrlError extends SubmoduleError {
  constructor(url: string) {
    super(`Invalid git URL: ${url}`, 'INVALID_URL', { url });
  }
}

export class InvalidPathError extends SubmoduleError {
  constructor(path: string, reason?: string) {
    super(
      `Invalid path: ${path}${reason ? ` - ${reason}` : ''}`,
      'INVALID_PATH',
      { path, reason }
    );
  }
}

export class ConfigError extends SubmoduleError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIG_ERROR', details);
  }
}

export class NetworkError extends SubmoduleError {
  constructor(url: string, message: string) {
    super(`Network error accessing ${url}: ${message}`, 'NETWORK_ERROR', { url });
  }
}