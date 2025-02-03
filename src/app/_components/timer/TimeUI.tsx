import { motion, MotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

function TimerUI({ value, fontSize }: { value: number; fontSize?: string }) {
  // Change padding and fontsize to change view 
  // const fontSize = 500;
  const padding = 200;
  const height = 500 + padding;

  return (
    <div
      style={{ fontSize }}
      className="flex overflow-hidden rounded px-2 font-bold leading-none"
    >
      <Digit place={10} value={value} height={height} />
      <Digit place={1} value={value} height={height} />
    </div>
  );
}

function Digit({
  place,
  value,
  height,
}: {
  place: number;
  value: number;
  height: number;
}) {
  const valueRoundedToPlace = Math.floor(value / place);
  const animatedValue = useSpring(valueRoundedToPlace);

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  return (
    <div style={{ height }} className="relative w-[0.95ch] tabular-nums">
      {[...Array(10).keys()].map((i) => (
        <Number key={i} mv={animatedValue} number={i} height={height} />
      ))}
    </div>
  );
}

function Number({
  mv,
  number,
  height,
}: {
  mv: MotionValue<number>;
  number: number;
  height: number;
}) {
  const y = useTransform(mv, (latest) => {
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;

    let memo = offset * height;

    if (offset > 5) {
      memo -= 10 * height;
    }

    return memo;
  });

  return (
    <motion.span
      style={{ y }}
      className="absolute inset-0 flex items-center justify-center"
    >
      {number}
    </motion.span>
  );
}

export default TimerUI;
