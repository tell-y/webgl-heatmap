import React, { createRef, useEffect } from 'react';
import WebGLHeatmap from '../../../src/index';

const canvasRef = createRef();

const App = () => {
  useEffect(() => {
    const canvas = canvasRef.current;
    const heatmap = WebGLHeatmap({ canvas, intensityToAlpha: true });
    var paintAtCoord = function(x, y) {
      var count = 0;
      while (count < 200) {
        var xoff = Math.random() * 2 - 1;
        var yoff = Math.random() * 2 - 1;
        var l = xoff * xoff + yoff * yoff;
        if (l > 1) {
          continue;
        }
        var ls = Math.sqrt(l);
        xoff /= ls;
        yoff /= ls;
        xoff *= 1 - l;
        yoff *= 1 - l;
        count += 1;
        heatmap.addPoint(x + xoff * 50, y + yoff * 50, 30, 2 / 300);
      }
    };
    canvas.onmousemove = function(event) {
      var x = event.offsetX || event.clientX;
      var y = event.offsetY || event.clientY;

      paintAtCoord(x, y);
    };
    canvas.onclick = function() {
      heatmap.clear();
    };
    var raf =
      window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.msRequestAnimationFrame;

    var update = function() {
      //heatmap.addPoint(100, 100, 100, 10/255);
      heatmap.adjustSize(); // can be commented out for statically sized heatmaps, resize clears the map
      heatmap.update(); // adds the buffered points
      heatmap.display(); // adds the buffered points
      //heatmap.multiply(0.9995);
      //heatmap.blur();
      //heatmap.clamp(0.0, 1.0); // depending on usecase you might want to clamp it
      raf(update);
    };
    raf(update);
  }, []);
  return (
    <div>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};

export default App;
