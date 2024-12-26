import { Minus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useSoundsStore } from "~/store/useSoundsStore";

export default function ToggleDeleteModeButton() {
  const { toggleDeleteMode } = useSoundsStore();

  return (
    <Button onClick={toggleDeleteMode}>
      <Minus />
    </Button>
  );
}
