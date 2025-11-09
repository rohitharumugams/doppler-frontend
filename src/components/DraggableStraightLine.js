import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';
import Svg, { Line, Circle, G, Path } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');
const CANVAS_WIDTH = screenWidth - 40;
const CANVAS_HEIGHT = 400;
const SCALE = 5; // pixels per meter

export default function DraggableStraightLine({ parameters, onParametersChange }) {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;

  // Convert parameters to canvas coordinates
  const hValue = parseFloat(parameters.h) || 10;
  const angleValue = parseFloat(parameters.angle) || 0;
  const angleRad = (angleValue * Math.PI) / 180;

  // Calculate line endpoints based on h and angle
  const lineLength = 100; // visual length on canvas
  
  // Perpendicular line to observer at distance h
  const perpX = Math.sin(angleRad) * hValue * SCALE;
  const perpY = -Math.cos(angleRad) * hValue * SCALE;
  
  // Line endpoints perpendicular to the radial direction
  const lineStartX = centerX + perpX - Math.cos(angleRad) * lineLength;
  const lineStartY = centerY + perpY - Math.sin(angleRad) * lineLength;
  const lineEndX = centerX + perpX + Math.cos(angleRad) * lineLength;
  const lineEndY = centerY + perpY + Math.sin(angleRad) * lineLength;

  // Draggable point on the line (closest point to observer)
  const [dragPointX, setDragPointX] = useState(centerX + perpX);
  const [dragPointY, setDragPointY] = useState(centerY + perpY);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const newX = dragPointX + gestureState.dx;
        const newY = dragPointY + gestureState.dy;
        
        // Calculate new h and angle from drag position
        const dx = newX - centerX;
        const dy = newY - centerY;
        const newH = Math.sqrt(dx * dx + dy * dy) / SCALE;
        const newAngle = Math.atan2(dx, -dy) * (180 / Math.PI);
        
        // Clamp values
        const clampedH = Math.max(1, Math.min(100, newH));
        const clampedAngle = Math.max(-45, Math.min(45, newAngle));
        
        onParametersChange({
          ...parameters,
          h: clampedH.toFixed(1),
          angle: clampedAngle.toFixed(1)
        });
      },
      onPanResponderRelease: (evt, gestureState) => {
        const newX = dragPointX + gestureState.dx;
        const newY = dragPointY + gestureState.dy;
        setDragPointX(newX);
        setDragPointY(newY);
      }
    })
  ).current;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 Drag the Line to Adjust Path</Text>
      
      <View style={styles.canvasContainer}>
        <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
          {/* Grid background */}
          <Line x1="0" y1={centerY} x2={CANVAS_WIDTH} y2={centerY} stroke="#e0e0e0" strokeWidth="1" strokeDasharray="5,5" />
          <Line x1={centerX} y1="0" x2={centerX} y2={CANVAS_HEIGHT} stroke="#e0e0e0" strokeWidth="1" strokeDasharray="5,5" />
          
          {/* Vehicle path line */}
          <Line 
            x1={lineStartX} 
            y1={lineStartY} 
            x2={lineEndX} 
            y2={lineEndY} 
            stroke="#2196F3" 
            strokeWidth="4" 
          />
          
          {/* Perpendicular distance indicator */}
          <Line 
            x1={centerX} 
            y1={centerY} 
            x2={centerX + perpX} 
            y2={centerY + perpY} 
            stroke="#9C27B0" 
            strokeWidth="2" 
            strokeDasharray="5,5" 
          />
          
          {/* Observer (you) */}
          <Circle cx={centerX} cy={centerY} r="12" fill="#FF5722" />
          
          {/* Draggable point (closest approach) */}
          <G {...panResponder.panHandlers}>
            <Circle 
              cx={centerX + perpX} 
              cy={centerY + perpY} 
              r="20" 
              fill="#4CAF50" 
              opacity="0.3"
            />
            <Circle 
              cx={centerX + perpX} 
              cy={centerY + perpY} 
              r="12" 
              fill="#4CAF50" 
            />
          </G>
          
          {/* Vehicle icon */}
          <G>
            <Circle 
              cx={centerX + perpX - Math.cos(angleRad) * 50} 
              cy={centerY + perpY - Math.sin(angleRad) * 50} 
              r="10" 
              fill="#2196F3" 
            />
          </G>
        </Svg>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Distance (h)</Text>
            <Text style={styles.infoValue}>{hValue.toFixed(1)} m</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Angle</Text>
            <Text style={styles.infoValue}>{angleValue.toFixed(1)}°</Text>
          </View>
        </View>
      </View>

      <View style={styles.hintContainer}>
        <Text style={styles.hintIcon}>💡</Text>
        <Text style={styles.hintText}>
          Drag the green dot to adjust the vehicle's path. The vehicle moves along the blue line.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  canvasContainer: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  infoContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  hintContainer: {
    marginTop: 15,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hintIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  hintText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});