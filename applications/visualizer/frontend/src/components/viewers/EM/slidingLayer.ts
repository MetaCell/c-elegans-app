import type { Map } from "ol";
import type Layer from "ol/layer/Layer";
import { SlidingRing } from "../../../helpers/slidingRing";
import type { SlidingRingOptions } from "../../../helpers/slidingRing";

interface SlidingLayerOptions<T extends Layer> extends Pick<SlidingRingOptions<T>, "cacheSize" | "startAt" | "extent"> {
  map: Map;
  newLayer: (slice: number) => T;
  onSlide?: (slice: number, layer: T) => void;
}

export class SlidingLayer<T extends Layer> {
  private swindow: SlidingRing<T>;
  private opaque = true; // loaded but is transparent
  private visible = true; // not loaded and can not be seen

  constructor(options: SlidingLayerOptions<T>) {
    const { map, newLayer, onSlide, ...ringOpts } = options;

    const opts: SlidingRingOptions<T> = {
      ...ringOpts,
      onPush: (slice) => {
        const layer = newLayer(slice);
        layer.setOpacity(0);
        layer.setVisible(this.visible);
        map.addLayer(layer);
        return layer;
      },
      onSelected: (slice, layer) => {
        onSlide?.(slice, layer);
        layer.setOpacity(Number(this.opaque));
      },
      onUnselected: (_, layer) => {
        layer.setOpacity(0);
      },
      onEvict: (_, layer) => {
        map.removeLayer(layer);
      },
    };

    this.swindow = new SlidingRing<T>(opts);
  }

  show() {
    this.swindow.ring[this.swindow.pos].o.setOpacity(1);
    this.opaque = true;
  }

  hide() {
    this.swindow.ring[this.swindow.pos].o.setOpacity(0);
    this.opaque = false;
  }

  disable() {
    this.setVisibility(false);
  }

  enable() {
    this.setVisibility(true);
  }

  setVisibility(isVisible: boolean) {
    if (this.visible === isVisible) {
      return;
    }

    for (const { o } of this.swindow.ring) {
      o.setVisible(isVisible);
    }

    this.visible = isVisible;
  }

  next() {
    this.swindow.next();
  }
  prev() {
    this.swindow.prev();
  }
  goto(slice: number) {
    this.swindow.goto(slice);
  }
  debug() {
    this.swindow.debug();
  }
}
