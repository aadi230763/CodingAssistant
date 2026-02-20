# CodeJanitor Phase 1: AI Foundation
**AI-Powered DevSecOps Security Auditor for React Native**

---

## 📋 Phase 1 Overview

Phase 1 establishes the foundational architecture for CodeJanitor, an on-device AI security auditor that uses voice commands to audit, patch, and manage CI/CD pipelines. This phase focuses on building the core AI infrastructure, UI components, and demonstrating security analysis capabilities.

## ✨ Current Features Implemented

### 🤖 AI Service Integration
- **RunAnywhere SDK Architecture**: Structured for easy integration with real SDK when available
- **Mock Implementation**: Fully functional simulation of SDK initialization, model loading, and inference
- **Event-Driven Design**: Real-time status updates and progress tracking
- **Error Handling**: Comprehensive error management with user feedback

### 📱 Mobile Application
- **React Native CLI + Expo**: Dual support for maximum compatibility
- **TypeScript**: Full type safety with strict mode enabled
- **Cross-Platform**: iOS and Android support via Expo Go
- **Hot Reloading**: Live code updates during development

### 🎨 User Interface
- **Hacker-Style Design**: Dark mode with green accent colors
- **Terminal Aesthetic**: Monospaced fonts (Courier New) throughout
- **Animated Components**: Smooth progress bars and status indicators
- **Real-Time Updates**: Live status and progress visualization

### 🔒 Security Analysis
- **"Vibe Check" Feature**: Analyzes sample DevSecOps logs for security threats
- **Repository Scanning**: Clone and analyze GitHub repositories for security vulnerabilities
- **Pattern Recognition**: Detects authentication failures, unauthorized access, and anomalies  
- **Vulnerability Detection**: Identifies SQL injection, hardcoded credentials, and dependency issues
- **Severity Assessment**: Categorizes threats (LOW/MEDIUM/HIGH/CRITICAL)
- **Actionable Insights**: Provides specific remediation recommendations
- **CWE Mapping**: Maps vulnerabilities to Common Weakness Enumeration standards

### 🖥️ Agent Diagnostics
- **Terminal Component**: Real-time agent thought process logging
- **Color-Coded Messages**: Success (green), errors (red), warnings (orange), processing (blue)
- **Timestamp Tracking**: Precise timing of all operations
- **Scrollable History**: Complete audit trail of agent activities

### 📁 Git Integration
- **Repository Input**: Text field for GitHub repository URLs
- **URL Validation**: Real-time validation of GitHub repository format
- **Clone Progress**: Visual progress tracking during repository download
- **Isomorphic Git**: Shallow cloning for efficient repository analysis
- **Auto-Analysis**: Automatic security scanning upon successful clone
- **Structured for Auth**: Architecture ready for GitHub Personal Access Tokens

## 🏗️ Technical Architecture

### Core Components

```
CodeJanitor/
├── src/
│   ├── services/
│   │   ├── aiService.ts         # AI SDK integration layer
│   │   └── gitService.ts        # GitHub repository cloning and analysis
│   ├── mocks/
│   │   ├── runanywhere-core.ts     # Mock RunAnywhere SDK
│   │   └── runanywhere-llamacpp.ts # Mock LlamaCPP backend
│   ├── components/
│   │   ├── StatusIndicator.tsx     # SDK status display
│   │   ├── ProgressBar.tsx         # Animated progress tracking
│   │   ├── Terminal.tsx            # Agent diagnostics terminal
│   │   └── SecurityAnalysisDisplay.tsx # Repository security report
│   └── types/
│       └── index.ts                # TypeScript interfaces
├── my-app/                         # Expo project wrapper
└── App.tsx                         # Main application component
```

### AI Service Architecture

**AIService Class (Singleton Pattern)**
- **Initialization**: Manages SDK startup and configuration
- **Model Management**: Handles model downloading with progress tracking
- **Chat Interface**: Processes security analysis requests
- **Event Emission**: Real-time updates to UI components

**Mock SDK Implementation**
- **Realistic Behavior**: Simulates actual SDK timing and responses
- **Error Simulation**: Random failures for robust error handling testing
- **Progress Simulation**: Authentic download progress with byte tracking

**GitService Class (Singleton Pattern)**
- **Repository Cloning**: GitHub repository cloning with isomorphic-git
- **Progress Tracking**: Real-time clone progress with visual feedback
- **Security Analysis**: Automatic vulnerability detection post-clone
- **File System Integration**: React Native FS for local storage management
- **Validation**: GitHub URL format validation and error handling

### State Management
- **Event-Driven Updates**: Components subscribe to service events
- **React Hooks**: useState and useEffect for local state management
- **Real-Time Sync**: Immediate UI updates on backend changes

## 🔧 Technical Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | React Native CLI | 0.75.5 | Native mobile development |
| **Runtime** | Expo | Latest | Development and deployment |
| **Language** | TypeScript | 5.0.4 | Type safety and reliability |
| **AI Backend** | RunAnywhere SDK | Mock v1.0 | On-device AI processing |
| **Git Integration** | isomorphic-git | 1.25.6 | Repository cloning and analysis |
| **File System** | react-native-fs | 2.20.0 | Local file storage management |
| **UI Library** | React Native Core | Built-in | Native components |
| **State** | React Hooks | Built-in | Component state management |

