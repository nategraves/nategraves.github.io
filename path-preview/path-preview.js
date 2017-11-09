function buildSVG() {
    $('.svgs').empty();

    const pathData = $('.input').val();

    $('.svgs').append(`\
        <?xml version="1.0" encoding="UTF-8" ?> \
        <svg width="500px" height="500px" viewbox="0 0 500 500" class="svg" version="1.1" xmlns="http://www.w3.org/2000/svg"> \
            <path fill="black" stroke="black" d="${pathData}"></path> \
        </svg>`);
    //$('.input').val('');
}

$(function() {
    $('.preview').on('click', function() {
        buildSVG();
    });

    $('.path-form').on('submit', function(e) {
        e.preventDefault();
        buildSVG();
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
    });

    $('#colors-input').focus();
})