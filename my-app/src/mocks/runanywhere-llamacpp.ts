// Mock implementation of LlamaCPP
// This simulates the real LlamaCPP SDK until it becomes available

export interface ModelConfig {
  id: string;
  name: string;
  url: string;
}

export class LlamaCPP {
  private static registered = false;
  private static models = new Map<string, ModelConfig>();

  static register(): void {
    this.registered = true;
    console.log('LlamaCPP backend registered');
  }

  static async addModel(config: ModelConfig): Promise<void> {
    if (!this.registered) {
      throw new Error('LlamaCPP not registered. Call register() first.');
    }

    // Simulate model download/loading time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (Math.random() > 0.9) { // 10% chance of failure for testing
      throw new Error(`Failed to load model: ${config.name}`);
    }
    
    this.models.set(config.id, config);
    console.log('Model added:', config.name);
  }

  static getLoadedModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  static isModelLoaded(modelId: string): boolean {
    return this.models.has(modelId);
  }

  // Mock inference method for future use
  static async generateResponse(prompt: string, modelId: string): Promise<string> {
    if (!this.models.has(modelId)) {
      throw new Error(`Model ${modelId} not loaded`);
    }

    // Simulate inference time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Mock response generation
    return `Mock response for: ${prompt.substring(0, 50)}...`;
  }
}

export default LlamaCPP;