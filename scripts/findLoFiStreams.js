const { RadioBrowserApi } = require('radio-browser-api');

async function findLoFiStreams() {
  const api = new RadioBrowserApi('LoFi Stream Finder');
  
  try {
    console.log('Searching for LoFi radio stations...');
    
    // Search for LoFi stations
    const lofiStations = await api.searchStations({
      tag: 'lofi',
      limit: 20,
      hasExtendedInfo: true
    });
    
    console.log(`Found ${lofiStations.length} LoFi stations`);
    
    // Filter for HTTPS streams
    const httpsStreams = lofiStations.filter(station => 
      station.urlResolved && 
      station.urlResolved.startsWith('https://') &&
      station.codec === 'MP3' &&
      station.lastCheckOk === 1
    );
    
    console.log('\n=== HTTPS LoFi Streams ===');
    httpsStreams.slice(0, 5).forEach((station, index) => {
      console.log(`${index + 1}. ${station.name}`);
      console.log(`   URL: ${station.urlResolved}`);
      console.log(`   Country: ${station.country}`);
      console.log(`   Bitrate: ${station.bitrate}kbps`);
      console.log(`   Tags: ${station.tags}`);
      console.log('');
    });
    
    // Also search for chillhop
    console.log('\n=== Searching for Chillhop stations ===');
    const chillhopStations = await api.searchStations({
      tag: 'chillhop',
      limit: 10,
      hasExtendedInfo: true
    });
    
    const chillhopHttps = chillhopStations.filter(station => 
      station.urlResolved && 
      station.urlResolved.startsWith('https://') &&
      station.codec === 'MP3' &&
      station.lastCheckOk === 1
    );
    
    chillhopHttps.slice(0, 3).forEach((station, index) => {
      console.log(`${index + 1}. ${station.name}`);
      console.log(`   URL: ${station.urlResolved}`);
      console.log(`   Country: ${station.country}`);
      console.log(`   Bitrate: ${station.bitrate}kbps`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error searching for streams:', error.message);
  }
}

findLoFiStreams();