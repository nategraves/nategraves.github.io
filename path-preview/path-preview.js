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
  $('.lloader').show();
  $.ajax({
    url: 'https://93e9ced1.ngrok.io',
    type: 'GET'
  }).done(function(response) {
    const pathStrings = response.path.split(/\r?\n/);
    const draw = SVG('svgs').size(300, 300);
    let drawnPath;
    for (let i = 0; i < pathStrings.length; i++) {
      const path = pathStrings[i];
      if (path === "") continue;
      try {
        drawnPath = draw.path(path);
        if (drawnPath.bbox().w === 0 || drawnPath.bbox().h === 0) { throw "Path with 0px width/height"; }
      }
      catch (e) {
        console.log(`Problem creating path: ${path}`);
        continue;
      }

      $('.lloader').hide();

      const maxScale = 0.667;
      const widthScale = maxScale / (drawnPath.bbox().w / draw.width());
      const heightScale = maxScale / (drawnPath.bbox().h / draw.height());
      //drawnPath.scale(widthScale, heightScale);
      drawnPath.size(draw.width() * maxScale, draw.height() * maxScale);

      const xMove = drawnPath.transform().x + ((draw.width() - drawnPath.bbox().w) / 2) - drawnPath.bbox().x;
      const yMove =  drawnPath.transform().y + ((draw.height() - drawnPath.bbox().h) / 2) - drawnPath.bbox().y;
      drawnPath.translate(xMove, yMove);
    }

    if (drawnPath === null) console.log("No paths generated");
  });
}

$(function() {
  $('.lloader').hide();

  $('.preview').on('click', function() {
    buildSVG();
  });

  $('.path-form').on('submit', function(e) {
    e.preventDefault();
    buildSVG();
  });

  $('.generate').on('click', function() {
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

  $(document).on('click', '.remove-color', function() {
    $(this).closest('.color-container').remove();
  });

  /*
  $(document).on('click', 'svg', function() {
    var svgData = $(this).html();
    var svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = "newesttree.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  });
  */

  $('#colors-input').focus();
})