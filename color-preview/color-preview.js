function buildPalette() {
    const inputColors = $('.input').val().split(/[ ,]+/).sort(function(a, b) {
        return tinycolor(a).getBrightness() - tinycolor(b).getBrightness();
    }).map((c) => tinycolor(c));

    const palette = $('<div class="palette tile is-parent is-12"></div>');

    for (let i = 0; i < inputColors.length; i += 1) {
        /*
        let greys = inputColors.slice();
        greys = greys.map((c) => {
          return c.greyscale();
        });
        */
        const color = inputColors[i];
        const colorMarkup = $(`<div class="color tile is-vertical" style="background-color: ${color.toHexString()}"></div>`);
        const heroColor = tinycolor.mostReadable(color, inputColors, { includeFallbackColors: false });
        const heroText = color.toName() ? color.toName() : color.toHexString();
        const hero = [
          `<div class="hero">`,
            `<h1 style="color: ${heroColor.toHexString()}">${heroText}</h1>`,
          `</div>`
        ].join('');
        colorMarkup.append(hero);
        
        /*
        const colorsClone = inputColors.slice();
        colorsClone.splice(i, 1)
        const randPairs = math.pickRandom(colorsClone, 2); 
        for (let j = 0; j < randPairs.length; j += 1) {
            colorMarkup.append(`<div class="pair" style="background-color: ${tinycolor(randPairs[j]).toHexString()};"></div>`);
        }
        */
        palette.append(colorMarkup);
    }

    $('.palettes').append(palette);
    $('.input').val('');
}

$(function() {
    $('.preview').on('click', function() {
        buildPalette();
    });

    $('.color-form').on('submit', function(e) {
        e.preventDefault();
        buildPalette();
    });

    $(document).on('click', '.color', function() {
        console.log("clickly");
    })
})