function formatNearbyDate(d){
  try {
    const dt = d || new Date();
    const month  = dt.toLocaleString('en-US', { month: 'long' });
    const day    = dt.getDate();
    const year   = dt.getFullYear();
    const hour   = dt.getHours() % 12 || 12;
    const min    = dt.getMinutes().toString().padStart(2, '0');
    const ampm   = dt.getHours() >= 12 ? 'PM' : 'AM';
    return `${month} ${day}, ${year} ${hour}:${min} ${ampm}`;
  } catch (e) { return (d || new Date()).toString(); }
}

function formatAlert({ ign, pos, serverHost, date }){
  const when = formatNearbyDate(date || new Date());
  const x = Math.round(pos.x), y = Math.round(pos.y), z = Math.round(pos.z);
  return `Alerts\nIGN: ${ign}\nCoords: X: ${x} Y: ${y} Z: ${z}\n\n${serverHost} | ${when}`;
}

module.exports = { formatAlert };
