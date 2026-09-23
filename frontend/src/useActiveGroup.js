import { useState } from "react";

// TEMPORARY, same as the earlier group-id workaround: there's no "list my
// groups" endpoint yet, so we just remember one group id in localStorage.
// Replace with a real group picker once that endpoint exists.
export function useActiveGroup() {
  const [groupId, setGroupIdState] = useState(localStorage.getItem("active_group_id") || "");

  const setGroupId = (value) => {
    setGroupIdState(value);
    localStorage.setItem("active_group_id", value);
  };

  return [groupId, setGroupId];
}
