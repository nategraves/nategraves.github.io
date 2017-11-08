let _draw;
let _drawnPath;

const _greys = [
  '#fff7ed',
  '#e5ded5',
  '#bfb982',
  '#7f7b76',
  '#403e3c',
  '#33312f',
  '#0C0C0A'
];

const _colors = [
  '#56b9d0',
  '#fbba42',
  '#f24c27',
  '#e849e3',
  '#5072ff',
  '#a1dca7',
  '#f0f0f2'
];

function buildSVG() {
  $('.svgs').empty();

  const pathData = $('.input').val();

  $('.svgs').append(`\
    <div class="svg-container">\
      <?xml version="1.0" encoding="UTF-8" ?>\
      <svg width="500px" height="500px" viewbox="0 0 500 500" class="svg" version="1.1" xmlns="http://www.w3.org/2000/svg">\
        <path fill="black" stroke="black" d="${pathData}"></path>\
      </svg>\
      <span class="icon has-text-successs">\
        <i class="fa fa-floppy-o"></i>\
      </span>\
    </div>\
  `);
}

function generatePath() {
  console.log("Generating....");
  _draw.clear();
  $('.lloader').show();
  $.ajax({
    url: 'https://41bc3972.ngrok.io',
    type: 'GET'
  }).done(function(response) {
    const pathStrings = response.paths;
    for (let i = 0; i < pathStrings.length; i++) {
      const path = pathStrings[i];
      if (path === "") continue;
      try {
        _drawnPath = _draw.path(path);
        _drawnPath.fill('#212025');
        if (_drawnPath.bbox().w === 0 || _drawnPath.bbox().h === 0) { 
          _drawnPath.remove();
          throw "Path with 0px width/height";
        }
      }
      catch (e) {
        console.log(`Problem creating path: ${path}`);
        continue;
      }

      $('.lloader').hide();
      $('.controls').fadeIn();
      const maxScale = 0.667;
      const widthScale = maxScale / (_drawnPath.bbox().w / _draw.width());
      const heightScale = maxScale / (_drawnPath.bbox().h / _draw.height());
      //_drawnPath.scale(widthScale, heightScale);
      _drawnPath.size(_draw.width() * maxScale, _draw.height() * maxScale);

      const xMove = _drawnPath.transform().x + ((_draw.width() - _drawnPath.bbox().w) / 2) - _drawnPath.bbox().x;
      const yMove =  _drawnPath.transform().y + ((_draw.height() - _drawnPath.bbox().h) / 2) - _drawnPath.bbox().y;
      _drawnPath.translate(xMove, yMove);
    }

    if (_drawnPath === null) console.log("No paths generated");
  });
}

$(function() {
  $('.lloader').hide();

  for(let i = 0; i < _greys.length; i++) {
    const monoLeft = `<div class="bg-color" style="background-color: ${_greys[i]}"></div>`;
    const monoRight = `<div class="path-color" style="background-color: ${_greys[i]}"></div>`;
    $('.controls-left').append(monoLeft);
    $('.controls-right').append(monoRight);
  }

  for(let i = 0; i < _colors.length; i++) {
    const colorLeft = `<div class="bg-color" style="background-color: ${_colors[i]}"></div>`;
    const colorRight = `<div class="path-color" style="background-color: ${_colors[i]}"></div>`;
    $('.controls-left').append(colorLeft);
    $('.controls-right').append(colorRight);
  }

  $('.preview').on('click', function() {
    buildSVG();
  });

  $('.path-form').on('submit', function(e) {
    e.preventDefault();
    buildSVG();
  });

  $('.generate').on('click', function() {
    if (!_draw) _draw = SVG('svgs').size(500, 500);
    generatePath();
  })

  $(document).on('click', '.color', function() {
    $(this).toggleClass('selected');
    const selected = $('.selected');
    if (selected.length > 1) {
      const colors = selected.map((el) => $(el).css('backgroundColor'));
      $('.pairing').fadeIn(150);
      $('.pairing').css('')
    } else {
      $('.pairing').fadeOut(150);
    }
  });

  $(document).on('click', '.bg-color', function() {
    const color = $(this).css('background-color');
    _draw.fill(color);
  });

  $(document).on('click', '.path-color', function() {
    console.log("path COLOR");
    const color = $(this).css('background-color');
    _drawnPath.fill(color);
  });

  $(document).on('click', '.remove-color', function() {
    $(this).closest('.color-container').remove();
  });

  $(document).on('click', 'svg', function() {
    //const svgData = $(this).parent().html();
    const svgData = $(this).parent().get(0);
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgData);

    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
      source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
    }
  
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

    //var svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
    //var svgUrl = URL.createObjectURL(svgBlob);

    var svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
    var downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `${Date.now()}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  });

  $('#colors-input').focus();
})