(function($)
{
    $.fn.player =
    function()
    {
        var $this = $(this)
        var url = $this.attr('src')
        
        // Setup UI components.
        var $colors = $('ul', $this)
        var $playfield = $('table', $this)
        var $style = $('style', $this)
        var $check = $('button', $this)

        $.getJSON(url,
        function (data)
        {
            $colors.empty()
            $style.empty()

            var colors = []
            var colormap = {}

            $.each(data.colors,
            function addColor(key)
            {
                var $li = $('<li>').appendTo($colors)
                var r = this[0]
                var g = this[1]
                var b = this[2]
                $li.addClass('puzzle-color')
                var rgb = 'rgb(' + r + ', ' + g + ', ' + b + ')'
                var index = colors.length
                $style.append('[pixel_color="' + index + '"]' +
                                ' { background: ' + rgb + '} ')
                $li.attr('pixel_color', index)
                $li.css('cursor', 'pointer')
                $li.click(function () { select_palette_color(index) })
                colormap[key] = index
                colors.push(rgb)
            })

            select_palette_color(0)

            var cells = []
            $.each(data.pixels,
            function ()
            {
                var row = []
                cells.push(row)
                for (var i = 0; i < this.length; ++i)
                {
                    row.push(colormap[this.substr(i, 1)])
                }
            })

            $playfield.css('font-size', '4em')
            $playfield.css('width', data.width + 'em')
            $playfield.css('height', data.width + 'em')
            puzzle_level($playfield, cells, 2)
        })

        var current_cell_color
        function select_palette_color(index)
        {
            $('li', $colors).css('border', 'solid 1px black')
            $('[pixel_color=' + index + ']', $colors)
                .css('border', 'solid 3px green')
            current_cell_color = index 
        }

        function puzzle_level($playfield, cells, factor)
        {
            $playfield.empty()
            for (var row = 0; row < factor; ++row)
            {
                var $tr = $('<tr>').appendTo($playfield)
                for (var col = 0; col < factor; ++col)
                {
                    var $td = $('<td>').appendTo($tr)
                    $td.css('border', 'solid 1px')
                    $td.css('cursor', 'pointer')
                    $td.click(function() 
                    { $(this).attr('pixel_color', current_cell_color) })

                    // Figure out the right color for this cell
                    var size = cells.length
                    var step = size / factor
                    var stats = {}
                    for (var dy = 0; dy < step; ++dy)
                    {
                        for (var dx = 0; dx < step; ++dx)
                        {
                            var color = cells[dy][dx]
                            stats[color] = (stats[color] || 0) + 1
                        }
                    }

                    var keys = Object.keys(stats)
                    keys.sort(function(a, b) { return stats[a] - stats[b] })
                    $td.attr('correct', keys[0])
                }
            }
        }

    }
})(jQuery);
