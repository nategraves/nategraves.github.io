const maxScale = 0.667;
let bb;
let changeColor = false;
let colorBackground = true;
let shiftDown = false;
let controlDown = false;
let altDown = false;

function generatePath() {
  $('.lloader').fadeIn();
  $('.error').hide();
  $('.svgs-container').hide();
  $.ajax({
    url: 'https://41bc3972.ngrok.io/generate',
    type: 'GET',
    success: function(response) {
      $('.lloader').hide();
      $('.svgs-container').show();
      drawPaths(response.paths);
    },
    error: function(error) {
      $('.lloader').hide();
      $('.error').fadeIn();
      $('.svgs-container').fadeIn();
    }
  }).done();
}

function customClick(draw) {
  if (altDown) {
    save(draw.node);
    return;
  } else if (shiftDown) {
    rotate(draw);
    return;
  } else if (!controlDown && !altDown && !shiftDown) {
    swapColors(draw.node);
    return;
  } 
}

function rotate(draw) {
  const path = draw.last();
  path.transform({ rotation: 90}, true);
}

function drawPaths(data) {
  if (Array.isArray(data)) {
    $('#svgs').empty();
    for (let i = 0; i < data.length; i++) {
      const currentPath = data[i];
      const _draw = SVG('svgs').size(350, 350);
      _draw.rect(350, 350).fill(tinycolor.random().toHexString()).move(0, 0);
      _draw.click(function() { customClick(this); });
      _draw.mousemove(function(e) { updateColor(this.node, e); });

      const _drawnPath = _draw.path(currentPath);
      _drawnPath.fill('#ffffff');
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
  else {
    _draw = SVG('svgs').size(350, 350);
    _draw.rect(350, 350).fill(tinycolor.random().toHexString()).move(0, 0);
    _draw.click(function() { customClick(this); });
    _draw.mousemove(function(e) { updateColor(this.node, e); });

    _drawnPath = _draw.path(data);
    _drawnPath.fill('#ffffff');
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

function updateColor(svg, e) {
  if (!controlDown) return;
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

$(function() {
  $('.svgs-container').hide();
  $('.lloader').show();
  $.ajax({
    url: 'https://41bc3972.ngrok.io',
    type: 'GET'
  }).done(function(response) {
    $('.lloader').hide();
    $('.svgs-container').show();
    drawPaths(response.paths);
  });

  $('.generate').click(function() {
    generatePath();
  });

  $(document).on('keyup keydown', function(e) {
    shiftDown = e.shiftKey;
    altDown = e.altKey;
    controlDown = e.ctrlKey;
  });
});