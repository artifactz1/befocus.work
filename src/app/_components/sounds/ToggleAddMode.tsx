import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useSoundsStore } from "~/store/useSoundsStore";

export default function ToggleAddMode() {
  const { toggleAddMode, toggleDeleteMode, isDeleteMode } = useSoundsStore();

  const handleSubmit = () => {
    if (isDeleteMode === true) {
      toggleAddMode();
    } else {
      toggleAddMode();
      toggleDeleteMode();
    }
  };

  return (
    <Button onClick={handleSubmit}>
      <Plus />
    </Button>
  );
}
