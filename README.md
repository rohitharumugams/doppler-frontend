# Doppler Effect Simulator

A cross-platform mobile application built with React Native that simulates and visualizes the Doppler effect for various vehicle types and motion paths. Users can interactively design vehicle trajectories, adjust parameters, and generate audio files demonstrating acoustic frequency shifts.

## Overview

The Doppler Effect Simulator provides an intuitive interface for exploring how sound frequency changes when a sound source moves relative to a stationary observer. This educational tool supports multiple vehicle types (cars, trains, drones) and trajectory patterns (straight line, parabolic, Bézier curves).

## Features

- **Multiple Vehicle Types**: Simulate the Doppler effect for cars, trains, and drones
- **Interactive Path Design**: 
  - Straight line paths with adjustable angle and distance
  - Parabolic trajectories with customizable curvature
  - Bézier curves with four draggable control points
- **Real-time Visualization**: Interactive path editors with zoom and drag controls
- **Audio Generation**: Backend processing generates realistic Doppler-shifted audio
- **Audio Playback**: Built-in player with progress tracking and controls
- **Audio Export**: Download and share generated audio files
- **Responsive Design**: Works seamlessly on iOS and Android devices

## Technology Stack

- **Frontend**: React Native 0.81.5
- **Navigation**: React Navigation (Stack Navigator)
- **UI Components**: React Native core components, Expo SDK
- **Graphics**: react-native-svg for path visualization
- **Audio**: expo-audio for playback
- **HTTP Client**: Axios
- **Backend API**: Flask-based REST API (separate repository)

## Project Structure

```
doppler-simulator/
├── App.js                          # Main application entry with navigation
├── index.js                        # Expo registration
├── app.json                        # Expo configuration
├── eas.json                        # Expo Application Services config
├── package.json                    # Dependencies and scripts
├── src/
│   ├── components/
│   │   ├── DraggableBezier.js     # Bézier curve editor
│   │   ├── DraggableParabola.js   # Parabolic path editor
│   │   ├── DraggableStraightLine.js # Straight line editor
│   │   └── PathVisualizer.js      # Path animation component
│   ├── constants/
│   │   └── config.js              # API endpoints and configuration
│   ├── screens/
│   │   ├── HomeScreen.js          # Vehicle selection
│   │   ├── PathSelectionScreen.js # Path type selection
│   │   ├── ParametersScreen.js    # Parameter input and path design
│   │   ├── SimulationScreen.js    # Processing status
│   │   └── ResultScreen.js        # Audio playback and results
│   └── services/
│       └── api.js                 # API service layer
└── assets/                         # App icons and splash screens
```

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (for macOS) or Android Emulator

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd doppler-simulator
```

2. Install dependencies:
```bash
npm install
```

3. Configure the backend API URL in `src/constants/config.js`:
```javascript
const PROD_API_URL = 'https://your-backend-url.com';
```

4. Start the development server:
```bash
npm start
```

## Usage

### Running the App

**Development Mode:**
```bash
npm start           # Start Expo development server
npm run android     # Run on Android emulator
npm run ios         # Run on iOS simulator
```

**Production Build:**
```bash
# Using EAS Build
eas build --platform android
eas build --platform ios
```

### Application Workflow

1. **Home Screen**: Select a vehicle type (car, train, or drone)
2. **Path Selection**: Choose a motion path (straight line, parabola, or Bézier curve)
3. **Parameters Screen**: 
   - Adjust vehicle speed and audio duration
   - Interactively design the path using drag-and-drop controls
   - Visualize the trajectory in real-time
4. **Simulation Screen**: Backend processes the simulation and generates audio
5. **Result Screen**: 
   - Listen to the Doppler-shifted audio
   - View path animation synchronized with playback
   - Download the audio file

## Interactive Path Editors

### Straight Line Path
- **Green Handle**: Drag to adjust perpendicular distance from observer
- **Orange Handle**: Drag to change trajectory angle (-45° to +45°)
- **Zoom Slider**: Adjust visualization scale

### Parabolic Path
- **Green Handle**: Drag vertex vertically to change height
- **A Slider**: Adjust curvature coefficient (0 to 0.5)
- **Zoom Slider**: Scale the view

### Bézier Curve
- **Four Control Points**: Drag P1 (start), P2 and P3 (control), P4 (end)
- **Zoom Slider**: Adjust visualization scale
- Smooth cubic curves for complex trajectories

## API Integration

The app communicates with a Flask backend that handles:
- Vehicle and path configuration retrieval
- Doppler effect simulation computation
- Audio file generation
- Job status polling for long-running simulations

**Key Endpoints:**
- `GET /health` - Health check
- `GET /api/vehicles` - Available vehicle types
- `GET /api/paths` - Available path types
- `POST /api/simulate` - Start simulation
- `GET /api/job/{job_id}` - Check job status
- `GET /api/download/{filename}` - Download audio

## Configuration

### API Configuration (`src/constants/config.js`)
```javascript
export const API_URL = 'https://doppler-simulator.duckdns.org';
export const POLLING_INTERVAL = 2000;  // Status check interval
export const DEFAULT_AUDIO_DURATION = 5;
```

### Expo Configuration (`app.json`)
- Package name: `com.rohith_3105.dopplersimulator`
- Supports Android edge-to-edge display
- Enables new architecture for better performance

## Building for Production

### Android APK/AAB
```bash
eas build --platform android --profile production
```

### iOS IPA
```bash
eas build --platform ios --profile production
```

## Dependencies

**Core:**
- react: 19.1.0
- react-native: 0.81.5
- expo: ^54.0.23

**Navigation:**
- @react-navigation/native: ^7.1.18
- @react-navigation/stack: ^7.5.0

**UI Components:**
- @react-native-community/slider: ^5.0.1
- react-native-svg: 15.12.1

**Audio & File Handling:**
- expo-audio: ~14.0.7
- expo-file-system: ~18.0.6
- expo-sharing: ~13.0.3

**HTTP:**
- axios: ^1.12.2

## Testing

The application can be tested in multiple ways:

### 1. Development Testing with Expo Go

Install Expo Go on your mobile device and scan the QR code from:
```bash
npm start
```

### 2. Local Emulator Testing
```bash
npm run android  # Android emulator
npm run ios      # iOS simulator (macOS only)
```

### 3. Production Build Testing
Build and install APK/IPA on physical devices for production testing.

## Troubleshooting

**Backend Connection Issues:**
- Verify the API URL in `config.js`
- Ensure the backend server is running and accessible
- Check network permissions in `app.json` (Android: `usesCleartextTraffic`)

**Audio Playback Issues:**
- Confirm audio file format is supported (WAV/MP3)
- Check device volume and audio permissions

**Build Errors:**
- Clear Metro bundler cache: `expo start -c`
- Remove node_modules and reinstall: `rm -rf node_modules && npm install`

## Future Enhancements

- 3D trajectory visualization
- Multiple observer positions
- Custom audio source selection
- Real-time parameter adjustment during playback
- Frequency spectrum visualization
- Educational content and tutorials

## License

This project is part of a research internship at Carnegie Mellon University's Language Technologies Institute under Professor Bhiksha Raj.

## Author

**Rohith Arumugam Suresh**  
Computer Science and Engineering  
Sri Sivasubramaniya Nadar College of Engineering  
Research Intern, Carnegie Mellon University

## Acknowledgments

- Carnegie Mellon University, Language Technologies Institute
- Professor Bhiksha Raj for research guidance
- Doppler effect physics simulations based on acoustic wave theory

---

**Note**: This application requires a backend server for simulation processing. Ensure the backend API is properly configured and accessible before running the app.
