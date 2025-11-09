import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput,
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert
} from 'react-native';
import PathVisualizer from '../components/PathVisualizer';
import DraggableStraightLine from '../components/DraggableStraightLine';

export default function ParametersScreen({ route, navigation }) {
  const { vehicle, path } = route.params;
  
  // Toggle between drag mode and manual input mode
  const [isManualMode, setIsManualMode] = useState(false);
  
  // State for all possible parameters
  const [parameters, setParameters] = useState({
    speed: '20',
    h: '10',
    angle: '0',
    a: '0.1',
    x0: '-30',
    y0: '20',
    x1: '-10',
    y1: '-10',
    x2: '10',
    y2: '-10',
    x3: '30',
    y3: '20',
    audio_duration: '5',
  });

  const updateParameter = (key, value) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const validateAndContinue = () => {
    // Basic validation
    const requiredParams = getRequiredParameters();
    
    for (let param of requiredParams) {
      const value = parameters[param.name];
      if (!value || value.trim() === '') {
        Alert.alert('Error', `Please enter ${param.name}`);
        return;
      }
      
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        Alert.alert('Error', `${param.name} must be a number`);
        return;
      }
      
      // Check min/max if defined
      if (param.min !== undefined && numValue < param.min) {
        Alert.alert('Error', `${param.name} must be at least ${param.min}`);
        return;
      }
      if (param.max !== undefined && numValue > param.max) {
        Alert.alert('Error', `${param.name} must be at most ${param.max}`);
        return;
      }
    }

    // Prepare simulation parameters
    const simulationParams = {
      path: path.id,
      vehicle_type: vehicle.id,
      acceleration_mode: 'perfect',
      shift_method: 'timestretch',
    };

    // Add path-specific parameters
    requiredParams.forEach(param => {
      simulationParams[param.name] = parseFloat(parameters[param.name]);
    });

    // Navigate to simulation screen
    navigation.navigate('Simulation', { 
      vehicle,
      path,
      parameters: simulationParams
    });
  };

  const getRequiredParameters = () => {
    // Find the matching path from backend response
    const pathParams = path.parameters || [];
    
    // Always include audio_duration
    const allParams = [
      ...pathParams,
      { 
        name: 'audio_duration', 
        type: 'number', 
        unit: 'seconds', 
        default: 5, 
        min: 1, 
        max: 30 
      }
    ];
    
    return allParams;
  };

  const renderParameterInput = (param) => {
    return (
      <View key={param.name} style={styles.inputGroup}>
        <Text style={styles.label}>
          {param.name.toUpperCase()}
          {param.unit && <Text style={styles.unit}> ({param.unit})</Text>}
        </Text>
        <TextInput
          style={styles.input}
          value={parameters[param.name]}
          onChangeText={(value) => updateParameter(param.name, value)}
          keyboardType="numeric"
          placeholder={`Enter ${param.name}`}
        />
        {param.min !== undefined && param.max !== undefined && (
          <Text style={styles.hint}>
            Range: {param.min} - {param.max}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Cards */}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Vehicle:</Text>
          <Text style={styles.infoValue}>{vehicle.name}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Path Type:</Text>
          <Text style={styles.infoValue}>{path.name}</Text>
        </View>

        <Text style={styles.sectionTitle}>📝 Set Parameters</Text>
        <Text style={styles.sectionSubtitle}>{path.description}</Text>

        {/* Mode Toggle Button - Only for straight line */}
        {path.id === 'straight' && (
          <TouchableOpacity 
            style={styles.modeToggle}
            onPress={() => setIsManualMode(!isManualMode)}
          >
            <Text style={styles.modeToggleText}>
              {isManualMode ? '🎯 Switch to Drag Mode' : '⌨️ Switch to Manual Input'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Drag Mode or PathVisualizer */}
        {path.id === 'straight' && !isManualMode ? (
          <DraggableStraightLine 
            parameters={parameters}
            onParametersChange={setParameters}
          />
        ) : (
          <PathVisualizer pathType={path.id} parameters={parameters} />
        )}

        {/* Speed and Duration inputs - always visible */}
        <View style={styles.parametersContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>SPEED <Text style={styles.unit}>(m/s)</Text></Text>
            <TextInput
              style={styles.input}
              value={parameters.speed}
              onChangeText={(value) => updateParameter('speed', value)}
              keyboardType="numeric"
              placeholder="Enter speed"
            />
            <Text style={styles.hint}>Range: 1 - 100</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DURATION <Text style={styles.unit}>(seconds)</Text></Text>
            <TextInput
              style={styles.input}
              value={parameters.audio_duration}
              onChangeText={(value) => updateParameter('audio_duration', value)}
              keyboardType="numeric"
              placeholder="Enter duration"
            />
            <Text style={styles.hint}>Range: 1 - 30</Text>
          </View>
        </View>

        {/* Manual mode inputs - only show if manual mode OR not straight line */}
        {(isManualMode || path.id !== 'straight') && (
          <View style={styles.parametersContainer}>
            {path.id === 'straight' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>H <Text style={styles.unit}>(m - distance)</Text></Text>
                  <TextInput
                    style={styles.input}
                    value={parameters.h}
                    onChangeText={(value) => updateParameter('h', value)}
                    keyboardType="numeric"
                    placeholder="Enter h"
                  />
                  <Text style={styles.hint}>Range: 1 - 100</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>ANGLE <Text style={styles.unit}>(degrees)</Text></Text>
                  <TextInput
                    style={styles.input}
                    value={parameters.angle}
                    onChangeText={(value) => updateParameter('angle', value)}
                    keyboardType="numeric"
                    placeholder="Enter angle"
                  />
                  <Text style={styles.hint}>Range: -45 - 45</Text>
                </View>
              </>
            )}
            
            {path.id !== 'straight' && getRequiredParameters()
              .filter(p => p.name !== 'audio_duration' && p.name !== 'speed')
              .map(param => renderParameterInput(param))
            }
          </View>
        )}

        {/* Quick Presets */}
        <View style={styles.presetContainer}>
          <Text style={styles.presetTitle}>Quick Presets:</Text>
          <View style={styles.presetButtons}>
            <TouchableOpacity 
              style={styles.presetButton}
              onPress={() => {
                if (path.id === 'straight') {
                  setParameters(prev => ({
                    ...prev,
                    speed: '20',
                    h: '10',
                    angle: '0',
                    audio_duration: '5'
                  }));
                }
              }}
            >
              <Text style={styles.presetButtonText}>Default</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.presetButton}
              onPress={() => {
                if (path.id === 'straight') {
                  setParameters(prev => ({
                    ...prev,
                    speed: '30',
                    h: '5',
                    angle: '0',
                    audio_duration: '3'
                  }));
                }
              }}
            >
              <Text style={styles.presetButtonText}>Fast</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.presetButton}
              onPress={() => {
                if (path.id === 'straight') {
                  setParameters(prev => ({
                    ...prev,
                    speed: '10',
                    h: '20',
                    angle: '0',
                    audio_duration: '8'
                  }));
                }
              }}
            >
              <Text style={styles.presetButtonText}>Slow</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tipContainer}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            Tip: Higher speed creates stronger Doppler effect. Closer distance (smaller h) makes it more noticeable.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.simulateButton}
          onPress={validateAndContinue}
        >
          <Text style={styles.simulateButtonText}>🚀 Start Simulation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  modeToggle: {
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  modeToggleText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  parametersContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  unit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#666',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  presetContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  presetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  presetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  presetButton: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  presetButtonText: {
    color: '#2196F3',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tipContainer: {
    backgroundColor: '#FFF9C4',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  simulateButton: {
    backgroundColor: '#FF5722',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  simulateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});