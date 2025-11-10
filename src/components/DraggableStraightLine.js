import React, { useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import Svg, { Line, Circle, G } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');
const CANVAS_WIDTH = screenWidth - 40;
const CANVAS_HEIGHT = 400;

export default function DraggableStraightLine({ parameters, onParametersChange, scale: scaleProp, onScaleChange }) {
  // Canvas frame
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;

  // Zoom (slider) — controlled if props provided; otherwise local state
  const [internalScale, setInternalScale] = useState(5);
  const controlled = typeof scaleProp === 'number' && typeof onScaleChange === 'function';
  const scale = controlled ? scaleProp : internalScale;
  const setScale = controlled ? onScaleChange : setInternalScale;

  // Controlled values from parent (strings or numbers → numbers)
  const h = useMemo(() => Number(parameters?.h ?? 10), [parameters?.h]);
  const angleDeg = useMemo(() => Number(parameters?.angle ?? 0), [parameters?.angle]);
  const speed = useMemo(() => Number(parameters?.speed ?? 20), [parameters?.speed]);
  const duration = useMemo(() => Number(parameters?.audio_duration ?? 5), [parameters?.audio_duration]);

  const angleRad = (angleDeg * Math.PI) / 180;

  // World coords with +Y up (observer at 0,0)
  // Closest point from observer to path
  const closestX = h * Math.sin(angleRad);
  const closestY = h * Math.cos(angleRad);

  const lineExtent = (speed * duration) / 2;
  const dirX = Math.cos(angleRad);
  const dirY = Math.sin(angleRad);

  const lineStartX = closestX - dirX * lineExtent;
  const lineStartY = closestY - dirY * lineExtent;
  const lineEndX   = closestX + dirX * lineExtent;
  const lineEndY   = closestY + dirY * lineExtent;

  // world ↔ canvas
  const wx2cx = (x) => centerX + x * scale;
  const wy2cy = (y) => centerY - y * scale; // invert Y for canvas

  // Drag state capturing initial handle positions to avoid drift
  const dragState = useRef({
    startH: h,
    baseEndX: lineEndX,
    baseEndY: lineEndY,
  });

  const oneFinger = (evt) => evt.nativeEvent.touches.length === 1;

  // GREEN handle: adjust h along outward normal n = (sinθ, cosθ)
  const midpointPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: oneFinger,
      onMoveShouldSetPanResponder: oneFinger,
      onPanResponderGrant: () => {
        dragState.current.startH = h;
      },
      onPanResponderMove: (_, gestureState) => {
        const dxw = gestureState.dx / scale;
        const dyw = -gestureState.dy / scale;

        const nx = Math.sin(angleRad);
        const ny = Math.cos(angleRad);
        const radialMovement = dxw * nx + dyw * ny;

        const newH = Math.max(0.1, Math.min(1000, dragState.current.startH + radialMovement));

        // IMPORTANT: only send the changed key using a function updater
        onParametersChange?.((prev) => ({
          ...prev,
          h: Number(newH.toFixed(2)),
        }));
      },
    })
  ).current;

  // ORANGE handle: rotate angle by dragging the endpoint around the closest point
  const endpointPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: oneFinger,
      onMoveShouldSetPanResponder: oneFinger,
      onPanResponderGrant: () => {
        // capture the endpoint at the start of the drag (world coords)
        dragState.current.baseEndX = lineEndX;
        dragState.current.baseEndY = lineEndY;
      },
      onPanResponderMove: (_, gestureState) => {
        const dxw = gestureState.dx / scale;
        const dyw = -gestureState.dy / scale;

        const newEndX = dragState.current.baseEndX + dxw;
        const newEndY = dragState.current.baseEndY + dyw;

        const vx = newEndX - closestX;
        const vy = newEndY - closestY;

        let newAngle = (Math.atan2(vy, vx) * 180) / Math.PI; // CCW from +X
        // normalize to [-180,180]
        if (newAngle > 180) newAngle -= 360;
        if (newAngle < -180) newAngle += 360;
        // clamp softly to [-45,45]
        newAngle = Math.max(-45, Math.min(45, newAngle));

        onParametersChange?.((prev) => ({
          ...prev,
          angle: Number(newAngle.toFixed(2)),
        }));
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Drag Dots • Use slider to zoom</Text>

      {/* Zoom slider */}
      <View style={styles.sliderRow}>
        <Text style={styles.sliderLabel}>Zoom</Text>
        <Slider
          style={{ flex: 1, height: 36 }}
          minimumValue={0.1}
          maximumValue={15}
          step={0.1}
          value={scale}
          onValueChange={setScale}
        />
        <Text style={styles.sliderValue}>{scale.toFixed(1)}x</Text>
      </View>

      <View style={styles.canvasContainer}>
        <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
          {/* Axes through observer (centered on Y-axis as requested) */}
          <Line x1="0" y1={wy2cy(0)} x2={CANVAS_WIDTH} y2={wy2cy(0)} stroke="#e0e0e0" strokeWidth="1" strokeDasharray="5,5" />
          <Line x1={wx2cx(0)} y1="0" x2={wx2cx(0)} y2={CANVAS_HEIGHT} stroke="#e0e0e0" strokeWidth="1" strokeDasharray="5,5" />

          {/* Path segment (time-symmetric around closest approach) */}
          <Line
            x1={wx2cx(lineStartX)}
            y1={wy2cy(lineStartY)}
            x2={wx2cx(lineEndX)}
            y2={wy2cy(lineEndY)}
            stroke="#2196F3"
            strokeWidth="4"
          />

          {/* Observer → closest point line */}
          <Line
            x1={wx2cx(0)}
            y1={wy2cy(0)}
            x2={wx2cx(closestX)}
            y2={wy2cy(closestY)}
            stroke="#9C27B0"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Observer */}
          <Circle cx={wx2cx(0)} cy={wy2cy(0)} r="12" fill="#FF5722" />

          {/* GREEN handle (distance) */}
          <G {...midpointPanResponder.panHandlers}>
            <Circle cx={wx2cx(closestX)} cy={wy2cy(closestY)} r="20" fill="#4CAF50" opacity="0.25" />
            <Circle cx={wx2cx(closestX)} cy={wy2cy(closestY)} r="12" fill="#4CAF50" />
          </G>

          {/* ORANGE handle (angle) */}
          <G {...endpointPanResponder.panHandlers}>
            <Circle cx={wx2cx(lineEndX)} cy={wy2cy(lineEndY)} r="20" fill="#FF9800" opacity="0.25" />
            <Circle cx={wx2cx(lineEndX)} cy={wy2cy(lineEndY)} r="12" fill="#FF9800" />
          </G>
        </Svg>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Distance (h)</Text>
            <Text style={styles.infoValue}>{h.toFixed(2)} m</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Angle</Text>
            <Text style={styles.infoValue}>{angleDeg.toFixed(2)}°</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Speed</Text>
            <Text style={styles.infoValue}>{Number.isFinite(speed) ? speed.toFixed(2) : '--'} m/s</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{Number.isFinite(duration) ? duration.toFixed(2) : '--'} s</Text>
          </View>
        </View>
      </View>

      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>Green: Distance • Orange: Angle • Slider: Zoom</Text>
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
    marginBottom: 10,
    textAlign: 'center',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  sliderLabel: { fontSize: 12, color: '#666', marginRight: 8, width: 40, textAlign: 'right' },
  sliderValue: { fontSize: 12, color: '#333', marginLeft: 8, width: 50, textAlign: 'left' },
  canvasContainer: {
    backgroundColor: '#fafafa',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  infoContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-around' },
  infoItem: { alignItems: 'center' },
  infoLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  infoValue: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  hintContainer: {
    marginTop: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 10,
  },
  hintText: { fontSize: 12, color: '#666', textAlign: 'center' },
});
