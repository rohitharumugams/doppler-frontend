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

export default function HomeScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    checkBackendAndLoadData();
  }, []);

  const checkBackendAndLoadData = async () => {
    setLoading(true);
    
    // Check if backend is reachable
    const healthCheck = await ApiService.checkHealth();
    if (!healthCheck.success) {
      Alert.alert(
        'Connection Error',
        'Cannot connect to backend server. Please check your internet connection.',
        [
          { text: 'Retry', onPress: checkBackendAndLoadData },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      setLoading(false);
      return;
    }

    // Load vehicles
    const vehiclesResponse = await ApiService.getVehicles();
    if (vehiclesResponse.success) {
      setVehicles(vehiclesResponse.data.vehicles);
      if (vehiclesResponse.data.vehicles.length > 0) {
        setSelectedVehicle(vehiclesResponse.data.vehicles[0]);
      }
    } else {
      Alert.alert('Error', 'Failed to load vehicle types');
    }

    setLoading(false);
  };

  const handleContinue = () => {
    if (!selectedVehicle) {
      Alert.alert('Error', 'Please select a vehicle type');
      return;
    }

    navigation.navigate('PathSelection', { 
      vehicle: selectedVehicle 
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Connecting to server...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>🔊 Doppler Effect Simulator</Text>
        <Text style={styles.subtitle}>Select Vehicle Type</Text>

        <View style={styles.vehicleContainer}>
          {vehicles.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              style={[
                styles.vehicleCard,
                selectedVehicle?.id === vehicle.id && styles.vehicleCardSelected
              ]}
              onPress={() => setSelectedVehicle(vehicle)}
            >
              <View style={styles.vehicleIcon}>
                <Text style={styles.vehicleIconText}>
                  {vehicle.id === 'car' ? '🚗' : vehicle.id === 'train' ? '🚂' : '✈️'}
                </Text>
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{vehicle.name}</Text>
                <Text style={styles.vehicleDescription}>{vehicle.description}</Text>
              </View>
              {selectedVehicle?.id === vehicle.id && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.infoText}>
          The Doppler effect changes the frequency of sound as the source moves relative to the observer.
        </Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  vehicleContainer: {
    marginBottom: 20,
  },
  vehicleCard: {
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
  vehicleCardSelected: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  vehicleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  vehicleIconText: {
    fontSize: 32,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  vehicleDescription: {
    fontSize: 14,
    color: '#666',
  },
  checkmark: {
    fontSize: 24,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  continueButton: {
    backgroundColor: '#2196F3',
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