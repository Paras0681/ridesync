import { useState, useEffect } from "react";
import api from "./api";

export default function GroupPicker({ value, onChange }) {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    api
      .get("/groups/mine/")
      .then((res) => setGroups(res.data))
      .catch(() => {});
  }, []);

  return (
    <select
      className="select-modern group-select"
      value={value || ""}
      onChange={(e) => {
        const g = groups.find((g) => g.group_id === e.target.value);
        if (g) onChange({ id: g.group_id, name: g.group_name });
      }}
    >
      <option value="" disabled>
        Select a group…
      </option>
      {groups.map((g) => (
        <option key={g.group_id} value={g.group_id}>
          {g.group_name}
        </option>
      ))}
    </select>
  );
}
