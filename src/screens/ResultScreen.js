import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { Audio } from 'expo-av';
import ApiService from '../services/api';
import PathVisualizer from '../components/PathVisualizer';

export default function ResultScreen({ route, navigation }) {
  const { vehicle, path, parameters, result, jobId } = route.params;
  
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    loadAudio();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      const audioUrl = ApiService.getDownloadUrl(result.filename);
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      
      await newSound.setProgressUpdateIntervalAsync(8); // or 33 for ~30fps
      setSound(newSound);
      
      const status = await newSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis / 1000);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load audio: ' + error.message);
    }
  };

  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis / 1000);
      setIsPlaying(status.isPlaying);
      if (status.durationMillis > 0) {
        setAnimationProgress(status.positionMillis / status.durationMillis);
      }
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
        setAnimationProgress(0);
      }
    }
  };

  const playPauseAudio = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const stopAudio = async () => {
    if (!sound) return;
    await sound.stopAsync();
    await sound.setPositionAsync(0);
    setPosition(0);
    setIsPlaying(false);
    setAnimationProgress(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* AUDIO PLAYER MOVED UP */}
        <View style={styles.playerContainer}>
          <Text style={styles.playerTitle}>🎵 Audio Player</Text>

          <View style={styles.waveform}>
            <View style={styles.waveformBar} />
            <View style={[styles.waveformBar, styles.waveformBarTall]} />
            <View style={styles.waveformBar} />
            <View style={[styles.waveformBar, styles.waveformBarTall]} />
            <View style={[styles.waveformBar, styles.waveformBarShort]} />
            <View style={[styles.waveformBar, styles.waveformBarTall]} />
            <View style={styles.waveformBar} />
            <View style={[styles.waveformBar, styles.waveformBarShort]} />
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${duration > 0 ? (position / duration) * 100 : 0}%` }
                ]} 
              />
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{formatTime(position)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={stopAudio}
            >
              <Text style={styles.controlButtonText}>⏹️</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.controlButton, styles.playButton]}
              onPress={playPauseAudio}
            >
              <Text style={styles.playButtonText}>
                {isPlaying ? '⏸️' : '▶️'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => {
                if (sound) {
                  sound.setPositionAsync(0);
                  setAnimationProgress(0);
                }
              }}
            >
              <Text style={styles.controlButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* VISUALIZER BELOW PLAYER */}
        <PathVisualizer 
          pathType={path.id} 
          parameters={parameters}
          isAnimating={isPlaying}
          animationProgress={animationProgress}
        />

        {/* SIMULATION DETAILS (Vehicle/PathType removed) */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>📊 Simulation Details</Text>

          <DetailRow label="Speed" value={`${parameters.speed} m/s`} />
          <DetailRow label="Duration" value={`${result.duration.toFixed(2)}s`} />
          
          {result.freq_ratio_range && (
            <>
              <DetailRow 
                label="Min Frequency Ratio" 
                value={result.freq_ratio_range.min.toFixed(3)} 
              />
              <DetailRow 
                label="Max Frequency Ratio" 
                value={result.freq_ratio_range.max.toFixed(3)} 
              />
            </>
          )}
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            The frequency increases as the vehicle approaches and decreases as it moves away.
          </Text>
        </View>

        {/* No bottom New Simulation button; headerRight handles it */}
        <View style={{ height: 12 }} />
      </ScrollView>
    </View>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 20 },

  playerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  playerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  waveform: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 60,
    marginBottom: 16,
  },
  waveformBar: {
    width: 6,
    height: 30,
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  waveformBarTall: { height: 50 },
  waveformBarShort: { height: 20 },

  progressContainer: { marginBottom: 16 },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    borderRadius: 3,
  },
  timeContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { fontSize: 12, color: '#666' },

  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: { fontSize: 24 },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2196F3',
  },
  playButtonText: { fontSize: 32 },

  detailsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: { fontSize: 14, color: '#666' },
  detailValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },

  infoBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: { fontSize: 20, marginRight: 10 },
  infoText: { flex: 1, fontSize: 14, color: '#666', lineHeight: 20 },
});
