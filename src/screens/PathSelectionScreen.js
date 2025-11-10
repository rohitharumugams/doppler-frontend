import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import ApiService from '../services/api';

export default function PathSelectionScreen({ route, navigation }) {
  const { vehicle } = route.params;
  const [loading, setLoading] = useState(true);
  const [paths, setPaths] = useState([]);
  const [selectedPath, setSelectedPath] = useState(null);

  useEffect(() => {
    loadPaths();
  }, []);

  const loadPaths = async () => {
    setLoading(true);
    
    const pathsResponse = await ApiService.getPaths(vehicle.id);
    if (pathsResponse.success) {
      setPaths(pathsResponse.data.paths);
      if (pathsResponse.data.paths.length > 0) {
        setSelectedPath(pathsResponse.data.paths[0]);
      }
    } else {
      Alert.alert('Error', 'Failed to load path types');
    }

    setLoading(false);
  };

  const handleContinue = () => {
    if (!selectedPath) {
      Alert.alert('Error', 'Please select a path type');
      return;
    }

    navigation.navigate('Parameters', { 
      vehicle,
      path: selectedPath
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading paths...</Text>
      </View>
    );
  }

  const getPathIcon = (pathId) => {
    switch(pathId) {
      case 'straight': return '➡️';
      case 'parabola': return '⤴️';
      case 'bezier': return '〰️';
      default: return '📍';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehicleLabel}>Selected Vehicle:</Text>
          <Text style={styles.vehicleName}>{vehicle.name}</Text>
        </View>

        <Text style={styles.subtitle}>Select Motion Path</Text>

        <View style={styles.pathContainer}>
          {paths.map((path) => (
            <TouchableOpacity
              key={path.id}
              style={[
                styles.pathCard,
                selectedPath?.id === path.id && styles.pathCardSelected
              ]}
              onPress={() => setSelectedPath(path)}
            >
              <View style={styles.pathIcon}>
                <Text style={styles.pathIconText}>{getPathIcon(path.id)}</Text>
              </View>
              <View style={styles.pathInfo}>
                <Text style={styles.pathName}>{path.name}</Text>
                <Text style={styles.pathDescription}>{path.description}</Text>
              </View>
              {selectedPath?.id === path.id && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue →</Text>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  vehicleInfo: {
    backgroundColor: '#E3F2FD',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  vehicleLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  pathContainer: {
    marginBottom: 20,
  },
  pathCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pathCardSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
  },
  pathIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  pathIconText: {
    fontSize: 32,
  },
  pathInfo: {
    flex: 1,
  },
  pathName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  pathDescription: {
    fontSize: 14,
    color: '#666',
  },
  checkmark: {
    fontSize: 24,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});