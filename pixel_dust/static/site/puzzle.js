(function($)
{
    function toHex(n, digits)
    {
        var s = n.toString(16)
        while (s.length < digits)
        {
            s = "0" + s
        }
        return s
    }

    // Setup things that can be run regardless of when they're loaded
    function plugin(name, fn, $sel)
    {
        var args = Array.prototype.slice.call(2)
        $.fn[name] = fn
        if ($sel)
        {
            $sel = $($sel)
            $('body').on('DOMNodeInsertedIntoDocument', $sel, 
                         function(event) { fn.apply($(event.target), args) })
            fn.apply($sel, args)
            return fn
        }
    }

    function puzzle_player()
    {
        $(this).each(
        function setup_player()
        {
            // Capture the configuration and download the puzzle in question
            var $this = $(this)
            var url = $this.attr('src')

            // Capture UI elements
            var $colors = $('.palette', $this)
            var $playfield = $('.playfield', $this)
            var $check = $('button', $this)

            // Go get that puzzle (solution)
            var solution = new PuzzleSolution()
            solution.load(url,
            function start_puzzle(solution)
            {
                // Reset and populate components
                $playfield.empty()

                $colors.puzzle_palette(solution.colors)
                $colors.bind('color', 
                             function(event, color) { select_palette(color) })

                $colors.children().first().click() 

                split($playfield, 0, 0, solution.width, solution.height)
            })

            var current_color
            function select_palette(color)
            {
                current_color = color
            }

            function split($area, x, y, width, height, color)
            {
                $area.addClass('pixel-area')
                color = color || solution.colors[0]

                var hwidth = width / 2;
                var hheight = height / 2;

                for (var yd = 0; yd < 2; ++yd)
                {
                    for (var xd = 0; xd < 2; ++xd)
                    {
                        // Figure out the predominant colors in that area.
                        var x0 = x + hwidth * xd
                        var y0 = y + hheight * yd
                        var hist = 
                            solution.grouped_sorted_histogram
                            (x0, y0, hwidth, hheight)

                        // Select randomly from the top colors
                        var choices = hist[0]
                        var correct = choices[Math.floor(Math.random() 
                                                         * choices.length)]
                        
                        // Create the div and position

                        var $div = $('<div>').appendTo($area)
                        $div.addClass('pixel')
                        $div.css('left', (xd * 50) + '%')
                        $div.css('top', (yd * 50) + '%')
                        $div.attr('correct', correct.index)
                        $div.css(color.css)
                        $div.attr('pixel-color', color.index)
                        $div.attr({
                            x: x0,
                            y: y0,
                            width: hwidth,
                            height: hheight
                        })
                        $div.fadeIn()

                        // Hook up the color change and status update bits.
                        $div.click(function() { set_pixel_color(this) })
                    }
                }

                var $scoreboard = $('<div>').appendTo($area)
                $scoreboard.addClass('pixel-scoreboard')
                $('<span>').appendTo($scoreboard)
                           .addClass('pixels-right badge badge-success')
                $('<span>').appendTo($scoreboard)
                           .addClass('pixels-close badge badge-warning')
                $('<span>').appendTo($scoreboard)
                           .addClass('pixels-wrong badge badge-important')
                $scoreboard.click( function() { return true } )
                $('span', $scoreboard).click( function() { return true } )
                
                check_solution($area)
            }

            function set_pixel_color($pixel, color)
            {

                color = color || current_color
                $pixel = $($pixel)
                $pixel.attr('pixel-color', color.index)
                $pixel.animate(color.css)
                check_solution($pixel.parent())
            }

            function check_solution($split)
            {
                var right = 0
                var want_colors = {}
                var got_colors = {}

                $split.children('.pixel').each(
                function check()
                {
                    var $pixel = $(this);
                    var correct = $pixel.attr('correct')
                    var current = $pixel.attr('pixel-color')
                    if (correct == current)
                    {
                        right++
                    }
                    else
                    {
                        want_colors[correct] = (want_colors[correct] || 0) + 1
                        got_colors[current] = (got_colors[current] || 0) + 1
                    }
                })

                var close = 0

                $.each(got_colors,
                function(color_index, count)
                {
                    close += Math.max(0, 
                                      (want_colors[color_index] || 0) - count)
                })

                var wrong = 4 - right - close

                if (right == 4)
                {
                    $split.children('.pixel-scoreboard').remove()
                    $split.children('.pixel').each(
                    function subsplit()
                    {
                        var $pixel = $(this)
                        var x = parseInt($pixel.attr('x'))
                        var y = parseInt($pixel.attr('y'))
                        var width = parseInt($pixel.attr('width'))
                        var height = parseInt($pixel.attr('height'))
                        var color_index = parseInt($pixel.attr('pixel-color'))
                        var color = solution.colors[color_index]
                        $pixel.unbind('click')
                        if (width > 1 && height > 1)
                        {
                            split($pixel, x, y, width, height, color)
                        }
                        else
                        {
                            $pixel.attr('completed', 1)
                            $pixel.css('border', 'none')
                            while(true)
                            {
                                var complete = 0
                                $pixel.children().each(
                                function()
                                {
                                    if ($(this).attr('completed'))
                                    {
                                        complete += 1
                                    }
                                })

                                if (complete == 4)
                                {
                                    $pixel.attr('completed', 1)
                                    $pixel.css('border', 'none')
                                }

                                if ($pixel.hasClass('playfield'))
                                {
                                    break
                                }
                                $pixel = $pixel.parent()
                            }

                            if ($playfield.attr('completed'))
                            {
                                game_finished()
                            }
                        }
                    })
                }
                else
                {
                    var $scoreboard = $split.children('.pixel-scoreboard')
                    $('.pixels-right', $scoreboard).html(right)
                    $('.pixels-wrong', $scoreboard).html(wrong)
                    $('.pixels-close', $scoreboard).html(close)
                }
            }

            function game_finished()
            {
                var $dialog = $('<div>').addClass('modal fade hide')
                var $hdr = $('<h3>').appendTo($dialog).addClass('modal-header')
                var $bdy = $('<div>').appendTo($dialog).addClass('modal-body')
                var $ftr = $('<div>').appendTo($dialog).addClass('modal-footer')

                $hdr.html('Congratulations!') 

                var name = solution.name
                var article
                switch (name.substr(0, 1).toLowerCase())
                {
                case 'a':
                case 'e':
                case 'i':
                case 'o':
                case 'u':
                    article = 'an'
                    break
                default:
                    article = 'a'
                }

                $bdy.html("It's " + article + " " + name)

                var $close = $('<button>').addClass('btn btn-primary')
                                          .appendTo($ftr)
                $close.html('Close')
                $close.attr('data-dismiss', 'modal')

                $dialog.modal()
            }
        })
    }

    function PuzzleSolution()
    {
    }
    PuzzleSolution.prototype =
    {
        // Load via AJAX and invoke callback if provided when successful.
        load:
        function load(url, callback)
        {
            var self = this
            $.getJSON(url, 
            function(data) 
            { 
                self.update_from_json_data(data) 
                if (callback != null)
                {
                    callback(self)
                }
            })
        },

        // Convert JSON data into internal staet
        update_from_json_data:
        function update_from_json_data(data)
        {
            var self = this
            self.id = data.id
            self.name = data.name
            self.colors = [] 
            self.pixels = []
            self.width = data.width
            self.height = data.width
            self.hint = data.hint

            var color_key = {}

            // Convert colors into more easily digested form.
            $.each(data.colors,
            function add_color(key, color)
            {
                var value = jQuery.Color(color)
                var color =
                {
                    index: self.colors.length,
                    css: { 'background-color': value },
                    value: value,
                    code: key,
                }
                color_key[key] = color
                self.colors.push(color)
            })

            // Convert string pixel data in to references to colors
            for (var y = 0; y < self.height; ++y)
            {
                var row = []
                self.pixels.push(row)
                for (var x = 0; x < self.width; ++x)
                {
                    var color = color_key[data.pixels[y].substr(x, 1)]
                    var pixel =
                    {
                        x: x,
                        y: y,
                        color: color
                    }
                    row.push(self.pixels[x + ':' + y] = pixel)
                }
            }
        },

        histogram:
        function histogram(x, y, width, height)
        {
            x = x || 0
            y = y || 0
            width = width || this.width
            height = height || this.height

            var results = {}

            for (var dy = 0; dy < height; ++dy)
            {
                for (var dx = 0; dx < width; ++dx)
                {
                    var color = this.pixels[y + dy][x + dx].color
                    results[color.index] = (results[color.index] || 0) + 1
                }
            }

            return results
        },

        sorted_histogram:
        function sorted_histogram()
        {
            var self = this
            var results = this.histogram.apply(this, arguments)

            // Make a more elaborate sorted result
            var sorted = []
            $.each(results,
            function(index, count)
            {
                sorted.push(
                { 
                    index: index,
                    color: self.colors[index],
                    count: count
                })
            })

            sorted.sort(function(a, b) { return -(a.count - b.count) })
            return sorted
        },

        grouped_sorted_histogram:
        function grouped_sorted_histogram()
        {
            var self = this
            var results = this.sorted_histogram.apply(this, arguments)

            // Now convert the sorted into groups for easy detection of
            // duplicates.  Because it's already sorted, we can just look
            // at the last entry to determine if we need a new group.
            var groups = []
            $.each(results,
            function(index, result)
            {
                var count = result.count
                var group
                if (groups.length)
                {
                    group = groups[groups.length - 1]
                }
                if (group == null || group.count != count)
                {
                    groups.push(group = [])
                }
                group.push(result)
            })

            return groups
        }
    }

    plugin('puzzle_palette',
    function palette(colors)
    {
        var $this = $(this)
        $this.empty()
        $this.attr('data-toggle', 'buttons-radio')

        $.each(colors,
        function setup_colors(index, color)
        {
            var $btn = $('<a href="#">').appendTo($this)
            $('<input type="hidden">')
                .appendTo($this)
                .attr('name', 'color')
                .val(color.code)
            $('<input type="hidden">')
                .appendTo($this)
                .attr('name', 'color-' + color.code)
                .val(color.value.toHexString())
            $btn.addClass('pixel-palette btn')
            $btn.attr('pixel-color', color.index)
            var $div = $('<div>').appendTo($btn)
            $div.css(color.css)
            $btn.click(function() { $this.trigger('color', color) })
        })
    })

    function puzzle_editor()
    {
            // Capture the configuration and download the puzzle in question
            var $this = $(this)
            var url = $this.attr('src')

            // Capture UI elements
            var $colors = $('.palette', $this)
            var $pixels = $('.pixel-grid', $this)
            var $fill = $('.fill-btn', $this)
            console.log($fill)

            // Go get that puzzle (solution)
            var solution = new PuzzleSolution()
            solution.load(url,
            function process_puzzle(solution)
            {
                // Reset and populate components
                $colors.puzzle_palette(solution.colors)
                $colors.bind('color', 
                             function(event, color) { select_palette(color) })

                $colors.children().first().click() 

                $pixels.edit_grid(
                {
                    width: solution.width,
                    height: solution.height,
                    src: solution.pixels,
                    default_color: solution.colors[0],
                })
                $pixels.bind('set_color',
                function set_color(event, $dest, color)
                {
                    color = color || current_color
                    $($dest).animate(color.css)
                    $('input', $($dest)).val(color.code)
                })

                console.log(solution)
                $('[name=_id]').val(solution.id)
                $('[name=title]').val(solution.name)
                $('[name=hint]').text(solution.hint)
                $('[name=width]').val(solution.width)
            })
       
            var current_color
            function select_palette(color)
            {
                current_color = color
            }

            function fill(color)
            {
                $pixels.trigger('fill', color)
            }

            $fill.click(function() 
            { 
                fill(current_color) 
            })
    }

    plugin('edit_grid',
    function edit_grid(options)
    {
        var $this = $(this)
        var width = options.width
        var height = options.height
        var src = options.src
        var default_color = options.default_color

        $this.empty()
        var $table = $('<table>').appendTo($this)

        for (var y = 0; y < height; ++y)
        {
            var $row = $('<tr>').appendTo($table)
            for (var x = 0; x < width; ++x)
            {
                var $cell = $('<td>').appendTo($row)
                $cell.css('border', 'solid 1px black')
                $cell.css('width', '1em')
                $cell.css('height', '1em')
                var pixel = src[y][x]
                $cell.css(pixel.color.css);
                $('<input type="hidden">')
                    .appendTo($cell)
                    .val(pixel.color.code)
                    .attr('name', x + ',' + y);
                (function($cell)
                {
                    $cell.click(
                    function ()
                    {
                        $this.trigger('set_color', $cell)
                    })
                })($cell)
            }
        }

        $this.bind('fill',
        function(event, color)
        {
            $('td', $this).each( 
            function () 
            { 
                $this.trigger('set_color', [$(this), color]) 
            })
        })
    })

    plugin('puzzle_player', puzzle_player, '.puzzle-player')
    plugin('puzzle_editor', puzzle_editor, '.puzzle-editor')
})(jQuery);

