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
      
      if (jobData.status === 'processing') {
        setStatus('Processing audio...');
        setProgress(jobData.progress || 50);
        setTimeout(() => checkStatus(), POLLING_INTERVAL);
      } 
      else if (jobData.status === 'completed') {
        // No "Simulation complete!" banner — go straight to Result
        navigation.replace('Result', {
          vehicle,
          path,
          parameters,
          result: jobData.result,
          jobId: jobId
        });
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

    checkStatus();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔊</Text>
          <ActivityIndicator size="large" color="#2196F3" style={styles.spinner} />
        </View>

        <Text style={styles.statusText}>{status}</Text>
        
        {progress > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        )}
      </View>
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
    marginBottom: 32,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  progressContainer: {
    width: '84%',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
