function buildPalette() {
    $('.palettes').empty();

    const inputColors = $('.input').val().split(/[ ,]+/).sort(function(a, b) {
        return tinycolor(a).getBrightness() - tinycolor(b).getBrightness();
    }).map((c) => tinycolor(c));

    const palette = $('<div class="palette tile is-parent is-12"></div>');

    for (let i = 0; i < inputColors.length; i += 1) {
        const color = inputColors[i];
        const colorContainer = $('<div class="color-container tile is-parent is-vertical"></div>');
        const colorMarkup = $(`<div class="color tile is-vertical" style="background-color: ${color.toHexString()}"></div>`);
        let heroColor = tinycolor.mostReadable(color, inputColors);
        const heroReadable = tinycolor.readability(color, heroColor) > 3;
        if (!heroReadable) {
            heroColor = tinycolor.mostReadable(color, inputColors, { includeFallbackColors: true });
        }
        const heroText = color.toName() ? color.toName() : color.toHexString();
        colorMarkup.append(`<h1 style="color: ${heroColor.toHexString()}">${heroText}</h1>`);
        colorContainer.append(colorMarkup);
       
        const colorsClone = inputColors.slice();
        colorsClone.splice(i, 1);
        const gradientContainer = $('<div class="gradient-container"></div>');
        for (let j = 0; j < colorsClone.length; j += 1) {
            const angle = 180;
            const toColor = tinycolor(colorsClone[j]);
            const gradient = `background-image: linear-gradient(${angle}deg, ${color.toHexString()} 0%, ${toColor.toHexString()} 100%);`;
            gradientContainer.append(`<div class="gradient" style="${gradient}"></div>`);
        }
        colorContainer.append(gradientContainer);
 
        const monos = tinycolor(color).monochromatic(5).slice(1, 5);
        const monoContainer = $('<div class="mono-container"></div>');
        for (let j = 0; j < monos.length; j += 1) {
            monoContainer.append(`<div class="mono" style="background-color: ${tinycolor(monos[j]).toHexString()};"></div>`); 
        }
        colorContainer.append(monoContainer);

        const controlsContainer = $('<div class="controlsContainer"><i class="fa fa-times remove-color"></i></div>');
        colorContainer.append(controlsContainer);

        palette.append(colorContainer);
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
    })

    $('#colors-input').focus();
})