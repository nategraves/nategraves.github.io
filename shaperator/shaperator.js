let _draw;
let _drawnPath;

function generatePath() {
  $('.lloader').fadeIn();
  $('.error').hide();
  $('.svgs-container').hide();
  $.ajax({
    url: 'https://41bc3972.ngrok.io/generate',
    type: 'GET',
    success: function(response) {
      draw(response.paths);
      $('.lloader').hide();
      $('.svgs-container').fadeIn();
    },
    error: function(error) {
      $('.lloader').hide();
      $('.error').fadeIn();
      $('.svgs-container').fadeIn();
    }
  }).done();
}

function draw(data) {
  if (Array.isArray(data)) {
    $('#svgs').empty();
    for (let i = 0; i < data.length; i++) {
      const currentPath = data[i];
      _draw = SVG('svgs').size(500, 500);
      _draw.rect(500, 500).fill('#ffffff').move(0, 0);

      _drawnPath = _draw.path(currentPath);
      _drawnPath.fill('#212025');

      const maxScale = 0.667;
      const widthScale = maxScale / (_drawnPath.bbox().w / _draw.width());
      const heightScale = maxScale / (_drawnPath.bbox().h / _draw.height());
      _drawnPath.scale(widthScale, heightScale);

      const xMove = _drawnPath.transform().x + ((_draw.width() - _drawnPath.bbox().w) / 2) - _drawnPath.bbox().x;
      const yMove =  _drawnPath.transform().y + ((_draw.height() - _drawnPath.bbox().h) / 2) - _drawnPath.bbox().y;
      _drawnPath.translate(xMove, yMove);
    }
  }
  else {
    _draw = SVG('svgs').size(500, 500);
    _draw.rect(500, 500).fill('#ffffff').move(0, 0);

    _drawnPath = _draw.path(data);
    _drawnPath.fill('#212025');

    const maxScale = 0.667;
    const widthScale = maxScale / (_drawnPath.bbox().w / _draw.width());
    const heightScale = maxScale / (_drawnPath.bbox().h / _draw.height());
    _drawnPath.scale(widthScale, heightScale);

    const xMove = _drawnPath.transform().x + ((_draw.width() - _drawnPath.bbox().w) / 2) - _drawnPath.bbox().x;
    const yMove =  _drawnPath.transform().y + ((_draw.height() - _drawnPath.bbox().h) / 2) - _drawnPath.bbox().y;
    _drawnPath.translate(xMove, yMove);
  }
}

$(function() {
  $('.lloader').hide();
  $.ajax({
    url: 'https://41bc3972.ngrok.io',
    type: 'GET'
  }).done(function(response) {
    draw(response.paths);
  });

  $('.generate').click(function() {
    generatePath();
  });

  
  $(document).on('mousemove', 'svg', function(e) {
    var el = $(e.srcElement || e.target);
    var offset = el.offset();
    /*
    var h = (e.pageX - offset.left) / Math.round(el.width() * 0.99);
    var s = (e.pageY - offset.top) / el.height()
    var l = h;
    console.log(`(${h}, ${s}, ${l})`);
    var color = tinycolor({ h, s, l });
    */
    var width = ($(this).width()) / 360;
    var height = ($(this).height()) / 100;
    var h = parseInt((e.pageX - offset.left) / width, 10);
    var s = parseInt((e.pageY - offset.top) / height, 10);
    var v = ((h / 3.6) + s) / 2;
    console.log(`${h}, ${s}, ${v}`);
    var color = tinycolor({ h, s, v });

    var path = this.childNodes.forEach((node) => {
      if (node.constructor.name === "SVGPathElement") {
        node.setAttribute("fill", `#${color.toHex()}`);
      }
    });
  });

  $(document).on('click', 'svg', function() {
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
  });
});