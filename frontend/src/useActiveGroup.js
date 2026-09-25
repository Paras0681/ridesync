import { useState } from "react";

// Shared across Maps (notifications), Chat, and Info tabs — whichever
// group the user picks from GroupPicker stays selected across all three
// until they change it.
export function useActiveGroup() {
  const stored = localStorage.getItem("active_group");
  const initial = stored ? JSON.parse(stored) : { id: "", name: "" };
  const [group, setGroupState] = useState(initial);

  const setGroup = (groupObj) => {
    setGroupState(groupObj);
    localStorage.setItem("active_group", JSON.stringify(groupObj));
  };

  return [group, setGroup]; // group = { id, name }
}