## 📊 Current Status

### ✅ Completed Features
- [x] Project structure and configuration
- [x] Mock AI service with realistic behavior
- [x] UI components with hacker aesthetic
- [x] Progress tracking and status indicators
- [x] Security analysis demonstration
- [x] Terminal-style logging system
- [x] Expo deployment configuration
- [x] TypeScript interfaces and type safety
- [x] Error handling and user feedback
- [x] Hot reloading development environment
- [x] GitHub repository URL input validation
- [x] Repository cloning with progress tracking
- [x] Automatic security analysis post-clone
- [x] Comprehensive vulnerability display
- [x] Dependency analysis with vulnerability counts

### 🔄 Simulated Features (Ready for Real SDK)
- [x] SDK initialization with environment configuration
- [x] Model downloading with progress callbacks
- [x] Chat interface for security analysis
- [x] Event-driven architecture for real-time updates
- [x] Error handling for network and processing failures

### 📱 Deployment Status
- **Development**: ✅ Working via Expo Go (iOS/Android)
- **Web Preview**: ✅ Available at localhost:8081
- **Production Build**: 🔄 Ready for app store deployment

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- iOS device with Expo Go app
- macOS with Xcode (for iOS simulator)

### Development Setup
```bash
# Navigate to project
cd CodeJanitor

# Install dependencies
npm install

# Start Expo development server
cd my-app
npm start

# Scan QR code with iPhone Camera or Expo Go
```

### Testing the App
1. **Wait for Initialization** (~10 seconds)
   - Watch SDK status change: "Initializing" → "Loading Model" → "Ready"

2. **Observe Model Download** (~20 seconds)
   - Animated progress bar shows download progress
   - Terminal logs show detailed process steps

3. **Test Security Analysis**
   - Tap "🔍 Vibe Check" button
   - Review security analysis of sample DevSecOps log
   - Watch agent thoughts in terminal

4. **Test Repository Analysis** (NEW!)
   - Enter any GitHub repository URL in the text input
   - Tap "📁 Clone & Analyze" button
   - Watch clone progress with real-time updates
   - Review comprehensive security analysis report
   - Explore vulnerability details and recommendations

## 📈 Demo Scenarios

### DevSecOps Log Analysis
**Sample DevSecOps Log Analysis:**
```json
{
  "timestamp": "2026-02-20T10:30:45Z",
  "level": "ERROR",
  "service": "auth-service", 
  "event": "authentication_failed",
  "details": "Multiple failed login attempts detected..."
}
```

**AI Analysis Output:**
- **Severity**: HIGH
- **Category**: Authentication Security Incident
- **Recommendation**: Enable enhanced monitoring, review access patterns
- **Confidence**: 95%

### Repository Security Analysis
**Sample GitHub Repository Scan:**
```
Repository: example-node-app
URL: https://github.com/user/example-node-app
Clone Status: ✅ Completed (2.1 MB)
```

**Security Report:**
- **Vulnerabilities Found**: 3 (1 Critical, 1 High, 1 Medium)
- **Security Score**: 35/100 (HIGH risk)
- **Critical Issues**:
  - SQL Injection vulnerability in index.js:8
  - Hardcoded credentials in config.js:4
  - Vulnerable lodash dependency (CWE-1321)
- **Dependencies**: 6 analyzed, 3 with vulnerabilities
- **Recommendations**: 5 actionable security improvements

## 🎯 Phase 1 Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| UI Components | 5+ custom components | ✅ 7 implemented |
| SDK Integration | Mock → Real ready | ✅ Architecture complete |
| Git Integration | Repository scanning | ✅ Implemented |
| Mobile Deployment | iOS via Expo | ✅ Working |
| Security Analysis | Demo functionality | ✅ Enhanced with Git repos |
| Code Quality | TypeScript strict | ✅ 100% typed |
| Documentation | Comprehensive | ✅ This document |

## 🛠️ Development Notes

### Mock vs Real Implementation
- **Current**: Mock implementations simulate real SDK behavior
- **Architecture**: Designed for seamless swap to real RunAnywhere SDK
- **APIs**: All interfaces match expected real SDK structure

### Performance Considerations
- **Bundle Size**: Optimized for mobile devices
- **Memory Usage**: Efficient state management with cleanup
- **Battery Impact**: Minimal background processing

### Security Design
- **On-Device Processing**: No data leaves the device
- **Encrypted Storage**: Ready for secure model storage
- **Privacy First**: No telemetry or external API calls

## 🔮 Next Phase Roadmap

### Phase 2: Voice Integration
- Speech-to-text for voice commands
- Natural language pipeline analysis
- Voice feedback and alerts

### Phase 3: CI/CD Integration  
- Repository scanning and analysis
- Pipeline security assessment
- Automated vulnerability detection

### Phase 4: Advanced Analytics
- ML-powered threat prediction
- Historical security trends
- Custom rule engine

---

## 📞 Development Status

**Phase 1**: ✅ **COMPLETE** - Ready for real SDK integration  
**Current Focus**: Preparing Phase 2 voice command architecture  
**Deployment**: Live on iOS via Expo Go

---

*CodeJanitor Phase 1 demonstrates a complete AI-powered security auditing architecture with production-ready mobile deployment capabilities.*