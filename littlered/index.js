    // The amount of circles we want to make:
    var count = 150;
    var logoSVG = document.getElementById('logo');
    var logoItem = null;
    var vb = view.bounds;

    // Create a symbol, which we will use to place instances of later:
    var path = new Path.Circle({
      center: [0, 0],
      radius: 10,
      fillColor: 'white'
    });

    var mainPath2 = new Path.Circle({
      center: vb.center,
      radius: vb.height / 4,
      fillColor: '#fd5139',
      name: 'main'
    });

    var mainPath2 = new Path.Circle({
      center: vb.center,
      radius: vb.height / 4,
      fillColor: 'white',
      opacity: 0.4,
      name: 'main2'
    });

    project.importSVG(logoSVG, {expandShapes: true}, function(logoItem) {
      logoItem.fillColor = 'black';
      logoItem.bringToFront();
      logoItem.name = 'logo';
      var delta = logoItem.bounds.center - vb.center;
      /*
      logoItem.translate(delta);
      var result = mainPath.subtract(logoItem[1]);
      result.fillColor = 'black';
      result.bringToFront();
      result.position = [200,200];
      result.name = 'logo';
      */
    });

    var symbol = new Symbol(path);

    for (var i = 0; i < count; i++) {
      var center = Point.random() * view.size;
      var placedSymbol = symbol.place(center);
      placedSymbol.scale(i / count);
    }

    function onFrame(event) {
      for (var i = 0; i < count; i++) {
        var item = project.activeLayer.children[i];
        if (item.name === 'main' || item.name === 'main2') { 
          if (event.count % 3 === 0 && item.name == 'main2') {
            item.radius += math.randomInt(-50, 50);
            item.position.x += math.randomInt(-10, 10);
            item.position.y += math.randomInt(-10, 10);
            item.sendToBack();
          } else {
            item.position = view.bounds.center;
            item.radius = view.bounds.height / 2;
          }
        } else if (item.name === 'result' || item.name == 'logo') {
          item.position = view.bounds.center;
          var segments = item.children[1].children[0].children[0].segments;
          for (var i = 0; i < segments.length; i++) {
            var segment = segments[i];
            var sinus = Math.sin(event.time * 3 + i);
          }
        } else {
          item.position.x += item.bounds.width / 20;
          if (item.bounds.left > view.size.width) {
            item.position.x = -item.bounds.width;
          }
        }
      }
}
