import { motion, MotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

const fontSize = 50;
const padding = 15;
const height = fontSize + padding;

const types = ["settings", "timer"] as const;
type Types = (typeof types)[number];

function Counter({ value, type, fontSize}: { value: number; type: Types,}) {
  return (
    <div
      style={{ fontSize }}
      className="flex overflow-hidden rounded pl-2 pr-1 font-bold leading-none"
    >
      {type === "settings" && (
        <>
          {value >= 100 && <Digit place={100} value={value} />}
          {value >= 10 && <Digit place={10} value={value} />}
          <Digit place={1} value={value} />
        </>
      )}
      {type === "timer" && (
        <>
          <Digit place={10} value={value} />
          <Digit place={1} value={value} />
        </>
      )}
    </div>
  );
}

function Digit({ place, value }: { place: number; value: number }) {
  const valueRoundedToPlace = Math.floor(value / place);
  const animatedValue = useSpring(valueRoundedToPlace);

  useEffect(() => {
    animatedValue.set(valueRoundedToPlace);
  }, [animatedValue, valueRoundedToPlace]);

  return (
    <div style={{ height }} className="relative w-[0.95ch] tabular-nums">
      {[...Array(10).keys()].map((i) => (
        <Number key={i} mv={animatedValue} number={i} />
      ))}
    </div>
  );
}

function Number({ mv, number }: { mv: MotionValue<number>; number: number }) {
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

export default Counter;
