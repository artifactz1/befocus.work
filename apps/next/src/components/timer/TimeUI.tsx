import { type MotionValue, motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

function TimerUI({
  value,
  fontSize = "25vw",
}: {
  value: number;
  fontSize?: string;
}) {
  return (
    <div
      style={{ fontSize, lineHeight: "1em" }} // Ensure line-height matches font-size
      className="flex overflow-hidden rounded px-2 font-bold leading-none"
    >
      <Digit place={10} value={value} />
      <Digit place={1} value={value} />
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
    <div
      style={{ height: "0.9em" }}
      className="relative w-[0.95ch] tabular-nums"
    >
      {[...Array(10).keys()].map((i) => (
        <DigitNumber key={i} mv={animatedValue} number={i} />
      ))}
    </div>
  );
}

function DigitNumber({ mv, number }: { mv: MotionValue<number>; number: number }) {
  const y = useTransform(mv, (latest) => {
    const placeValue = latest % 10;
    const offset = (10 + number - placeValue) % 10;

    let memo = offset * 1;

    if (offset > 5) {
      memo -= 10;
    }

    return `${memo}em`; // Use em to match the text height
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
