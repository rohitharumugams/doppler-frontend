import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');
const CANVAS_WIDTH = screenWidth - 70;
const CANVAS_HEIGHT = 300;
const PADDING = 40;

export default function PathVisualizer({ 
  pathType, 
  parameters, 
  isAnimating = false, 
  animationProgress = 0 
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isAnimating) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isAnimating]);

  const calculatePhysicsPath = () => {
    const points = [];
    const numPoints = 100;
    const speed = parseFloat(parameters.speed) || 20;
    const duration = parseFloat(parameters.audio_duration) || 5;
    
    if (pathType === 'straight') {
      const h = parseFloat(parameters.h) || 10;
      const angle = parseFloat(parameters.angle) || 0;
      const angleRad = (angle * Math.PI) / 180;
      
      for (let i = 0; i < numPoints; i++) {
        const t = ((i / (numPoints - 1)) - 0.5) * duration;
        const x = speed * t * Math.cos(angleRad);
        const y = h + speed * t * Math.sin(angleRad);
        points.push({ x, y });
      }
      
    } else if (pathType === 'parabola') {
      const a = parseFloat(parameters.a) || 0.1;
      const h = parseFloat(parameters.h) || 10;
      
      for (let i = 0; i < numPoints; i++) {
        const t = ((i / (numPoints - 1)) - 0.5) * duration;
        const x = speed * t;
        const y = a * x * x + h;
        points.push({ x, y });
      }
      
    } else if (pathType === 'bezier') {
      const x0 = parseFloat(parameters.x0) || -30;
      const y0 = parseFloat(parameters.y0) || 20;
      const x1 = parseFloat(parameters.x1) || -10;
      const y1 = parseFloat(parameters.y1) || -10;
      const x2 = parseFloat(parameters.x2) || 10;
      const y2 = parseFloat(parameters.y2) || -10;
      const x3 = parseFloat(parameters.x3) || 30;
      const y3 = parseFloat(parameters.y3) || 20;
      
      for (let i = 0; i < numPoints; i++) {
        const t = i / (numPoints - 1);
        
        const x = Math.pow(1-t, 3) * x0 + 
                  3 * Math.pow(1-t, 2) * t * x1 + 
                  3 * (1-t) * Math.pow(t, 2) * x2 + 
                  Math.pow(t, 3) * x3;
                  
        const y = Math.pow(1-t, 3) * y0 + 
                  3 * Math.pow(1-t, 2) * t * y1 + 
                  3 * (1-t) * Math.pow(t, 2) * y2 + 
                  Math.pow(t, 3) * y3;
        
        points.push({ x, y });
      }
    }
    
    return points;
  };

  const transformToCanvas = (points) => {
    if (points.length === 0) return [];
    
    // Find bounds including observer at (0,0)
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });
    
    const dataWidth = maxX - minX || 1;
    const dataHeight = maxY - minY || 1;
    
    // Calculate scale to fit
    const scaleX = (CANVAS_WIDTH - 2 * PADDING) / dataWidth;
    const scaleY = (CANVAS_HEIGHT - 2 * PADDING) / dataHeight;
    const scale = Math.min(scaleX, scaleY, 4);
    
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;
    const dataCenterX = (minX + maxX) / 2;
    const dataCenterY = (minY + maxY) / 2;
    
    // Transform points
    const canvasPoints = points.map(p => ({
      x: centerX + (p.x - dataCenterX) * scale,
      y: centerY - (p.y - dataCenterY) * scale
    }));
    
    // Observer position in canvas coordinates
    const observerX = centerX + (0 - dataCenterX) * scale;
    const observerY = centerY - (0 - dataCenterY) * scale;
    
    return { points: canvasPoints, observer: { x: observerX, y: observerY }, scale };
  };

  const generatePathString = (points) => {
    if (points.length === 0) return '';
    let pathStr = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathStr += ` L ${points[i].x} ${points[i].y}`;
    }
    return pathStr;
  };

  const physicsPoints = calculatePhysicsPath();
  const { points, observer, scale } = transformToCanvas(physicsPoints);
  const pathString = generatePathString(points);

  // Find closest approach
  let closestIndex = Math.floor(points.length / 2);
  let minDistance = Infinity;
  
  points.forEach((point, index) => {
    const dist = Math.sqrt(
      Math.pow(point.x - observer.x, 2) + 
      Math.pow(point.y - observer.y, 2)
    );
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = index;
    }
  });

  const currentPointIndex = isAnimating 
    ? Math.floor(animationProgress * (points.length - 1))
    : closestIndex;
  
  const currentPoint = points[currentPointIndex] || points[0];
  
  // Calculate distance from observer to vehicle
  const distanceToObserver = Math.sqrt(
    Math.pow(currentPoint.x - observer.x, 2) + 
    Math.pow(currentPoint.y - observer.y, 2)
  );

  // Get parameters for labels
  const speed = parseFloat(parameters.speed) || 20;
  const h = parseFloat(parameters.h) || parseFloat(parameters.y0) || 10;
  const duration = parseFloat(parameters.audio_duration) || 5;
  const pathLength = speed * duration;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Motion Path Diagram</Text>
        {isAnimating && (
          <View style={styles.statusBadge}>
            <View style={styles.recordingDot} />
            <Text style={styles.statusText}>Playing</Text>
          </View>
        )}
      </View>

      <View style={styles.svgContainer}>
        <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
          {/* Grid lines */}
          <Line 
            x1="0" y1={observer.y} 
            x2={CANVAS_WIDTH} y2={observer.y} 
            stroke="#e0e0e0" 
            strokeWidth="1" 
            strokeDasharray="5,5" 
          />
          <Line 
            x1={observer.x} y1="0" 
            x2={observer.x} y2={CANVAS_HEIGHT} 
            stroke="#e0e0e0" 
            strokeWidth="1" 
            strokeDasharray="5,5" 
          />
          
          {/* Axis labels */}
          <SvgText x={observer.x + 10} y={20} fontSize="12" fill="#999" fontWeight="bold">
            Y
          </SvgText>
          <SvgText x={CANVAS_WIDTH - 20} y={observer.y - 10} fontSize="12" fill="#999" fontWeight="bold">
            X
          </SvgText>
          
          {/* Path */}
          <Path d={pathString} stroke="#2196F3" strokeWidth="3" fill="none" />
          
          {/* Start point */}
          {points.length > 0 && (
            <G>
              <Circle cx={points[0].x} cy={points[0].y} r="7" fill="#4CAF50" />
              <SvgText 
                x={points[0].x} 
                y={points[0].y - 18} 
                fontSize="12" 
                fill="#4CAF50" 
                fontWeight="bold"
                textAnchor="middle"
              >
                START
              </SvgText>
            </G>
          )}
          
          {/* End point */}
          {points.length > 1 && (
            <G>
              <Circle 
                cx={points[points.length - 1].x} 
                cy={points[points.length - 1].y} 
                r="7" 
                fill="#F44336" 
              />
              <SvgText 
                x={points[points.length - 1].x} 
                y={points[points.length - 1].y - 18} 
                fontSize="12" 
                fill="#F44336"
                fontWeight="bold"
                textAnchor="middle"
              >
                END
              </SvgText>
            </G>
          )}
          
          {/* Observer */}
          <G>
            <Circle cx={observer.x} cy={observer.y} r="10" fill="#FF5722" />
            <SvgText 
              x={observer.x} 
              y={observer.y + 28} 
              fontSize="13" 
              fill="#FF5722" 
              fontWeight="bold"
              textAnchor="middle"
            >
              OBSERVER
            </SvgText>
          </G>
          
          {/* Distance line from observer to vehicle (when animating or at closest) */}
          {(isAnimating || !isAnimating) && (
            <G>
              <Line 
                x1={observer.x} 
                y1={observer.y} 
                x2={currentPoint.x} 
                y2={currentPoint.y} 
                stroke={isAnimating ? "#FFC107" : "#999"} 
                strokeWidth="2" 
                strokeDasharray="5,5" 
              />
              
              {/* Distance label */}
              <SvgText 
                x={(observer.x + currentPoint.x) / 2} 
                y={(observer.y + currentPoint.y) / 2 - 10} 
                fontSize="11" 
                fill={isAnimating ? "#FFC107" : "#666"}
                fontWeight="bold"
                textAnchor="middle"
              >
                {(distanceToObserver / scale).toFixed(1)}m
              </SvgText>
            </G>
          )}
          
          {/* Height indicator (for straight/parabola) */}
          {(pathType === 'straight' || pathType === 'parabola') && (
            <G>
              <Line 
                x1={observer.x} 
                y1={observer.y} 
                x2={observer.x} 
                y2={observer.y - h * scale} 
                stroke="#9C27B0" 
                strokeWidth="2" 
                strokeDasharray="3,3" 
              />
              <SvgText 
                x={observer.x + 15} 
                y={observer.y - (h * scale) / 2} 
                fontSize="11" 
                fill="#9C27B0"
                fontWeight="bold"
              >
                h={h}m
              </SvgText>
            </G>
          )}
          
          {/* Vehicle */}
          <G>
            {/* Sound waves when animating */}
            {isAnimating && (
              <>
                <Circle 
                  cx={currentPoint.x} 
                  cy={currentPoint.y} 
                  r="25" 
                  stroke="#FF9800" 
                  strokeWidth="2" 
                  fill="none" 
                  opacity="0.4"
                />
                <Circle 
                  cx={currentPoint.x} 
                  cy={currentPoint.y} 
                  r="35" 
                  stroke="#FF9800" 
                  strokeWidth="1" 
                  fill="none" 
                  opacity="0.2"
                />
              </>
            )}
            
            {/* Vehicle */}
            <Circle 
              cx={currentPoint.x} 
              cy={currentPoint.y} 
              r={isAnimating ? "16" : "14"} 
              fill={isAnimating ? "#FF9800" : "#2196F3"} 
            />
            <SvgText 
              x={currentPoint.x - 8} 
              y={currentPoint.y + 6} 
              fontSize="16"
            >
              🚗
            </SvgText>
            
            {/* Velocity vector */}
            {isAnimating && currentPointIndex < points.length - 1 && (
              <G>
                <Line 
                  x1={currentPoint.x} 
                  y1={currentPoint.y} 
                  x2={currentPoint.x + (points[currentPointIndex + 1].x - currentPoint.x) * 3} 
                  y2={currentPoint.y + (points[currentPointIndex + 1].y - currentPoint.y) * 3} 
                  stroke="#4CAF50" 
                  strokeWidth="3" 
                  markerEnd="url(#arrowhead)"
                />
              </G>
            )}
          </G>
        </Svg>
      </View>
      
      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem color="#4CAF50" label="Start" />
        <LegendItem color="#FF5722" label="Observer" />
        <LegendItem color={isAnimating ? "#FF9800" : "#2196F3"} label="Vehicle" />
        <LegendItem color="#F44336" label="End" />
      </View>

      {/* Metrics */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricsRow}>
          <MetricItem 
            icon="⚡" 
            label="Speed" 
            value={`${speed.toFixed(1)} m/s`} 
          />
          <MetricItem 
            icon="📏" 
            label="Path Length" 
            value={`${pathLength.toFixed(1)} m`} 
          />
        </View>
        <View style={styles.metricsRow}>
          <MetricItem 
            icon="📍" 
            label="Distance" 
            value={`${(distanceToObserver / scale).toFixed(1)} m`} 
          />
          <MetricItem 
            icon="⏱️" 
            label="Duration" 
            value={`${duration.toFixed(1)} s`} 
          />
        </View>
      </View>
    </View>
  );
}

function LegendItem({ color, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function MetricItem({ icon, label, value }) {
  return (
    <View style={styles.metricItem}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <View style={styles.metricContent}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE0B2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5722',
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#fafafa',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 5,
  },
  legendText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  metricsContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  metricIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  metricContent: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: '#999',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
});