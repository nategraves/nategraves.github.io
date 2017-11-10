const maxScale = 0.667;
let bb;
let changeColor = false;

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

function drawPaths(data) {
  if (Array.isArray(data)) {
    $('#svgs').empty();
    for (let i = 0; i < data.length; i++) {
      const currentPath = data[i];
      const _draw = SVG('svgs').size(350, 350);
      _draw.rect(350, 350).fill(tinycolor.random().toHexString()).move(0, 0);

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

  $(document).on('contextmenu', 'svg', function() {
    return false;
  });
 
  $(document).on('mousemove touchmove', 'svg', function(e) {
    if (changeColor) {
      var el = $(e.srcElement || e.target);
      var offset = el.offset();
      var width = ($(this).width()) / 360;
      var height = ($(this).height()) / 100;
      var h = parseInt((e.pageX - offset.left) / width, 10);
      var s = parseInt((e.pageY - offset.top) / height, 10);
      var v = ((h / 3.6) + s) / 2;
      var color = tinycolor({ h, s, v });

      var path = this.childNodes.forEach((node) => {
        if (node.constructor.name === "SVGRectElement") {
          node.setAttribute("fill", `#${color.toHex()}`);
        }
      });
    }
  });

  $(document).on('mousedown touchstart', 'svg', function(e) {
    switch (e.which) {
      case 1:
        changeColor = !changeColor;
        break;
      case 3:
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(this);

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

        break;
    }
  });
});