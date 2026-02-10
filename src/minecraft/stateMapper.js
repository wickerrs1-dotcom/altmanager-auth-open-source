function mapEvent(type,data){switch(type){case 'kicked':return {action:'Kicked',detail:JSON.stringify(data)};case 'error':return {action:'Error',detail:String(data&&data.message||data)};case 'end':return {action:'Disconnected',detail:String(data||'')};default:return {action:type,detail:JSON.stringify(data)}}}
module.exports={mapEvent}
