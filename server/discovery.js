/**
 * Antigravity Connector - Project Discovery & Passport Engine
 * Follows Prompt 06 strictly:
 * - Controlled discovery only in authorized directories
 * - Detects frameworks, runtimes, package managers, git, cloud configs
 * - Never returns secret values from .env, only counts and classified keys
 * - Generates comprehensive Project Passport
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { scanEnvSecrets } = require('./security');

class ProjectDiscoveryEngine {
  /**
   * Scan an authorized workspace directory recursively (up to safe depth)
   */
  async scanDirectory(targetPath, maxDepth = 2) {
    if (!fs.existsSync(targetPath)) {
      throw new Error(`La ruta autorizada no existe: ${targetPath}`);
    }

    const projects = [];
    this._traverse(targetPath, 0, maxDepth, projects);
    return projects;
  }

  _traverse(currentPath, currentDepth, maxDepth, collectedProjects) {
    if (currentDepth > maxDepth) return;

    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      const filenames = entries.map(e => e.name);

      // Check if current directory represents a project root
      const isProject = this._isProjectRoot(filenames);
      if (isProject) {
        const projectInfo = this.analyzeProject(currentPath, filenames);
        collectedProjects.push(projectInfo);
        // Do not traverse deeper into an already identified project root
        return;
      }

      // Skip heavy or vendor directories
      const ignoredFolders = new Set([
        'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
        'venv', '.venv', '__pycache__', 'vendor', 'target', '.idea', '.vscode'
      ]);

      for (const entry of entries) {
        if (entry.isDirectory() && !ignoredFolders.has(entry.name) && !entry.name.startsWith('.')) {
          const subPath = path.join(currentPath, entry.name);
          this._traverse(subPath, currentDepth + 1, maxDepth, collectedProjects);
        }
      }
    } catch (err) {
      // Ignore unreadable system folders
    }
  }

  _isProjectRoot(filenames) {
    const indicators = [
      'package.json', 'pyproject.toml', 'requirements.txt', 'go.mod', 'Cargo.toml',
      'pom.xml', 'build.gradle', 'firebase.json', 'vercel.json', 'netlify.toml', 'wrangler.toml'
    ];
    return indicators.some(ind => filenames.includes(ind));
  }

  /**
   * Analyze a single project directory and assemble its Project Passport
   */
  analyzeProject(projectPath, filenames = null) {
    if (!filenames) {
      filenames = fs.readdirSync(projectPath);
    }

    const name = path.basename(projectPath);
    let framework = 'Desconocido';
    let language = 'Desconocido';
    let runtime = 'Desconocido';
    let packageManager = 'none';

    // Node.js ecosystem
    if (filenames.includes('package.json')) {
      runtime = 'Node.js';
      language = 'JavaScript';
      if (filenames.includes('tsconfig.json')) language = 'TypeScript';

      if (filenames.includes('pnpm-lock.yaml')) packageManager = 'pnpm';
      else if (filenames.includes('yarn.lock')) packageManager = 'yarn';
      else if (filenames.includes('bun.lockb') || filenames.includes('bun.lock')) packageManager = 'bun';
      else if (filenames.includes('package-lock.json')) packageManager = 'npm';
      else packageManager = 'npm';

      try {
        const pkgContent = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8'));
        const deps = { ...(pkgContent.dependencies || {}), ...(pkgContent.devDependencies || {}) };

        if (deps['next']) framework = 'Next.js';
        else if (deps['@remix-run/react']) framework = 'Remix';
        else if (deps['vite']) framework = 'Vite';
        else if (deps['react']) framework = 'React';
        else if (deps['vue']) framework = 'Vue.js';
        else if (deps['@angular/core'] || filenames.includes('angular.json')) framework = 'Angular';
        else if (deps['express']) framework = 'Express.js';
        else if (deps['@nestjs/core']) framework = 'NestJS';
        else framework = 'Node.js App';
      } catch (e) {
        framework = 'Node.js';
      }
    }

    // Python ecosystem
    if (filenames.includes('pyproject.toml') || filenames.includes('requirements.txt')) {
      runtime = 'Python';
      language = 'Python';
      packageManager = filenames.includes('poetry.lock') ? 'poetry' : 'pip';
      framework = 'Python App';

      try {
        const reqPath = path.join(projectPath, 'requirements.txt');
        if (fs.existsSync(reqPath)) {
          const reqs = fs.readFileSync(reqPath, 'utf8');
          if (reqs.includes('fastapi')) framework = 'FastAPI';
          else if (reqs.includes('django')) framework = 'Django';
          else if (reqs.includes('flask')) framework = 'Flask';
        }
      } catch (e) {}
    }

    // Go & Rust
    if (filenames.includes('go.mod')) {
      runtime = 'Go';
      language = 'Go';
      framework = 'Go Module';
      packageManager = 'go';
    }
    if (filenames.includes('Cargo.toml')) {
      runtime = 'Rust';
      language = 'Rust';
      framework = 'Cargo Crate';
      packageManager = 'cargo';
    }

    // Cloud & Deployment indicators
    const hasDocker = filenames.includes('Dockerfile') || filenames.includes('docker-compose.yml');
    const hasFirebase = filenames.includes('firebase.json') || filenames.includes('.firebaserc');
    const hasSupabase = filenames.includes('supabase') || fs.existsSync(path.join(projectPath, 'supabase'));
    const hasVercel = filenames.includes('vercel.json');
    const hasNetlify = filenames.includes('netlify.toml');
    const hasCloudflare = filenames.includes('wrangler.toml');

    // Git inspection
    let gitInfo = {
      isGit: false,
      branch: 'none',
      remote: 'none',
      lastCommit: 'none'
    };

    if (filenames.includes('.git') || fs.existsSync(path.join(projectPath, '.git'))) {
      gitInfo.isGit = true;
      try {
        gitInfo.branch = execSync('git branch --show-current', {
          cwd: projectPath,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore']
        }).trim() || 'main';

        const remotes = execSync('git remote -v', {
          cwd: projectPath,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore']
        }).trim();
        if (remotes) {
          const firstRemote = remotes.split(/\r?\n/)[0];
          gitInfo.remote = firstRemote.split(/\s+/)[1] || 'configured';
        }

        gitInfo.lastCommit = execSync('git log -1 --pretty=format:"%h - %an: %s (%cr)"', {
          cwd: projectPath,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'ignore']
        }).trim() || 'No commits yet';
      } catch (e) {
        gitInfo.branch = 'git initialized';
      }
    }

    // Safe Secret Scanning (Never returns plaintext secrets!)
    let envScan = { detected: false, totalVars: 0, secretsCount: 0, secretKeys: [] };
    const envFileCandidates = ['.env', '.env.local', '.env.development', '.env.production'];
    for (const envFile of envFileCandidates) {
      const fullEnvPath = path.join(projectPath, envFile);
      if (fs.existsSync(fullEnvPath)) {
        try {
          const content = fs.readFileSync(fullEnvPath, 'utf8');
          const scan = scanEnvSecrets(content);
          if (scan.detected) {
            envScan = scan;
            break;
          }
        } catch (e) {}
      }
    }

    // Assemble Project Passport
    const passport = {
      name,
      path: projectPath,
      framework,
      language,
      runtime,
      packageManager,
      git: gitInfo,
      cloud: {
        docker: hasDocker,
        firebase: hasFirebase,
        supabase: hasSupabase,
        vercel: hasVercel,
        netlify: hasNetlify,
        cloudflare: hasCloudflare
      },
      secrets: {
        detected: envScan.detected,
        totalVariables: envScan.totalVars,
        detectedPotentialSecretsCount: envScan.secretsCount,
        secretKeysIdentified: envScan.secretKeys,
        status: envScan.detected 
          ? `.env detectado — ${envScan.totalVars} variables — ${envScan.secretsCount} posibles secretos (valores protegidos)` 
          : 'Sin archivo .env detectado'
      },
      tests: filenames.includes('test') || filenames.includes('tests') || filenames.includes('vitest.config.ts') || filenames.includes('jest.config.js'),
      discoveredAt: new Date().toISOString()
    };

    return passport;
  }
}

module.exports = new ProjectDiscoveryEngine();
