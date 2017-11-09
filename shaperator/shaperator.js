let _draw;
let _drawnPath;

function generatePath() {
  $('.lloader').fadeIn();
  $('.error').hide();
  $('#svgs').hide();
  $.ajax({
    url: 'https://41bc3972.ngrok.io/generate',
    type: 'GET',
    success: function(response) {
      draw(response.paths);
      $('.lloader').hide();
      $('#svgs').fadeIn();
    },
    error: function(error) {
      $('.lloader').hide();
      $('.error').fadeIn();
      $('#svgs').fadeIn();
    }
  }).done();
}

function draw(data) {
  if (Array.isArray(data)) {
    $('#svgs').empty();
    for (let i = 0; i < data.length; i++) {
      const currentPath = data[i];
      _draw = SVG('svgs').size(500, 500);
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
  })

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