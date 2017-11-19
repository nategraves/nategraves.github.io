const maxScale = 0.667;
let bb;
let changeColor = false;
let colorBackground = true;
let shiftDown = false;
let controlDown = false;
let altDown = false;
let shapeOffset = 0;
const URL = 'https://699de3fa.ngrok.io';

function customClick(draw) {
  if (altDown) {
    save(draw.node);
    return;
  } else if (shiftDown) {
    //rotate(draw);
    return;
  } else if (!controlDown && !altDown && !shiftDown) {
    swapColors(draw.node);
    return;
  } 
}

function rotate(e, draw) {
  var el = $(e.srcElement || e.target);
  var offset = el.offset();
  var x = parseInt((e.pageX - offset.left) / width, 10);
  var y = parseInt((e.pageY - offset.top) / height, 10);
  console.log(`X: ${x}, Y: ${y}`);

  const path = draw.last();
  path.transform({ rotation: 90}, true);
}

function drawPaths(data) {
  $('#svgs').empty();
  for (let i = 0; i < data.length; i++) {
    const currentPath = data[i];
    const _draw = SVG('svgs').size(350, 350);
    const color = tinycolor.random().toHexString();
    const white = '#ffffff';
    const noBg = math.randomInt(1);

    if (i % 2 == noBg) {
      _draw.rect(350, 350).fill(color).move(0, 0);
      _draw.click(function() { customClick(this); });
      _draw.mousemove(function(e) { updateColor(this.node, e); });

      const _drawnPath = _draw.path(currentPath);
      _drawnPath.fill(white);
      bb = _drawnPath.bbox();

      const widthScale = maxScale / (bb.w / _draw.width());
      const heightScale = maxScale / (bb.h / _draw.height());
      _drawnPath.scale(widthScale, heightScale);
      bb = _drawnPath.bbox();

      const xMove = _drawnPath.transform().x + ((_draw.width() - bb.w) / 2) - bb.x;
      const yMove =  _drawnPath.transform().y + ((_draw.height() - bb.h) / 2) - bb.y;
      _drawnPath.translate(xMove, yMove);
    } else {
      _draw.rect(350, 350).fill(white).move(0, 0);
      _draw.click(function() { customClick(this); });
      _draw.mousemove(function(e) { updateColor(this, e); });

      const _drawnPath = _draw.path(currentPath);
      _drawnPath.fill(color);
      bb = _drawnPath.bbox();

      const widthScale = maxScale / (bb.w / _draw.width());
      const heightScale = maxScale / (bb.h / _draw.height());
      _drawnPath.scale(widthScale, heightScale);
      bb = _drawnPath.bbox();

      const xMove = _drawnPath.transform().x + ((_draw.width() - bb.w) / 2) - bb.x;
      const yMove =  _drawnPath.transform().y + ((_draw.height() - bb.h) / 2) - bb.y;
      _drawnPath.translate(xMove, yMove);
    }
  }
}

function save(svg) {
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svg);

  if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }

  if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
    source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
  const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
  const downloadLink = document.createElement("a");
  downloadLink.href = svgUrl;
  downloadLink.download = `${Date.now()}.svg`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

function updateColor(draw, e) {
  console.log(shiftDown);
  if (controlDown) {
    var el = $(e.srcElement || e.target);
    var offset = el.offset();
    var width = ($(svg).width()) / 360;
    var height = ($(svg).height()) / 100;
    var h = parseInt((e.pageX - offset.left) / width, 10);
    var s = parseInt((e.pageY - offset.top) / height, 10);
    var v = (h + s) / 2;
    var color = tinycolor({ h, s, v });

    var path = svg.childNodes.forEach((node) => {
      if (colorBackground && node.constructor.name === "SVGRectElement") {
        node.setAttribute("fill", `#${color.toHex()}`);
      }
      if (colorBackground && node.constructor.name === "SVGPathElement") {
        node.setAttribute("fill", '#ffffff');
      }

      if (!colorBackground && node.constructor.name === "SVGRectElement") {
        node.setAttribute("fill", '#ffffff');
      }
      if (!colorBackground && node.constructor.name === "SVGPathElement") {
        node.setAttribute("fill", `#${color.toHex()}`);
      }
    });
  }
  
  if (shiftDown) {
    console.log("rotate");
    rotate(e, draw);
  }
}

function swapColors(svg) {
  colorBackground = !colorBackground;
  var bgColor;
  var fgColor;
  
  var elements = svg.childNodes;

  elements.forEach((node) => {
    if (colorBackground && node.constructor.name === "SVGRectElement") {
      fgColor = node.getAttribute("fill");
    }
    if (colorBackground && node.constructor.name === "SVGPathElement") {
      bgColor = node.getAttribute("fill");
    }

    if (!colorBackground && node.constructor.name === "SVGRectElement") {
      fgColor = node.getAttribute("fill");
    }
    if (!colorBackground && node.constructor.name === "SVGPathElement") {
      bgColor = node.getAttribute("fill");
    }
  });

  elements.forEach((node) => {
    if (node.constructor.name === "SVGRectElement") {
      node.setAttribute("fill", bgColor);
    }

    if (node.constructor.name === "SVGPathElement") {
      node.setAttribute("fill", fgColor);
    }
  });
}

function pollShapes() {
  console.log("Polling for new shapes...");
  $.ajax({
    url: URL,
    type: 'GET'
  }).done(function(response) {
    drawPaths(response.paths);
  });
}

$(function() {
  pollShapes();

  $(document).on('keyup keydown', function(e) {
    shiftDown = e.shiftKey;
    altDown = e.altKey;
    controlDown = e.ctrlKey;
  });

  setInterval(function() {
    pollShapes();
  }, 1000 * 60 * 10);
});