import { useState, useEffect } from "react";
import api from "./api";

export default function AccountScreen() {
  const [rider, setRider] = useState(null);
  const [error, setError] = useState(null);
  const riderId = localStorage.getItem("rider_id");

  useEffect(() => {
    api.get(`/riders/${riderId}/`)
      .then((res) => setRider(res.data))
      .catch((err) => setError(err.response?.data?.detail || err.message));
  }, [riderId]);

  if (error) return <div className="screen-container"><p className="error-text">{error}</p></div>;
  if (!rider) return <div className="screen-container"><p className="muted-text">Loading…</p></div>;

  return (
    <div className="account-screen">
      <div className="rider-card">
        <div className="rider-avatar">🧑‍✈️</div>
        <div>
          <h2>{rider.first_name} {rider.last_name}</h2>
          <div className="role">{String(rider.rider_role || "").toUpperCase()}</div>
        </div>
      </div>

      <div className="info-row accented"><span className="label">Age</span><span className="value">{rider.age}</span></div>
      <div className="info-row"><span className="label">Weight</span><span className="value">{rider.weight} kg</span></div>
      <div className="info-row"><span className="label">Height</span><span className="value">{rider.height} cm</span></div>
      <div className="info-row"><span className="label">Blood group</span><span className="value">{rider.blood_group || "—"}</span></div>
      <div className="info-row"><span className="label">Birth date</span><span className="value">{rider.birth_date}</span></div>
      <div className="info-row"><span className="label">Email</span><span className="value">{rider.email}</span></div>

      <div className="section-title">Bikes</div>
      {rider.bikes?.length === 0 && <p className="empty-note">No bikes on file.</p>}
      {rider.bikes?.map((b, i) => (
        <div className="bike-row" key={i}>
          <div style={{fontWeight:600,fontSize:13}}>{b.bikename}</div>
          <div className="empty-note">Plate: {b.numberplate}</div>
          {b.insurance && <a href={b.insurance} target="_blank" rel="noreferrer" style={{color:"var(--amber)",fontSize:12}}>Insurance doc</a>}
        </div>
      ))}
    </div>
  );
}
