async function sendNearbyAlert(client, channelId, text){
  try {
    if (!client || !channelId) return;
    const ch = await client.channels.fetch(channelId).catch(()=>null);
    if (!ch) return;
    await ch.send({ content: text }).catch(()=>{});
  } catch (e) {}
}

module.exports = { sendNearbyAlert };
