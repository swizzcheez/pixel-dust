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

    function setup_audio(base)
    {
        // IE sux...
        try
        {
            var audio = new Audio(base + '.wav')
            audio.load()
            return audio
        }
        catch(e)
        {
            // If it didn't work, don't fret about it.  We just won't use
            // sound.  IE8 and below for instance.
            $.error(e)
            return null;
        }
    }

    function play(audio)
    {
        if (audio != null)
        {
            audio.play()
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
            var $score = $('.score', $this)
            var running = false

            var STARTUP_GRACE_TIME = $this.attr('grace-time') || 3000
            var COMPLETE_BONUS = $this.attr('complete-bonus') || 50
            var TICK_SCORE_LOSS = $this.attr('tick-loss') || 1
            var PUZZLE_COLOR_BASIS = $this.attr('puzzle-color-points') || 25
            var WARN_TIME = $this.attr('warning-time') || 5000
            var TICK_TIME = $this.attr('tick-ms') || 100

            function adjust_score(delta)
            {
                return set_score(get_score() + delta)
            }

            function set_score(new_score)
            {
                $score.text(new_score)
                return new_score
            }

            function get_score()
            {
                return parseInt($score.text())
            }

            // Get and setup audio
            var wrong_snd = setup_audio(
                $this.attr('wrong') || '/static/sound/gulp')
            var right_snd = setup_audio(
                $this.attr('right') || '/static/sound/right')
            var match_snd = setup_audio(
                $this.attr('match') || '/static/sound/whip-whip')
            var win_snd = setup_audio(
                $this.attr('win') || '/static/sound/win')
            var alarm_snd = setup_audio(
                $this.attr('alarm') || '/static/sound/timesup')
            var lose_snd = setup_audio(
                $this.attr('lose') || '/static/sound/lose')

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

                set_score(solution.compute_par_score(PUZZLE_COLOR_BASIS))

                running = true
                var warn_score = WARN_TIME / (TICK_TIME / TICK_SCORE_LOSS)
                var warned = false
                setTimeout(
                function()
                {
                    function tick()
                    {
                        if (running)
                        {
                            var score = adjust_score(-TICK_SCORE_LOSS)
                            if (score > 0)
                            {
                                if (score < warn_score)
                                {
                                    if (!warned)
                                    {
                                        play(alarm_snd)
                                        warned = true
                                    }
                                }
                                else
                                {
                                    warned = false
                                }
                                setTimeout(tick, TICK_TIME)
                            }
                            else
                            {
                                // Game over, man!
                                play(lose_snd)
                                game_finished(false)
                            }
                        }
                    }

                    tick()
                }, STARTUP_GRACE_TIME)
            })

            var current_color
            function select_palette(color)
            {
                current_color = color
            }

            $('body').bind('keypress',
            function pressed(event)
            {
                var key = String.fromCharCode(event.charCode)
                switch(key)
                {
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9':
                    $('[pixel-color="' 
                        + (parseInt(key) - 1) + '"]', $colors).click()
                    return false
                case '0':
                    $('[pixel-color=9"' + key + '"]', $colors).click()
                    return false
                }
            })

            function split($area, x, y, width, height, color, auto_complete)
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
               
                check_solution($area, auto_complete)
            }

            function set_pixel_color($pixel, color)
            {

                color = color || current_color
                $pixel = $($pixel)
                $pixel.attr('pixel-color', color.index)
                $pixel.animate(color.css)
                if (check_solution($pixel.parent()) && running)
                {
                    adjust_score(COMPLETE_BONUS)
                }
            }

            function check_solution($split, auto_complete)
            {
                var right = 0
                var want_colors = {}
                var got_colors = {}
                auto_complete = auto_complete || false

                $split.children('.pixel').each(
                function check()
                {
                    var $pixel = $(this);
                    var correct = $pixel.attr('correct')
                    var current = $pixel.attr('pixel-color')

                    if (auto_complete)
                    {
                        $pixel.attr('pixel-color', correct)
                        current = correct
                        $pixel.animate(solution.colors[correct].css)
                    }

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

                var close = 4 - right

                $.each(got_colors,
                function(color_index, count)
                {
                    var wanted = want_colors[color_index] || 0
                    if (count > wanted)
                    {
                        close -= (count - wanted)
                    }
                })

                var wrong = 4 - right - close

                if (auto_complete || right == 4)
                {
                    if (! auto_complete)
                    {
                        play(match_snd)
                    }
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
                            split($pixel, x, y, width, height, color, 
                                  auto_complete)
                        }
                        else
                        {
                            $pixel.attr('completed', 1)
                            $pixel.css('border', 'solid 1px black')
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

                            if ($playfield.attr('completed') && ! auto_complete)
                            {
                                game_finished(true)
                            }
                        }
                    })
                }
                else
                {
                    // Better or worse than before?
                    var $scoreboard = $split.children('.pixel-scoreboard')
                    var $right = $('.pixels-right', $scoreboard)
                    var was_right = parseInt($right.html())
                    var delta = right - was_right
                    if (delta > 0)
                    {
                        play(right_snd)
                    }
                    else
                    {
                        play(wrong_snd)
                    }

                    $('.pixels-right', $scoreboard).html(right)
                    $('.pixels-wrong', $scoreboard).html(wrong)
                    $('.pixels-close', $scoreboard).html(close)
                }

                return right == 4
            }

            function game_finished(won)
            {
                var $dialog = $('<div>').addClass('modal fade hide')
                var $hdr = $('<h3>').appendTo($dialog).addClass('modal-header')
                var $bdy = $('<div>').appendTo($dialog).addClass('modal-body')
                var $ftr = $('<div>').appendTo($dialog).addClass('modal-footer')

                running = false
                if (won)
                {
                    $hdr.html('Congratulations!') 
                }
                else
                {
                    $hdr.html("Time's Up!") 
                }
                play(win_snd)
                check_solution($playfield, true)

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

                var $isa = $('<div>').appendTo($bdy)
                    .html("It's " + article + " " + name)
                var $score = $('<div>').appendTo($bdy)
                    .html('Score: ' + get_score())

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
                    code: key
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
        },

        compute_par_score:
        function compute_par_score(basis, x, y, width, height)
        {
            var self = this
            if (width < 2 || height < 2)
            {
                return 0
            }
            else
            {
                x = x || 0
                y = y || 0
                width = width || self.width
                height = height || self.height

                var hist = self.histogram(x, y, width, height)
                var colors = 0
                $.each(hist,
                function(key, value)
                {
                    if (value > 0)
                    {
                        colors++
                    }
                })

                var score = (colors - 1) * basis

                // Also add in subordinates.
                var hwidth = width / 2
                var hheight = height / 2
                for (var dy = 0; dy < 2; ++dy)
                {
                    for (var dx = 0; dx < 2; ++dx)
                    {
                        score += this.compute_par_score(
                            basis,
                            x + dx * hwidth, y + dy * hheight,
                            hwidth, hheight)
                    }
                }

                return score
            }
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
            $btn.addClass('dusted').css('font-size: 2em')
            var key = color.index + 1
            if (key < 10)
            {
                $btn.html(key)
            }
            else
            {
                $btn.html('0')
            }
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
                    default_color: solution.colors[0]
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
                $cell.css('border', 'solid 1px #FFFFFF')
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

