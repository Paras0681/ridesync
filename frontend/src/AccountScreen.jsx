import { useState, useEffect } from "react";
import api from "./api";

export default function AccountScreen() {
  const [rider, setRider] = useState(null);
  const [error, setError] = useState(null);
  const riderId = localStorage.getItem("rider_id");

  useEffect(() => {
    api
      .get(`/riders/${riderId}/`)
      .then((res) => setRider(res.data))
      .catch((err) => setError(err.response?.data?.detail || err.message));
  }, []);

  if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>;
  if (!rider) return <div style={{ padding: 24 }}>Loading…</div>;

  return (
    <div style={{ padding: 20, overflowY: "auto", height: "100%" }}>
      <h3>
        {rider.first_name} {rider.last_name}
      </h3>
      <p>Email: {rider.email}</p>
      <p>Role: {rider.rider_role}</p>
      <p>Blood group: {rider.blood_group || "—"}</p>
      <p>Age: {rider.age}</p>
      <p>Weight: {rider.weight} kg</p>
      <p>Height: {rider.height} cm</p>
      <p>Birth date: {rider.birth_date}</p>

      <h4 style={{ marginTop: 20 }}>Bikes</h4>
      {rider.bikes.length === 0 && <p style={{ color: "#666" }}>No bikes on file.</p>}
      {rider.bikes.map((b, i) => (
        <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
          <div style={{ fontWeight: 600 }}>{b.bikename}</div>
          <div>Plate: {b.numberplate}</div>
          <a href={b.insurance} target="_blank" rel="noreferrer">
            Insurance doc
          </a>
        </div>
      ))}
    </div>
  );
}
