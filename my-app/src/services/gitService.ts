import * as FileSystem from 'expo-file-system';
import { 
  GitCloneProgress, 
  RepositoryInfo, 
  CodeAnalysisResult,
  AgentThought 
} from '../types';

export class GitService {
  private static instance: GitService;
  private cloneInProgress = false;
  
  // Event handlers for UI updates
  public onCloneProgress?: (progress: GitCloneProgress) => void;
  public onThoughtAdded?: (thought: AgentThought) => void;
  public onAnalysisComplete?: (result: CodeAnalysisResult) => void;

  private constructor() {}

  public static getInstance(): GitService {
    if (!GitService.instance) {
      GitService.instance = new GitService();
    }
    return GitService.instance;
  }

  private static thoughtCounter = 0;

  private addThought(message: string, type: AgentThought['type'] = 'info') {
    const thought: AgentThought = {
      id: `git-${Date.now()}-${++GitService.thoughtCounter}`,
      timestamp: Date.now(),
      message,
      type,
    };

    if (this.onThoughtAdded) {
      this.onThoughtAdded(thought);
    }
  }

  private updateProgress(
    phase: GitCloneProgress['phase'],
    progress: number,
    currentStep: string,
    error?: string
  ) {
    const progressUpdate: GitCloneProgress = {
      phase,
      progress,
      currentStep,
      error,
    };

    if (this.onCloneProgress) {
      this.onCloneProgress(progressUpdate);
    }
  }

  private extractRepoName(url: string): string {
    // Extract repository name from GitHub URL
    const match = url.match(/github\.com\/[^\/]+\/([^\/]+)(?:\.git)?/);
    return match ? match[1] : 'unknown-repo';
  }

