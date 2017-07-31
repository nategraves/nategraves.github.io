document.onload = start();

var start = function() {
  var canvas = document.getElementById('first');
  paper.setup(canvas);
  var logoSVG = document.getElementById('logo');
  var logoItem = null;
  var svgSymbol = null;
  var vb = view.bounds;

  var path = new paper.Path.Circle({
    center: [-10, -10],
    radius: 10,
    fillColor: 'white'
  });

  var svgPaths = [];
  project.importSVG(logoSVG, function(svg) {
    logoItem = svg;
    //svgSymbol = new Symbol(svg);
    var delta =  vb.center - logoItem.bounds.center;
    logoItem.translate(delta);
    logoItem.onMouseEnter = function(event) {
      var topLeft = clone
      this.remove();
    };
    for (var i = 1; i < logoItem.children.length; i++) {
      var child = logoItem.children[i];
      if (child.children && child.children.length > 0) {
        for (var j = 0; j < child.children.length; j++) {
          if (child.children[j].segments && child.children.length > 0) {
            svgPaths.push(child.children[j].segments);
          }
        }
      } else {
        if (child.segments) {
          svgPaths.push(child.segments)
        }
      }
    }
    logoItem.bringToFront();
    logoItem.name = 'logo';
  });

  function onFrame(event) {
    if (logoItem) {
      var delta =  vb.center - logoItem.bounds.center;
      logoItem.translate(delta);
    }
    if (svgPaths.length) {
      for (var i = 0; i <= svgPaths.length; i++) {
        var path = svgPaths[i];
        if (path && path.length > 0) {
          for (var p = 0; p < path.length; p++) {
            var sinus = Math.sin(event.time * 3 + p);
            var point = path[p].point;
            // console.log(math.round(sinus * 5));
            // point.y = sinus * 1;
          }
        }
      }
    }
  }
};