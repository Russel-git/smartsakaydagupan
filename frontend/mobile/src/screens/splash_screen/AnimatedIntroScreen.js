import React from "react";
import { useWindowDimensions } from "react-native";

import AnimatedSplash_V1 from "./AnimatedSplash_V1";
import AnimatedSplash_V2 from "./AnimatedSplash_V2";

export default function AnimatedIntroScreen({ onFinish }) {
  const { width } = useWindowDimensions();

  // Wide screens
  if (width >= 600) {
    return <AnimatedSplash_V1 onFinish={onFinish} />;
  }

  // Phones / smaller screens
  return <AnimatedSplash_V2 onFinish={onFinish} />;
}
