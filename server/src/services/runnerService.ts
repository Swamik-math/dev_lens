import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { ExecutionRequest, ExecutionResult, SupportedLanguage } from '../shared/types';

export class RunnerService {
  private maxTimeoutMs = 5000;

  public async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    const { code, language, stdin = '' } = request;
    const runId = uuidv4();
    const tempDir = path.join(os.tmpdir(), `devlens-run-${runId}`);

    try {
      fs.mkdirSync(tempDir, { recursive: true });

      switch (language) {
        case 'cpp':
          return await this.runCpp(tempDir, code, stdin);
        case 'python':
          return await this.runPython(tempDir, code, stdin);
        case 'javascript':
          return await this.runJavaScript(tempDir, code, stdin);
        case 'typescript':
          return await this.runTypeScript(tempDir, code, stdin);
        case 'java':
          return await this.runJava(tempDir, code, stdin);
        default:
          return {
            stdout: '',
            stderr: `Unsupported language: ${language}`,
            exitCode: 1,
            executionTimeMs: 0,
            status: 'error'
          };
      }
    } finally {
      // Always cleanup temporary execution artifacts
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }

  private async runCpp(dir: string, code: string, stdin: string): Promise<ExecutionResult> {
    const srcPath = path.join(dir, 'main.cpp');
    const binPath = path.join(dir, 'main');
    fs.writeFileSync(srcPath, code, 'utf-8');

    // 1. Compile
    const compileStartTime = Date.now();
    const compileResult = await this.spawnProcess('g++', ['-O2', '-std=c++17', srcPath, '-o', binPath], '', 10000);
    
    if (compileResult.exitCode !== 0) {
      return {
        stdout: '',
        stderr: `Compilation Error:\n${compileResult.stderr || compileResult.stdout}`,
        exitCode: compileResult.exitCode,
        executionTimeMs: Date.now() - compileStartTime,
        status: 'error'
      };
    }

    // 2. Execute
    const startTime = Date.now();
    const runResult = await this.spawnProcess(binPath, [], stdin, this.maxTimeoutMs);
    const executionTimeMs = Date.now() - startTime;

    return {
      stdout: runResult.stdout,
      stderr: runResult.stderr,
      exitCode: runResult.exitCode,
      executionTimeMs,
      status: runResult.timedOut ? 'timeout' : (runResult.exitCode === 0 ? 'success' : 'error')
    };
  }

  private async runPython(dir: string, code: string, stdin: string): Promise<ExecutionResult> {
    const srcPath = path.join(dir, 'main.py');
    fs.writeFileSync(srcPath, code, 'utf-8');

    const startTime = Date.now();
    const result = await this.spawnProcess('python3', [srcPath], stdin, this.maxTimeoutMs);
    const executionTimeMs = Date.now() - startTime;

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      executionTimeMs,
      status: result.timedOut ? 'timeout' : (result.exitCode === 0 ? 'success' : 'error')
    };
  }

  private async runJavaScript(dir: string, code: string, stdin: string): Promise<ExecutionResult> {
    const srcPath = path.join(dir, 'main.js');
    fs.writeFileSync(srcPath, code, 'utf-8');

    const startTime = Date.now();
    const result = await this.spawnProcess('node', [srcPath], stdin, this.maxTimeoutMs);
    const executionTimeMs = Date.now() - startTime;

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      executionTimeMs,
      status: result.timedOut ? 'timeout' : (result.exitCode === 0 ? 'success' : 'error')
    };
  }

  private async runTypeScript(dir: string, code: string, stdin: string): Promise<ExecutionResult> {
    const srcPath = path.join(dir, 'main.ts');
    fs.writeFileSync(srcPath, code, 'utf-8');

    const startTime = Date.now();
    const result = await this.spawnProcess('npx', ['tsx', srcPath], stdin, this.maxTimeoutMs);
    const executionTimeMs = Date.now() - startTime;

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      executionTimeMs,
      status: result.timedOut ? 'timeout' : (result.exitCode === 0 ? 'success' : 'error')
    };
  }

  private async runJava(dir: string, code: string, stdin: string): Promise<ExecutionResult> {
    const classMatch = code.match(/public\s+class\s+([A-Za-z0-9_]+)/);
    const className = classMatch ? classMatch[1] : 'Main';
    const srcPath = path.join(dir, `${className}.java`);
    fs.writeFileSync(srcPath, code, 'utf-8');

    // 1. Compile
    const compileResult = await this.spawnProcess('javac', [srcPath], '', 10000);
    if (compileResult.exitCode !== 0) {
      const err = compileResult.stderr || compileResult.stdout;
      const isMissingJdk = err.includes('Unable to locate a Java Runtime');
      return {
        stdout: '',
        stderr: isMissingJdk 
          ? 'Java JDK is not installed on this system. Please install Java JDK to compile and run Java programs locally.'
          : `Java Compilation Error:\n${err}`,
        exitCode: compileResult.exitCode,
        executionTimeMs: 0,
        status: 'error'
      };
    }

    // 2. Execute
    const startTime = Date.now();
    const runResult = await this.spawnProcess('java', ['-cp', dir, className], stdin, this.maxTimeoutMs);
    const executionTimeMs = Date.now() - startTime;

    return {
      stdout: runResult.stdout,
      stderr: runResult.stderr,
      exitCode: runResult.exitCode,
      executionTimeMs,
      status: runResult.timedOut ? 'timeout' : (runResult.exitCode === 0 ? 'success' : 'error')
    };
  }

  private spawnProcess(
    command: string,
    args: string[],
    stdin: string,
    timeoutMs: number
  ): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> {
    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, timeoutMs);

      if (stdin) {
        try {
          child.stdin.write(stdin);
          child.stdin.end();
        } catch (e) {
          // Stream might be closed
        }
      } else {
        child.stdin.end();
      }

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        // Prevent buffer explosion
        if (stdout.length > 500000) {
          child.kill('SIGKILL');
        }
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
        if (stderr.length > 200000) {
          child.kill('SIGKILL');
        }
      });

      child.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          stdout,
          stderr: stderr || err.message,
          exitCode: 1,
          timedOut: false
        });
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        if (timedOut) {
          resolve({
            stdout,
            stderr: `Execution timed out after ${timeoutMs / 1000} seconds (potential infinite loop or excessive computation).`,
            exitCode: 124,
            timedOut: true
          });
        } else {
          resolve({
            stdout,
            stderr,
            exitCode: code ?? 0,
            timedOut: false
          });
        }
      });
    });
  }
}

export const runnerService = new RunnerService();
