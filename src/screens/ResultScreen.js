import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import ApiService from '../services/api';
import PathVisualizer from '../components/PathVisualizer';

export default function ResultScreen({ route, navigation }) {
  const { vehicle, path, parameters, result, jobId } = route.params;
  
  const audioUrl = ApiService.getDownloadUrl(result.filename);
  const player = useAudioPlayer({ uri: audioUrl });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (player.duration) {
        setDuration(player.duration);
      }

      if (player.playing) {
        const currentPos = player.currentTime;
        setPosition(currentPos);
        setIsPlaying(true);
        
        if (player.duration > 0) {
          setAnimationProgress(currentPos / player.duration);
        }

        if (currentPos >= player.duration && player.duration > 0) {
          setIsPlaying(false);
          setPosition(0);
          setAnimationProgress(0);
        }
      } else {
        setIsPlaying(false);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      player.remove();
    };
  }, []);

  const playPauseAudio = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const stopAudio = () => {
    player.pause();
    player.seekTo(0);
    setPosition(0);
    setIsPlaying(false);
    setAnimationProgress(0);
  };

  const restartAudio = () => {
    player.seekTo(0);
    setPosition(0);
    setAnimationProgress(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateFileName = () => {
    const vehicleName = vehicle?.name?.replace(/\s+/g, '_') || 'vehicle';
    const speed = parameters?.speed || 20;
    const audioDuration = parameters?.audio_duration || result?.duration || 5;
    
    return `${vehicleName}_${speed}ms_${audioDuration}s_audio.mp3`;
  };

  const downloadAudio = async () => {
    try {
      setIsDownloading(true);

      const fileName = generateFileName();
      const fileUri = FileSystem.documentDirectory + fileName;

      const downloadResult = await FileSystem.downloadAsync(audioUrl, fileUri);

      if (downloadResult.status === 200) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'audio/wav',
            dialogTitle: 'Save Doppler Audio',
            UTI: 'public.audio'
          });
          Alert.alert('Success', 'Audio ready to save!');
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      } else {
        Alert.alert('Error', 'Failed to prepare audio file');
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', `Failed to download audio: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
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
              onPress={restartAudio}
            >
              <Text style={styles.controlButtonText}>🔄</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.downloadButton, isDownloading && styles.downloadButtonDisabled]}
            onPress={downloadAudio}
            disabled={isDownloading}
          >
            <Text style={styles.downloadButtonText}>
              {isDownloading ? '⏳ Preparing...' : '💾 Download MP3'}
            </Text>
          </TouchableOpacity>
        </View>

        <PathVisualizer 
          pathType={path.id} 
          parameters={parameters}
          isAnimating={isPlaying}
          animationProgress={animationProgress}
        />

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
    marginBottom: 16,
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

  downloadButton: {
    backgroundColor: '#4CAF50',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  downloadButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

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