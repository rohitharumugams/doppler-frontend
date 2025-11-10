import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import Svg, { Path, Circle, Line } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');
const CANVAS_WIDTH = screenWidth - 40;
const CANVAS_HEIGHT = 400;

export default function DraggableBezier({
  parameters,
  onParametersChange,
  scale: scaleProp,
  onScaleChange,
}) {
  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;

  // Controlled zoom (persisted by parent if provided)
  const [internalScale, setInternalScale] = useState(5);
  const controlled = typeof scaleProp === 'number' && typeof onScaleChange === 'function';
  const scale = controlled ? scaleProp : internalScale;
  const setScale = controlled ? onScaleChange : setInternalScale;

  // Read points (accept strings or numbers → numbers)
  const p = useMemo(() => {
    const num = (v, d = 0) => Number(v ?? d);
    return {
      x0: num(parameters?.x0, -30),
      y0: num(parameters?.y0, 20),
      x1: num(parameters?.x1, -10),
      y1: num(parameters?.y1, -10),
      x2: num(parameters?.x2, 10),
      y2: num(parameters?.y2, -10),
      x3: num(parameters?.x3, 30),
      y3: num(parameters?.y3, 20),
    };
  }, [parameters?.x0, parameters?.y0, parameters?.x1, parameters?.y1, parameters?.x2, parameters?.y2, parameters?.x3, parameters?.y3]);

  // world ↔ canvas
  const wx2cx = (x) => centerX + x * scale;
  const wy2cy = (y) => centerY - y * scale;
  const cx2wx = (cx) => (cx - centerX) / scale;
  const cy2wy = (cy) => (centerY - cy) / scale;

  // One finger only
  const oneFinger = (evt) => evt.nativeEvent.touches.length === 1;

  // Generic pan responder factory for each point
  const makePointPR = (pxKey, pyKey) =>
    useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: oneFinger,
        onMoveShouldSetPanResponder: oneFinger,
        onPanResponderMove: (_, gesture) => {
          const dxw = gesture.dx / scale;
          const dyw = -gesture.dy / scale;

          const newX = p[pxKey] + dxw;
          const newY = p[pyKey] + dyw;

          // Update only the two changed keys; keep others intact
          onParametersChange?.((prev) => ({
            ...prev,
            [pxKey]: Number(newX.toFixed(2)),
            [pyKey]: Number(newY.toFixed(2)),
          }));
        },
      })
    ).current;

  const p0PR = makePointPR('x0', 'y0');
  const p1PR = makePointPR('x1', 'y1');
  const p2PR = makePointPR('x2', 'y2');
  const p3PR = makePointPR('x3', 'y3');

  // Build cubic path: M P0 C P1 P2 P3  (P0=start, P3=end; P1,P2=control points)
  const d = `M ${wx2cx(p.x0)} ${wy2cy(p.y0)} C ${wx2cx(p.x1)} ${wy2cy(p.y1)} ${wx2cx(p.x2)} ${wy2cy(p.y2)} ${wx2cx(p.x3)} ${wy2cy(p.y3)}`;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Drag the four points (P1..P4) • Slider = Zoom</Text>

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
          {/* Axes */}
          <Line x1="0" y1={wy2cy(0)} x2={CANVAS_WIDTH} y2={wy2cy(0)} stroke="#e0e0e0" strokeWidth="1" strokeDasharray="5,5" />
          <Line x1={wx2cx(0)} y1="0" x2={wx2cx(0)} y2={CANVAS_HEIGHT} stroke="#e0e0e0" strokeWidth="1" strokeDasharray="5,5" />

          {/* Control polygon for reference */}
          <Line x1={wx2cx(p.x0)} y1={wy2cy(p.y0)} x2={wx2cx(p.x1)} y2={wy2cy(p.y1)} stroke="#BDBDBD" strokeWidth="1" />
          <Line x1={wx2cx(p.x1)} y1={wy2cy(p.y1)} x2={wx2cx(p.x2)} y2={wy2cy(p.y2)} stroke="#BDBDBD" strokeWidth="1" />
          <Line x1={wx2cx(p.x2)} y1={wy2cy(p.y2)} x2={wx2cx(p.x3)} y2={wy2cy(p.y3)} stroke="#BDBDBD" strokeWidth="1" />

          {/* Bezier curve */}
          <Path d={d} stroke="#2196F3" strokeWidth="4" fill="none" />

          {/* Draggable points */}
          <Circle {...p0PR.panHandlers} cx={wx2cx(p.x0)} cy={wy2cy(p.y0)} r="18" fill="#4CAF50" opacity="0.25" />
          <Circle {...p0PR.panHandlers} cx={wx2cx(p.x0)} cy={wy2cy(p.y0)} r="10" fill="#4CAF50" />

          <Circle {...p1PR.panHandlers} cx={wx2cx(p.x1)} cy={wy2cy(p.y1)} r="18" fill="#FF9800" opacity="0.25" />
          <Circle {...p1PR.panHandlers} cx={wx2cx(p.x1)} cy={wy2cy(p.y1)} r="10" fill="#FF9800" />

          <Circle {...p2PR.panHandlers} cx={wx2cx(p.x2)} cy={wy2cy(p.y2)} r="18" fill="#FF5722" opacity="0.25" />
          <Circle {...p2PR.panHandlers} cx={wx2cx(p.x2)} cy={wy2cy(p.y2)} r="10" fill="#FF5722" />

          <Circle {...p3PR.panHandlers} cx={wx2cx(p.x3)} cy={wy2cy(p.y3)} r="18" fill="#9C27B0" opacity="0.25" />
          <Circle {...p3PR.panHandlers} cx={wx2cx(p.x3)} cy={wy2cy(p.y3)} r="10" fill="#9C27B0" />
        </Svg>
      </View>

      {/* Coordinates quick view */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Points</Text>
        <View style={styles.row}>
          <Text style={styles.item}>P1: ({p.x0.toFixed(2)}, {p.y0.toFixed(2)})</Text>
          <Text style={styles.item}>P2: ({p.x1.toFixed(2)}, {p.y1.toFixed(2)})</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.item}>P3: ({p.x2.toFixed(2)}, {p.y2.toFixed(2)})</Text>
          <Text style={styles.item}>P4: ({p.x3.toFixed(2)}, {p.y3.toFixed(2)})</Text>
        </View>
      </View>

      <View style={styles.hintContainer}>
        <Text style={styles.hintText}>
          Curve = M P1 C P2 P3 P4. Drag the four dots; no angles or extra controls.
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
  infoContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0' },
  infoTitle: { fontSize: 12, color: '#999', marginBottom: 6, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
  item: { fontSize: 13, color: '#333' },
  hintContainer: { marginTop: 10, backgroundColor: '#E3F2FD', borderRadius: 8, padding: 10 },
  hintText: { fontSize: 12, color: '#666', textAlign: 'center' },
});