  private generateRepositoryId(): string {
    return `repo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async cloneUserRepo(url: string): Promise<RepositoryInfo> {
    if (this.cloneInProgress) {
      throw new Error('Another clone operation is already in progress');
    }

    this.cloneInProgress = true;

    try {
      this.addThought(`Starting repository clone from: ${url}`, 'processing');
      this.updateProgress('initializing', 0, 'Preparing clone environment...');

      // Validate GitHub URL
      if (!this.isValidGitHubUrl(url)) {
        throw new Error('Invalid GitHub URL. Please provide a valid GitHub repository URL.');
      }

      const repoName = this.extractRepoName(url);
      const repoId = this.generateRepositoryId();
      const localPath = `${FileSystem.documentDirectory}repositories/${repoId}`;

      this.addThought(`Repository: ${repoName}`, 'info');
      this.updateProgress('initializing', 20, 'Creating local directory...');

      // Ensure the repositories directory exists
      const reposDirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}repositories`).catch(() => null);
      if (!reposDirInfo?.exists) {
        await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}repositories`, { intermediates: true });
      }

      await FileSystem.makeDirectoryAsync(localPath, { intermediates: true });
      this.addThought(`Local path created: ${localPath}`, 'success');

      this.updateProgress('cloning', 40, 'Cloning repository...');

      // For React Native/Expo, we'll use a mock implementation
      // In a real implementation, you'd use isomorphic-git with proper HTTP transport
      await this.mockCloneRepository(url, localPath);

      this.updateProgress('analyzing', 80, 'Analyzing project structure...');
      
      const repositoryInfo: RepositoryInfo = {
        id: repoId,
        url,
        name: repoName,
        localPath,
        clonedAt: Date.now(),
        size: await this.calculateDirectorySize(localPath),
      };

      this.addThought(`Repository cloned successfully: ${repoName}`, 'success');
      this.updateProgress('completed', 100, 'Clone completed successfully');

      // Auto-trigger security analysis
      setTimeout(() => {
        this.triggerSecurityAnalysis(repositoryInfo);
      }, 1000);

      return repositoryInfo;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during clone';
      this.addThought(`Clone failed: ${errorMessage}`, 'error');
      this.updateProgress('error', 0, 'Clone failed', errorMessage);
      throw error;

    } finally {
      this.cloneInProgress = false;
    }
  }

  private isValidGitHubUrl(url: string): boolean {
    const githubPattern = /^https:\/\/github\.com\/[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+(?:\.git)?(?:\/)?$/;
    return githubPattern.test(url);
  }

  private async mockCloneRepository(url: string, localPath: string): Promise<void> {
    // Mock implementation that creates a sample project structure
    // In production, this would use isomorphic-git
    
    this.addThought('Creating mock repository structure...', 'processing');

    // Create a mock package.json
    const mockPackageJson = {
      name: this.extractRepoName(url),
      version: '1.0.0',
      description: 'Cloned repository for security analysis',
      main: 'index.js',
      dependencies: {
        express: '^4.17.1',
        'lodash': '^4.17.21', // Potentially vulnerable version
        'axios': '^0.21.0', // Older version with known issues
      },
      devDependencies: {
        '@types/node': '^16.0.0',
        'typescript': '^4.5.0',
      },
      scripts: {
        start: 'node index.js',
        test: 'jest',
      },
    };

    // Create mock source files
    const mockFiles = [
      { path: 'package.json', content: JSON.stringify(mockPackageJson, null, 2) },
      { path: 'index.js', content: `// Main application file\nconst express = require('express');\nconst app = express();\n\n// Potential security issue: no input validation\napp.get('/user/:id', (req, res) => {\n  const userId = req.params.id;\n  // Direct query without sanitization\n  const query = \`SELECT * FROM users WHERE id = \${userId}\`;\n  res.json({ userId, query });\n});\n\napp.listen(3000, () => {\n  console.log('Server running on port 3000');\n});` },
      { path: 'README.md', content: `# ${this.extractRepoName(url)}\n\nThis is a sample repository cloned for security analysis.\n\n## Security Notes\n- Contains potentially vulnerable dependencies\n- Has code patterns that need security review` },
      { path: '.gitignore', content: 'node_modules/\n.env\n*.log\ndist/' },
      { path: 'config.js', content: `// Configuration file\nmodule.exports = {\n  database: {\n    host: 'localhost',\n    password: 'admin123', // Hardcoded password - security issue\n  },\n  apiKey: 'sk_test_1234567890abcdef' // Exposed API key\n};` },
    ];

    // Write files to local directory
    for (const file of mockFiles) {
      const filePath = `${localPath}/${file.path}`;
      await FileSystem.writeAsStringAsync(filePath, file.content);
    }

    // Simulate clone time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.addThought('Mock repository structure created', 'success');
  }

  private async calculateDirectorySize(path: string): Promise<number> {
    try {
      const info = await FileSystem.getInfoAsync(path);
      return info.size || 0;
    } catch {
      return 0;
    }
  }

  private async triggerSecurityAnalysis(repository: RepositoryInfo): Promise<void> {
    this.addThought(`Starting security analysis of ${repository.name}...`, 'processing');

    try {
      // Look for package.json
      const packageJsonPath = `${repository.localPath}/package.json`;
      const packageJsonInfo = await FileSystem.getInfoAsync(packageJsonPath);

      if (!packageJsonInfo.exists) {
        this.addThought('No package.json found - skipping dependency analysis', 'warning');
        return;
      }

      const packageContent = await FileSystem.readAsStringAsync(packageJsonPath);
      const packageData = JSON.parse(packageContent);

      this.addThought('Analyzing dependencies for vulnerabilities...', 'processing');

      // Mock security analysis results
      const analysisResult: CodeAnalysisResult = {
        repositoryId: repository.id,
        vulnerabilities: [
          {
            id: 'vuln_1',
            type: 'dependency',
            severity: 'HIGH',
            title: 'Vulnerable Lodash Version',
            description: 'Using lodash version 4.17.21 with known prototype pollution vulnerability',
            file: 'package.json',
            recommendation: 'Update lodash to version 4.17.21 or higher',
            cwe: 'CWE-1321',
          },
          {
            id: 'vuln_2',
            type: 'code',
            severity: 'CRITICAL',
            title: 'SQL Injection Vulnerability',
            description: 'Direct SQL query construction without sanitization',
            file: 'index.js',
            line: 8,
            recommendation: 'Use parameterized queries or ORM with input validation',
            cwe: 'CWE-89',
          },
          {
            id: 'vuln_3',
            type: 'configuration',
            severity: 'HIGH',
            title: 'Hardcoded Credentials',
            description: 'Database password and API keys are hardcoded in configuration file',
            file: 'config.js',
            line: 4,
            recommendation: 'Use environment variables for sensitive configuration',
            cwe: 'CWE-798',
          },
        ],
        dependencies: Object.keys(packageData.dependencies || {}).map(name => ({
          name,
          version: packageData.dependencies[name],
          vulnerabilities: Math.floor(Math.random() * 3),
          outdated: Math.random() > 0.5,
        })),
        summary: {
          totalFiles: 5,
          linesOfCode: 127,
          securityScore: 35, // Low score due to vulnerabilities
          riskLevel: 'HIGH',
        },
        recommendations: [
          'Update all dependencies to latest versions',
          'Implement input validation and sanitization',
          'Use environment variables for configuration',
          'Add security headers to Express application',
          'Implement proper authentication and authorization',
        ],
      };

      // Simulate analysis time
      await new Promise(resolve => setTimeout(resolve, 3000));

      this.addThought(`Found ${analysisResult.vulnerabilities.length} security issues`, 'warning');
      this.addThought(`Security score: ${analysisResult.summary.securityScore}/100 (${analysisResult.summary.riskLevel} risk)`, 'error');

      if (this.onAnalysisComplete) {
        this.onAnalysisComplete(analysisResult);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      this.addThought(`Security analysis failed: ${errorMessage}`, 'error');
    }
  }

  public async getClonedRepositories(): Promise<RepositoryInfo[]> {
    // Return list of previously cloned repositories
    // In a real app, this would be stored in AsyncStorage or a database
    return [];
  }

  public async deleteRepository(repositoryId: string): Promise<void> {
    const repoPath = `${FileSystem.documentDirectory}repositories/${repositoryId}`;
    await FileSystem.deleteAsync(repoPath);
    this.addThought(`Repository ${repositoryId} deleted`, 'info');
  }

  public isCloneInProgress(): boolean {
    return this.cloneInProgress;
  }
}

export default GitService.getInstance();