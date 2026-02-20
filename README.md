# CodeJanitor

AI-Powered DevSecOps Security Auditor for React Native

## Overview

CodeJanitor is a React Native application that uses voice commands to audit, patch, and manage CI/CD pipelines entirely on-device for maximum security. This Phase 1 implementation focuses on establishing the AI foundation with the RunAnywhere SDK.

## Features

### Phase 1 - AI Foundation
- ✅ SDK initialization and model management
- ✅ Progress tracking for model downloads  
- ✅ Real-time status indicators
- ✅ "Vibe Check" security analysis
- ✅ Terminal-style agent thought logging
- ✅ Hacker-style dark mode UI

## Tech Stack

- **Frontend**: React Native CLI + TypeScript
- **AI Backend**: RunAnywhere SDK (Mock Implementation) 
- **Model**: SmolLM2-360M (Simulated)
- **UI**: Custom dark mode components with monospaced fonts

> **Note**: Currently using mock implementations of the RunAnywhere SDK while the actual SDK is in development. The architecture is designed to easily swap in the real SDK when available.

## Project Structure

```
CodeJanitor/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ProgressBar.tsx  # Animated progress indicator
│   │   ├── StatusIndicator.tsx  # SDK status display
│   │   └── Terminal.tsx     # Agent thought logging
│   ├── mocks/              # Mock SDK implementations
│   │   ├── runanywhere-core.ts     # Mock RunAnywhere SDK
│   │   └── runanywhere-llamacpp.ts # Mock LlamaCPP backend
│   ├── services/
│   │   └── aiService.ts     # SDK integration layer
│   └── types/
│       └── index.ts         # TypeScript interfaces
├── App.tsx                  # Main application component
└── package.json
```

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **iOS Setup**
   ```bash
   cd ios && pod install && cd ..
   npm run ios
   ```

3. **Android Setup**
   ```bash
   npm run android
   ```

## Key Components

### AIService
Core service handling:
- SDK initialization with development environment
- SmolLM2 model download and progress tracking
- Chat interface for security analysis
- Event-driven architecture for real-time updates

### UI Components
- **StatusIndicator**: Shows SDK/model status with pulsing animations
- **ProgressBar**: Smooth animated progress for model downloads
- **Terminal**: Hacker-style thought process logging with color coding

### Security Analysis
The "Vibe Check" feature analyzes sample DevSecOps logs and provides:
- Threat severity assessment
- Security incident categorization  
- Actionable remediation recommendations
- Real-time processing feedback

## Development Notes

### SDK Integration
- Uses mock implementations of `@runanywhere/core` and `@runanywhere/llamacpp`
- Simulates realistic initialization, download, and inference behavior  
- Model: SmolLM2-360M simulation with progress tracking
- Easy to replace with real SDK when available
- Progress callbacks for download tracking

### UI Design Philosophy
- Dark mode with green accents (hacker aesthetic)
- Monospaced fonts throughout (Courier New)
- Terminal-inspired components
- Smooth animations for state transitions

## Next Phase Features

- Voice command integration
- CI/CD pipeline scanning
- Real-time vulnerability detection
- Advanced security reporting
- Multi-model support

## Contributing

1. Follow TypeScript strict mode guidelines
2. Implement proper error handling
3. Add comprehensive logging via Terminal component  
4. Maintain hacker-style UI consistency
5. Test on both iOS and Android platforms

## License

Private Development Project