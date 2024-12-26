import { Minus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useSoundsStore } from "~/store/useSoundsStore";

export default function ToggleDeleteModeButton() {
  const { toggleDeleteMode } = useSoundsStore();

  const handleSubmit = () => {
    toggleDeleteMode();
  };

  return (
    <Button onClick={handleSubmit}>
      <Minus />
    </Button>
  );
}
