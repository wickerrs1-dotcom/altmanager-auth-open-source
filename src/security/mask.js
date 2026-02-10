function maskId(id) {
  const s = String(id || '');
  if (s.length <= 8) return s;
  return s.slice(0, 4) + '…' + s.slice(-4);
}

module.exports = { maskId };
