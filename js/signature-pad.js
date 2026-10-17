(() => {
  'use strict';

  function renderSignaturePaths(svg, paths, options = {}) {
    const width = options.width || 600;
    const height = options.height || 220;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', options.preserveAspectRatio || 'none');
    svg.replaceChildren();
    if (!Array.isArray(paths)) return;
    paths.forEach(d => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('stroke-width', String(options.lineWidth || 2.4));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', options.stroke || '#172554');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.classList.add('firma-trazo');
      svg.appendChild(path);
    });
  }

  function createSignaturePad(svg, options = {}) {
    const width = options.width || 600;
    const height = options.height || 220;
    const maxStrokes = options.maxStrokes || 100;
    const maxPathLength = options.maxPathLength || 40000;
    let paths = [];
    let dibujando = false;
    let trazoActual = null;

    function render() {
      renderSignaturePaths(svg, paths, { ...options, width, height });
    }

    render();

    function position(event) {
      const bounds = svg.getBoundingClientRect();
      const round = value => Number(value.toFixed(2));
      return {
        x: round(Math.max(0, Math.min(width, (event.clientX - bounds.left) * width / bounds.width))),
        y: round(Math.max(0, Math.min(height, (event.clientY - bounds.top) * height / bounds.height)))
      };
    }

    function changed() {
      if (options.onChange) options.onChange(paths.length ? [...paths] : null);
    }

    svg.addEventListener('pointerdown', event => {
      const start = position(event);
      if (paths.length >= maxStrokes) {
        options.onLimit?.('strokes');
        return;
      }
      svg.setPointerCapture(event.pointerId);
      dibujando = true;
      const endX = Math.min(width, Math.round((start.x + 0.1) * 100) / 100);
      const d = `M${start.x} ${start.y} L${endX} ${start.y}`;
      paths.push(d);
      trazoActual = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      trazoActual.setAttribute('d', d);
      trazoActual.setAttribute('stroke-width', String(options.lineWidth || 2.4));
      trazoActual.classList.add('firma-trazo');
      svg.appendChild(trazoActual);
    });

    svg.addEventListener('pointermove', event => {
      if (!dibujando || !trazoActual) return;
      const point = position(event);
      const index = paths.length - 1;
      const d = `${paths[index]} L${point.x} ${point.y}`;
      if (d.length > maxPathLength) {
        dibujando = false;
        trazoActual = null;
        options.onLimit?.('path');
        changed();
        return;
      }
      paths[index] = d;
      trazoActual.setAttribute('d', d);
    });

    function finish() {
      if (!dibujando) return;
      dibujando = false;
      trazoActual = null;
      changed();
    }

    svg.addEventListener('pointerup', finish);
    svg.addEventListener('pointercancel', finish);

    return {
      clear() {
        paths = [];
        render();
        changed();
      },
      getPaths() {
        return [...paths];
      },
      hasSignature() {
        return paths.length > 0;
      },
      setPaths(value) {
        paths = Array.isArray(value) ? [...value] : [];
        render();
      }
    };
  }

  window.renderSignaturePaths = renderSignaturePaths;
  window.createSignaturePad = createSignaturePad;
})();
