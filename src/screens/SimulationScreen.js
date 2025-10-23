import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  Alert
} from 'react-native';
import ApiService from '../services/api';
import { POLLING_INTERVAL } from '../constants/config';

export default function SimulationScreen({ route, navigation }) {
  const { vehicle, path, parameters } = route.params;
  
  const [status, setStatus] = useState('Starting simulation...');
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState(null);

  useEffect(() => {
    startSimulation();
  }, []);

  const startSimulation = async () => {
    setStatus('Sending request to server...');
    
    // Start simulation
    const result = await ApiService.startSimulation(parameters);
    
    if (!result.success) {
      Alert.alert(
        'Simulation Failed',
        result.error || 'Failed to start simulation',
        [
          { 
            text: 'Go Back', 
            onPress: () => navigation.goBack() 
          }
        ]
      );
      return;
    }

    const { job_id } = result.data;
    setJobId(job_id);
    setStatus('Processing Doppler effect...');
    
    // Start polling for job status
    pollJobStatus(job_id);
  };

  const pollJobStatus = async (jobId) => {
    const checkStatus = async () => {
      const result = await ApiService.getJobStatus(jobId);
      
      if (!result.success) {
        Alert.alert('Error', 'Failed to check simulation status');
        return;
      }

      const jobData = result.data;
      
      // Update status
      if (jobData.status === 'processing') {
        setStatus('Processing audio...');
        setProgress(jobData.progress || 50);
        
        // Continue polling
        setTimeout(() => checkStatus(), POLLING_INTERVAL);
      } 
      else if (jobData.status === 'completed') {
        setStatus('Simulation complete!');
        setProgress(100);
        
        // Navigate to result screen
        setTimeout(() => {
          navigation.replace('Result', {
            vehicle,
            path,
            parameters,
            result: jobData.result,
            jobId: jobId
          });
        }, 1000);
      } 
      else if (jobData.status === 'failed') {
        Alert.alert(
          'Simulation Failed',
          jobData.error || 'Unknown error occurred',
          [
            { 
              text: 'Go Back', 
              onPress: () => navigation.goBack() 
            }
          ]
        );
      }
    };

    // Start checking
    checkStatus();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Animation Icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔊</Text>
          <ActivityIndicator size="large" color="#2196F3" style={styles.spinner} />
        </View>

        {/* Status Text */}
        <Text style={styles.statusText}>{status}</Text>
        
        {/* Progress */}
        {progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.infoContainer}>
          <InfoRow label="Vehicle" value={vehicle.name} />
          <InfoRow label="Path" value={path.name} />
          <InfoRow label="Speed" value={`${parameters.speed} m/s`} />
          <InfoRow label="Duration" value={`${parameters.audio_duration}s`} />
        </View>

        {/* Fun fact */}
        <View style={styles.tipContainer}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            The Doppler effect was named after Austrian physicist Christian Doppler who proposed it in 1842!
          </Text>
        </View>
      </View>
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 40,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
  },
  spinner: {
    position: 'absolute',
    width: 100,
    height: 100,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 30,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tipContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});