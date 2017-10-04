function buildPalette() {
    const colors = $('.input').val().split(/[ ,]+/).sort(function(a, b) {
        return tinycolor(a).getBrightness() - tinycolor(b).getBrightness();
    });

    const palette = $('<div class="palette tile is-parent is-12"></div>');

    for (let i = 0; i < colors.length; i += 1) {
        const color = colors[i];
        const bgColor = tinycolor(color);
        const bgStyle = `background-color: ${bgColor.toHexString()};`;
        const lightClass = bgColor.isLight() ? 'light' : 'dark';
        const colorText = `<p class="${lightClass}">${bgColor.toHexString()}</p>`;
        const colorMarkup = $(
        `<div class="color tile is-vertical" style="${bgStyle}">${colorText}</div>`
        );

        const colorsClone = colors.slice();
        colorsClone.splice(i, 1)
        const randPairs = math.pickRandom(colorsClone, 2); 
        for (let j = 0; j < randPairs.length; j += 1) {
        colorMarkup.append(`<div class="pair" style="background-color: ${tinycolor(randPairs[j]).toHexString()};"></div>`)

        }
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
})