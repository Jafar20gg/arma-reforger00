import L from 'leaflet';
import { lookupOfflineTile } from './offlineTiles';

/**
 * Same as a normal Leaflet tile layer, but each tile is first looked up in the downloaded (offline) maps.
 * If the tile is stored it is shown from the device, otherwise it loads from the network exactly as before
 * (so retry/diagnostics code that works with the <img> keeps working).
 */
export function createOfflineAwareTileLayer(urlTemplate: string, options: L.TileLayerOptions): L.TileLayer {
  class OfflineAwareTileLayer extends L.TileLayer {
    createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
      const self = this as any;
      const tile = document.createElement('img');
      L.DomEvent.on(tile, 'load', L.Util.bind(self._tileOnLoad, this, done, tile));
      L.DomEvent.on(tile, 'error', L.Util.bind(self._tileOnError, this, done, tile));
      const cross = self.options.crossOrigin;
      if (cross || cross === '') tile.crossOrigin = cross === true ? '' : cross;
      tile.alt = '';
      tile.setAttribute('role', 'presentation');

      const url: string = self.getTileUrl(coords);
      (tile as any)._originalSrc = url; // retries after an error always go to the network URL

      const free = () => {
        if (tile.src.startsWith('blob:')) URL.revokeObjectURL(tile.src);
      };
      tile.addEventListener('load', free);

      lookupOfflineTile(url).then((blobUrl) => {
        tile.src = blobUrl ?? url;
      });
      return tile;
    }
  }
  return new (OfflineAwareTileLayer as any)(urlTemplate, options) as L.TileLayer;
}
