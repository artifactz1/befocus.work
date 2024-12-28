import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useSoundsStore } from "~/store/useSoundsStore";

export default function ToggleAddMode() {
  const { toggleAddMode, toggleDeleteMode, isDeleteMode } = useSoundsStore();

  const handleSubmit = () => {
    // if (isDeleteMode === true) {
    //   toggleAddMode();
    // } else {
    //   toggleAddMode();
    //   toggleDeleteMode();
    // }

    if (isDeleteMode === true) {
      toggleDeleteMode();
      toggleAddMode();
    } else {
      toggleAddMode();
    }
  };

  return (
    <Button onClick={handleSubmit}>
      <Plus />
    </Button>
  );
}
