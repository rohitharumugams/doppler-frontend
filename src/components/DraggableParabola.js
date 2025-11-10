import React, { useRef, useMemo } from 'react';
import { View, Text, StyleSheet, PanResponder, Dimensions } from 'react-native';
import Slider from '@react-native-community/slider';
import Svg, { Line, Circle, Path } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');
const CANVAS_WIDTH = screenWidth - 40;
const CANVAS_HEIGHT = 400;

export default function DraggableParabola({ parameters, onParametersChange, scale, onScaleChange }) {

  // A = curvature   |   H = height (vertex y)
  const A = useMemo(() => Number(parameters?.a ?? 0.1), [parameters?.a]);
  const H = useMemo(() => Number(parameters?.h ?? 10), [parameters?.h]);

  const centerX = CANVAS_WIDTH / 2;
  const centerY = CANVAS_HEIGHT / 2;

  const wx2cx = (x) => centerX + x * scale;
  const wy2cy = (y) => centerY - y * scale; // invert world Y

  // Vertex
  const vx = 0;
  const vy = H;

  // Parabola sampling (simple y = A*x² + H)
  const samples = 160;
  const xSpan = 40;
  const xs = Array.from({ length: samples }, (_, i) =>
    -xSpan + (2 * xSpan * i) / (samples - 1)
  );
  const pts = xs.map(x => [x, A * x * x + H]);

  const pathD = pts.reduce(
    (acc, [x, y], i) =>
      acc + (i === 0 ? `M ${wx2cx(x)} ${wy2cy(y)}` : ` L ${wx2cx(x)} ${wy2cy(y)}`),
    ""
  );

  // Drag state for vertex
  const drag = useRef({ startH: H });

  const vertexPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        drag.current.startH = H;
      },
      onPanResponderMove: (_, g) => {
        const dyw = -g.dy / scale;
        let newH = drag.current.startH + dyw;

        // ✅ Clamp so parabola never goes into negative Y
        if (newH < 0) newH = 0;

        onParametersChange?.(prev => ({
          ...prev,
          h: Number(newH.toFixed(2)),
        }));
      }
    })
  ).current;

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Parabola • Drag vertex • Adjust A</Text>

      {/* ZOOM SLIDER */}
      <View style={styles.sliderRow}>
        <Text style={styles.sliderLabel}>Zoom</Text>
        <Slider
          style={{ flex: 1 }}
          minimumValue={0.1}
          maximumValue={15}
          step={0.1}
          value={scale}
          onValueChange={onScaleChange}
        />
        <Text style={styles.sliderValue}>{scale.toFixed(1)}x</Text>
      </View>

      {/* A SLIDER */}
      <View style={styles.sliderRow}>
        <Text style={styles.sliderLabel}>A</Text>
        <Slider
          style={{ flex: 1 }}
          minimumValue={0}
          maximumValue={0.5}
          step={0.01}
          value={A}
          onValueChange={(v) => {
            onParametersChange?.(prev => ({
              ...prev,
              a: Number(v.toFixed(3)),
            }));
          }}
        />
        <Text style={styles.sliderValue}>{A.toFixed(2)}</Text>
      </View>

      {/* CANVAS */}
      <View style={styles.canvas}>
        <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>

          {/* Axes */}
          <Line x1="0" y1={wy2cy(0)} x2={CANVAS_WIDTH} y2={wy2cy(0)} stroke="#ccc" strokeDasharray="4,4" />
          <Line x1={wx2cx(0)} y1="0" x2={wx2cx(0)} y2={CANVAS_HEIGHT} stroke="#ccc" strokeDasharray="4,4" />

          {/* Parabola */}
          <Path d={pathD} stroke="#2196F3" strokeWidth="4" fill="none" />

          {/* VERTEX (GREEN HANDLE) */}
          <Circle
            cx={wx2cx(vx)}
            cy={wy2cy(vy)}
            r="16"
            fill="#4CAF50"
            {...vertexPan.panHandlers}
          />
        </Svg>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoLine}>A = {A.toFixed(3)}</Text>
        <Text style={styles.infoLine}>Height H = {H.toFixed(2)}</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginVertical: 20
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8
  },
  sliderLabel: {
    width: 40,
    textAlign: "right",
    color: "#555",
    fontSize: 14
  },
  sliderValue: {
    width: 50,
    textAlign: "left",
    fontSize: 14
  },
  canvas: {
    backgroundColor: "#fafafa",
    borderRadius: 8,
    marginTop: 10,
    overflow: "hidden"
  },
  infoBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#E3F2FD",
    borderRadius: 8
  },
  infoLine: {
    textAlign: "center",
    fontSize: 14,
    color: "#333"
  }
});
