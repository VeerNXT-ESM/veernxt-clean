const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  fetchSitemap:        (url)     => ipcRenderer.invoke('fetch-sitemap', url),
  runScraper:          (urls)    => ipcRenderer.invoke('run-scraper', urls),
  scrapeSarkariLatest: (options) => ipcRenderer.invoke('scrape-sarkari-latest', options),
  checkDbStatus:       (jobs)    => ipcRenderer.invoke('check-db-status', jobs),
  uploadToDatabase:    (payload) => ipcRenderer.invoke('upload-to-database', payload),
  // Legacy enrichment pipeline
  fetchAndEnrichJobs:  (opts)    => ipcRenderer.invoke('fetch-and-enrich-jobs', opts),
  pushToJobsV2:        (jobs)    => ipcRenderer.invoke('push-to-jobs-v2', jobs),
  onLogMessage: (callback) => ipcRenderer.on('log-message', (event, data) => callback(data)),
});

